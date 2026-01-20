/**
 * Query utilities for timeout handling and AbortController integration
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
 * Default query options for better cache utilization and performance
 */
export const defaultQueryOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes - use cached data
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
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
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
} as const;
