import { acquireFetchSlot, releaseFetchSlot } from "@/lib/queryUtils";

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

type SupabaseQueryBuilder<T> = Promise<SupabaseQueryResult<T>> & {
  abortSignal(signal: AbortSignal): SupabaseQueryBuilder<T>;
};

/**
 * Wrapper for Supabase queries with real timeout, concurrency control, and AUTO-RETRY.
 * PROTECTS AGAINST:
 * 1. Network stalls on resume from idle (via acquireFetchSlot)
 * 2. Infinite hanging requests (via timeout)
 * 3. Ghost/Stale connections (via retry on timeout)
 */
export async function supabaseQueryWithTimeout<T>(
  queryBuilder: SupabaseQueryBuilder<T> | Promise<SupabaseQueryResult<T>>,
  timeoutMs: number = 90000, // 90s default for robustness on slow networks
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {
  try {
    // First attempt
    return await executeQueryWithTimeout(queryBuilder, timeoutMs, signal);
  } catch (error: any) {
    // Detect Timeout OR Chrome Extension "message channel closed" errors
    const isTimeout = error.message && error.message.includes('Timeout');
    const isExtensionError = error.message && (
      error.message.includes('message channel closed') ||
      error.message.includes('Extension context invalidated') ||
      error.message.includes('object could not be cloned')
    );
    const isUserAbort = signal?.aborted || (error.name === 'AbortError');

    if ((isTimeout || isExtensionError) && !isUserAbort) {
      const waitTime = isExtensionError ? 500 : 0; // Wait a bit if it's an extension crash
      const reason = isTimeout ? `Timeout de ${timeoutMs}ms` : 'Erro de Extensão';

      console.warn(`🔄 [Retry] ${reason} detectado. Tentando novamente em ${waitTime}ms...`);

      if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));

      try {
        // Retry with same timeout
        return await executeQueryWithTimeout(queryBuilder, timeoutMs, signal);
      } catch (retryError) {
        // If retry fails, throw the original error or the new one
        throw retryError;
      }
    }
    throw error;
  }
}

/**
 * Internal execution logic with slot acquisition and race against clock
 */
async function executeQueryWithTimeout<T>(
  queryBuilder: SupabaseQueryBuilder<T> | Promise<SupabaseQueryResult<T>>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {

  const queryDesc = (queryBuilder as any)?.url?.toString() || 'Query';

  // Fast path: if already aborted by React Query
  if (signal?.aborted) {
    throw new Error('Query cancelada');
  }

  // 🚦 CONCURRENCY CONTROL: Wait for a free network slot
  // prevent browser from choking on too many simultaneous requests (Chrome max: 6 per domain)
  await acquireFetchSlot();

  const timeoutController = new AbortController();
  let timeoutId: any;

  try {
    // Promise that rejects on timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timeoutController.abort();
        reject(new Error(`Timeout de ${timeoutMs}ms excedido`));
      }, timeoutMs);
    });

    // Handle external abort signal (e.g. user navigation)
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        timeoutController.abort();
      }, { once: true });
    }

    // Execute the query
    let queryPromise: Promise<SupabaseQueryResult<T>>;

    if (typeof (queryBuilder as any).abortSignal === 'function') {
      // Inject timeout signal into Supabase client if supported
      queryPromise = (queryBuilder as SupabaseQueryBuilder<T>).abortSignal(timeoutController.signal);
    } else {
      queryPromise = queryBuilder as Promise<SupabaseQueryResult<T>>;
    }

    // Race between query and timeout
    const result = await Promise.race([
      queryPromise,
      timeoutPromise
    ]);

    clearTimeout(timeoutId);
    return result as SupabaseQueryResult<T>;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Silence expected abort/timeout errors during navigation
    const isExpectedError =
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('cancelada') ||
      error.message?.includes('Timeout');

    if (!isExpectedError) {
      console.error(`❌ [Query Error] ${queryDesc}:`, error.message || error);
    }
    throw error;
  } finally {
    // 🚦 RELEASE SLOT: Allow next query to run
    releaseFetchSlot();
  }
}
