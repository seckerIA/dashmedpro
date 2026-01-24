export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

type SupabaseQueryBuilder<T> = Promise<SupabaseQueryResult<T>> & {
  abortSignal(signal: AbortSignal): SupabaseQueryBuilder<T>;
};

/**
 * Wrapper for Supabase queries with real timeout.
 * 
 * IMPORTANT: This function does NOT retry internally.
 * React Query handles retries - doing it here creates an infinite loop.
 * 
 * PROTECTS AGAINST:
 * 1. Infinite hanging requests (via timeout)
 * 2. Extension interference (via fast timeout and clear error)
 */
export async function supabaseQueryWithTimeout<T>(
  queryBuilder: SupabaseQueryBuilder<T> | Promise<SupabaseQueryResult<T>>,
  timeoutMs: number = 5000, // 5s - fail muito rápido (era 15s)
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {
  // NO INTERNAL RETRY - React Query handles that
  // This prevents: supabase retry × react query retry = infinite loop
  return await executeQueryWithTimeout(queryBuilder, timeoutMs, signal);
}

/**
 * Internal execution logic with race against clock
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
  }
}
