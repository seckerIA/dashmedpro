/**
 * Cache abstraction layer using Upstash Redis
 * @module lib/cache
 * 
 * Este módulo fornece uma abstração para cache usando Upstash Redis.
 * Para o frontend, usamos uma Edge Function como proxy para não expor o token.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS
// ============================================

export interface CacheOptions {
    /** Time-to-live em segundos (default: 300 = 5 minutos) */
    ttl?: number;
    /** Se true, não usa cache (bypass) */
    noCache?: boolean;
}

export interface CacheResult<T> {
    data: T | null;
    fromCache: boolean;
    error?: string;
}

// ============================================
// FUNÇÕES DE CACHE (via Edge Function proxy)
// ============================================

/**
 * Busca um valor do cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const { data, error } = await supabase.functions.invoke('redis-cache', {
            body: { action: 'get', key },
        });

        if (error) {
            console.warn('[Cache] Get error:', error);
            return null;
        }

        return data?.value ?? null;
    } catch (err) {
        console.warn('[Cache] Get exception:', err);
        return null;
    }
}

/**
 * Salva um valor no cache
 */
export async function cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds: number = 300
): Promise<boolean> {
    try {
        const { error } = await supabase.functions.invoke('redis-cache', {
            body: { action: 'set', key, value, ttl: ttlSeconds },
        });

        if (error) {
            console.warn('[Cache] Set error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.warn('[Cache] Set exception:', err);
        return false;
    }
}

/**
 * Remove uma chave do cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
    try {
        const { error } = await supabase.functions.invoke('redis-cache', {
            body: { action: 'del', key },
        });

        if (error) {
            console.warn('[Cache] Delete error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.warn('[Cache] Delete exception:', err);
        return false;
    }
}

/**
 * Remove múltiplas chaves que correspondem a um padrão
 * Exemplo: cacheInvalidatePattern('crm:contacts:*')
 */
export async function cacheInvalidatePattern(pattern: string): Promise<boolean> {
    try {
        const { error } = await supabase.functions.invoke('redis-cache', {
            body: { action: 'invalidate', pattern },
        });

        if (error) {
            console.warn('[Cache] Invalidate error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.warn('[Cache] Invalidate exception:', err);
        return false;
    }
}

// ============================================
// HIGHER-ORDER FUNCTION: withCache
// ============================================

/**
 * HOF que envolve uma função de fetch com cache
 * 
 * @example
 * const getUserProfile = withCache(
 *   (userId: string) => `user:profile:${userId}`,
 *   async (userId: string) => {
 *     const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
 *     return data;
 *   },
 *   { ttl: 300 } // 5 minutos
 * );
 * 
 * const profile = await getUserProfile('user-123');
 */
export function withCache<TArgs extends any[], TResult>(
    keyFn: (...args: TArgs) => string,
    fetcher: (...args: TArgs) => Promise<TResult>,
    options: CacheOptions = {}
): (...args: TArgs) => Promise<CacheResult<TResult>> {
    const { ttl = 300, noCache = false } = options;

    return async (...args: TArgs): Promise<CacheResult<TResult>> => {
        const key = keyFn(...args);

        // Bypass cache se solicitado
        if (noCache) {
            try {
                const data = await fetcher(...args);
                // Ainda salva no cache para próximas requests
                await cacheSet(key, data, ttl);
                return { data, fromCache: false };
            } catch (err: any) {
                return { data: null, fromCache: false, error: err.message };
            }
        }

        // Tentar buscar do cache
        const cached = await cacheGet<TResult>(key);
        if (cached !== null) {
            console.log(`[Cache] HIT: ${key}`);
            return { data: cached, fromCache: true };
        }

        console.log(`[Cache] MISS: ${key}`);

        // Cache miss - buscar do source
        try {
            const data = await fetcher(...args);

            // Salvar no cache (fire-and-forget)
            cacheSet(key, data, ttl).catch(() => { });

            return { data, fromCache: false };
        } catch (err: any) {
            return { data: null, fromCache: false, error: err.message };
        }
    };
}

// ============================================
// CACHE KEYS HELPERS
// ============================================

export const CacheKeys = {
    userProfile: (userId: string) => `user:profile:${userId}`,
    crmContacts: (userId: string) => `crm:contacts:${userId}`,
    crmContact: (contactId: string) => `crm:contact:${contactId}`,
    procedures: (userId: string) => `procedures:${userId}`,
    whatsappConfig: (userId: string) => `whatsapp:config:${userId}`,
    teamDoctors: (userId: string) => `team:doctors:${userId}`,
    dashboardMetrics: (userId: string, date: string) => `metrics:dashboard:${userId}:${date}`,
};

// TTLs recomendados (em segundos)
export const CacheTTL = {
    SHORT: 60,       // 1 minuto (métricas, dados voláteis)
    MEDIUM: 300,     // 5 minutos (perfil, config)
    LONG: 600,       // 10 minutos (procedimentos, dados estáveis)
    VERY_LONG: 3600, // 1 hora (dados quase estáticos)
};
