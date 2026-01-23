/**
 * QUERY UTILS V3 - Utilitários SEM deadlock
 * 
 * MUDANÇAS CRÍTICAS:
 * 1. Remove bloqueio durante wake-up (causava deadlock)
 * 2. Invalidação suave em vez de cancelamento forçado
 * 3. Retry automático para queries que falharam
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configurado para recuperação automática
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            gcTime: 10 * 60 * 1000, // 10 min (era cacheTime)
            retry: (failureCount, error: any) => {
                // Não retry em erros de auth
                if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
                    return false;
                }
                // Retry até 2 vezes em outros erros
                return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
            // Refetch automático ao focar a window
            refetchOnWindowFocus: true,
            // Não refetch ao reconnect (deixa o IdleDetector cuidar)
            refetchOnReconnect: false,
        },
        mutations: {
            retry: false, // Mutations nunca retry automaticamente
        },
    },
});

/**
 * Cancela queries em andamento (útil em navegação)
 * NÃO bloqueia novas queries
 */
export function cancelOngoingQueries() {
    console.log('🧹 [QueryUtils] Cancelando queries em andamento...');

    // Cancela apenas queries que estão fetchando agora
    queryClient.cancelQueries({
        predicate: (query) => query.state.fetchStatus === 'fetching'
    });
}

/**
 * Invalida queries antigas (>10min)
 * Útil após idle longo
 */
export function invalidateStaleQueries() {
    console.log('🔄 [QueryUtils] Invalidando queries antigas...');

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    queryClient.getQueryCache().getAll().forEach(query => {
        const dataUpdatedAt = query.state.dataUpdatedAt;
        if (dataUpdatedAt && dataUpdatedAt < tenMinutesAgo) {
            queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
    });
}

/**
 * Remove queries que nunca foram carregadas
 * Útil para limpar lixo no cache
 */
export function removeNeverLoadedQueries() {
    console.log('🗑️ [QueryUtils] Removendo queries não carregadas...');

    queryClient.getQueryCache().getAll().forEach(query => {
        if (!query.state.data && query.state.status === 'pending') {
            queryClient.removeQueries({ queryKey: query.queryKey });
        }
    });
}

/**
 * Retry forçado para queries que falharam
 * Útil após renovação de sessão
 */
export function retryFailedQueries() {
    console.log('🔁 [QueryUtils] Retry de queries falhadas...');

    queryClient.getQueryCache().getAll().forEach(query => {
        if (query.state.status === 'error') {
            queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
    });
}

/**
 * Limpa tudo e reseta o cache (uso emergencial)
 * Apenas em casos extremos (logout, erro fatal)
 */
export function emergencyCacheClear() {
    console.warn('🚨 [QueryUtils] EMERGENCY: Limpando cache completo!');
    queryClient.clear();
}

/**
 * Retorna estatísticas do cache para debug
 */
export function getCacheStats() {
    const allQueries = queryClient.getQueryCache().getAll();

    const stats = {
        total: allQueries.length,
        fetching: 0,
        error: 0,
        success: 0,
        stale: 0,
        oldestUpdate: Date.now(),
    };

    allQueries.forEach(query => {
        if (query.state.fetchStatus === 'fetching') stats.fetching++;
        if (query.state.status === 'error') stats.error++;
        if (query.state.status === 'success') stats.success++;
        if (query.isStale()) stats.stale++;

        if (query.state.dataUpdatedAt && query.state.dataUpdatedAt < stats.oldestUpdate) {
            stats.oldestUpdate = query.state.dataUpdatedAt;
        }
    });

    return {
        ...stats,
        oldestAge: Date.now() - stats.oldestUpdate,
    };
}

/**
 * Reseta tracking de fetch (compatibilidade com código legado)
 */
export function resetFetchTracking(): void {
    console.log('🔓 [QueryUtils] Reset fetch tracking (no-op em V3)');
    // No-op em V3 - mantido para compatibilidade
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Check if tab is currently visible
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
 * Creates a dynamic refetchInterval function that checks visibility
 */
export function createVisibilityAwareInterval(intervalMs: number): (query: any) => number | false {
    return (_query: any) => {
        if (!isTabVisible() || !isOnline()) {
            return false;
        }
        return intervalMs;
    };
}

/**
 * Returns a refetchInterval that respects tab visibility
 */
export function getVisibilityAwareInterval(intervalMs: number): number | false {
    if (!isTabVisible()) return false;
    if (!isOnline()) return false;
    return intervalMs;
}

/**
 * Query options for real-time/frequently updating data
 */
export const realtimeQueryOptions = {
    staleTime: 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
} as const;

/**
 * Default query options for better cache utilization
 */
export const defaultQueryOptions = {
    staleTime: 30 * 60 * 1000,
    gcTime: 120 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
} as const;

/**
 * Query options for static/rarely changing data
 */
export const staticQueryOptions = {
    staleTime: 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
} as const;

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
 * Wraps a query with timeout
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
        return await Promise.race([queryFn(signal), timeoutPromise]);
    } catch (error) {
        controller.abort();
        throw error;
    }
}
