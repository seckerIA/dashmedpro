/**
 * Query utilities for timeout handling, visibility-aware refetching, and connection limiting
 */

/**
 * Creates a promise that rejects after a specified timeout
 */
export function createTimeoutPromise(ms: number, message?: string): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(message || `Query timeout after ${ms}ms`));
        }, ms);
    });
}

/**
 * Wraps a Supabase query with timeout and AbortController
 * @param queryFn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns Promise that resolves with query result or rejects on timeout
 */
export async function withQueryTimeout<T>(
    queryFn: (signal?: AbortSignal) => Promise<T>,
    timeoutMs: number = 5000
): Promise<T> {
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutPromise = createTimeoutPromise(timeoutMs).finally(() => {
        controller.abort();
    });

    try {
        return await Promise.race([
            queryFn(signal),
            timeoutPromise
        ]);
    } catch (error) {
        controller.abort();
        throw error;
    }
}

/**
 * Check if tab is currently visible
 * Used to prevent queries from running when tab is hidden
 */
export function isTabVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
}

/**
 * Returns a refetchInterval that respects tab visibility
 * When tab is hidden, returns false (disables polling)
 * When tab is visible, returns the specified interval
 * 
 * Use this in useQuery options like:
 * refetchInterval: getVisibilityAwareInterval(60000)
 */
export function getVisibilityAwareInterval(intervalMs: number): number | false {
    if (!isTabVisible()) return false;
    if (!isOnline()) return false;
    return intervalMs;
}

/**
 * Creates a dynamic refetchInterval function that checks visibility
 * Use this for useQuery's refetchInterval option
 * 
 * Example:
 * refetchInterval: createVisibilityAwareInterval(60000)
 */
export function createVisibilityAwareInterval(intervalMs: number): (query: any) => number | false {
    return (_query: any) => {
        // Disable polling when tab is hidden or offline
        if (!isTabVisible() || !isOnline()) {
            return false;
        }
        return intervalMs;
    };
}

/**
 * Default query options for better cache utilization and performance
 */
export const defaultQueryOptions = {
    staleTime: 30 * 60 * 1000, // 30 minutes - use cached data
    gcTime: 120 * 60 * 1000, // 2 hours - keep in cache
    retry: 2, // Only retry twice for faster failure
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnReconnect: true,
} as const;

/**
 * Query options for real-time/frequently updating data
 */
export const realtimeQueryOptions = {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Fail fast for real-time data
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
} as const;

/**
 * Query options for static/rarely changing data
 */
export const staticQueryOptions = {
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
} as const;

/**
 * Maximum concurrent fetching queries allowed
 * Prevents browser connection limits from being exceeded
 */
export const MAX_CONCURRENT_QUERIES = 6;

/**
 * Tracks currently fetching queries for connection limiting
 */
let activeFetchCount = 0;
const fetchQueue: Array<() => void> = [];

/**
 * Acquires a fetch slot, waiting if too many queries are in flight
 * Call releaseFetchSlot when done
 */
export async function acquireFetchSlot(): Promise<void> {
    if (activeFetchCount < MAX_CONCURRENT_QUERIES) {
        activeFetchCount++;
        return;
    }

    // Wait for a slot to become available
    return new Promise((resolve) => {
        fetchQueue.push(() => {
            activeFetchCount++;
            resolve();
        });
    });
}

/**
 * Releases a fetch slot, allowing queued fetches to proceed
 */
export function releaseFetchSlot(): void {
    activeFetchCount = Math.max(0, activeFetchCount - 1);
    const next = fetchQueue.shift();
    if (next) {
        next();
    }
}

/**
 * Gets current active fetch count (for debugging)
 */
export function getActiveFetchCount(): number {
    return activeFetchCount;
}

/**
 * Resets fetch tracking (call on auth state change or error recovery)
 */
export function resetFetchTracking(): void {
    activeFetchCount = 0;
    fetchQueue.length = 0;
}

/**
 * Reset queries que estão em estado 'pending' por mais de X segundos.
 * Chame periodicamente via setInterval para auto-recovery de queries travadas.
 * 
 * @param queryClient - Instância do QueryClient do TanStack Query
 * @param maxPendingMs - Tempo máximo em ms antes de considerar a query travada (default: 45s)
 * @returns Número de queries recuperadas
 */
export function recoverStuckQueries(
    queryClient: { getQueryCache: () => any; cancelQueries: (opts: any) => void; invalidateQueries: (opts: any) => void },
    maxPendingMs: number = 45000
): number {
    const queries = queryClient.getQueryCache().getAll();
    let recoveredCount = 0;

    for (const query of queries) {
        const state = query.state;

        // Query está em fetching mas sem resposta
        if (state.fetchStatus === 'fetching') {
            // dataUpdatedAt = 0 se nunca teve dados, ou timestamp do último sucesso
            // fetchMeta.fetchedAt não existe, então usamos heurística baseada no tempo relativo
            const lastKnownTime = state.dataUpdatedAt || query.state.errorUpdatedAt || 0;
            const now = Date.now();

            // Se a última atualização foi há mais de maxPendingMs, está travada
            // Isso funciona porque queries recém-iniciadas terão lastKnownTime == 0,
            // então comparamos com query.cacheTime (quando a query foi criada)
            const queryAge = now - (lastKnownTime || (query as any).initialDataUpdatedAt || now - maxPendingMs - 1);

            if (queryAge > maxPendingMs) {
                const queryKeyStr = Array.isArray(query.queryKey)
                    ? query.queryKey.join('/')
                    : String(query.queryKey);

                console.warn(`🔄 [QueryRecovery] Recuperando query travada (${Math.round(queryAge / 1000)}s): ${queryKeyStr}`);

                try {
                    queryClient.cancelQueries({ queryKey: query.queryKey });
                    // Não invalidamos imediatamente para evitar loop de refetch
                    // A query será refetched naturalmente na próxima interação
                    recoveredCount++;
                } catch (err) {
                    console.error(`❌ [QueryRecovery] Erro ao cancelar query:`, err);
                }
            }
        }
    }

    // Se recuperamos queries, também resetamos o tracking de fetch slots
    if (recoveredCount > 0) {
        resetFetchTracking();
    }

    return recoveredCount;
}
