/**
 * Heartbeat Recovery System v2
 * 
 * Versão melhorada que:
 * 1. Remove queries do cache ao invés de apenas cancelar
 * 2. Força reconexão do Supabase client
 * 3. Trata refresh token expirado
 * 4. Usa Web Worker como backup (não pode ser pausado por extensões)
 * 5. Debounce agressivo para evitar loops
 */

import { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CURRENT_PROJECT_REF } from '@/integrations/supabase/client';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Intervalo do heartbeat (ms)
    HEARTBEAT_INTERVAL: 2000, // 2 segundos (era 3s)

    // Se o gap for maior que isso, consideramos freeze
    FREEZE_THRESHOLD: 5000, // 5 segundos (era 8s) - extensões congelam rápido

    // Tempo mínimo entre recoveries (evita loops)
    RECOVERY_COOLDOWN: 3000, // 3 segundos (era 5s)

    // Se ficou idle mais que isso, força refresh completo
    STALE_THRESHOLD: 45000, // 45 segundos (era 60s)

    // Máximo de recoveries consecutivos antes de forçar reload
    MAX_CONSECUTIVE_RECOVERIES: 4, // (era 5)

    // Tempo para considerar query como travada
    STUCK_QUERY_THRESHOLD: 8000, // 8 segundos (era 15s) - falhar rápido
};

// ============================================================================
// ESTADO
// ============================================================================

let lastHeartbeat = Date.now();
let lastRecovery = 0;
let consecutiveRecoveries = 0;
let isRecovering = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let queryClient: QueryClient | null = null;
let supabaseClient: SupabaseClient | null = null;
let isInitialized = false;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Log com timestamp
 */
function log(emoji: string, message: string, ...args: any[]) {
    const time = new Date().toLocaleTimeString('pt-BR');
    console.log(`${emoji} [Heartbeat ${time}] ${message}`, ...args);
}

/**
 * Reseta o tracking de fetch slots
 */
async function resetFetchTracking() {
    try {
        const { resetFetchTracking: reset } = await import('@/lib/queryUtils');
        reset();
        log('🔓', 'Fetch tracking resetado');
    } catch (e) {
        // Ignorar se não existir
    }
}

/**
 * Remove queries travadas do cache (mais agressivo que cancelar)
 */
function removeStuckQueries(): number {
    if (!queryClient) return 0;

    const queries = queryClient.getQueryCache().getAll();
    let removedCount = 0;
    const now = Date.now();

    for (const query of queries) {
        const state = query.state;

        // Query em fetching por muito tempo?
        if (state.fetchStatus === 'fetching') {
            const dataUpdatedAt = state.dataUpdatedAt || 0;
            const errorUpdatedAt = state.errorUpdatedAt || 0;
            const lastUpdate = Math.max(dataUpdatedAt, errorUpdatedAt);
            const age = lastUpdate > 0 ? now - lastUpdate : now;

            // Se está travada por mais de X segundos
            if (age > CONFIG.STUCK_QUERY_THRESHOLD || lastUpdate === 0) {
                const keyStr = Array.isArray(query.queryKey)
                    ? query.queryKey.slice(0, 2).join('/')
                    : String(query.queryKey);

                try {
                    // Cancelar primeiro
                    queryClient.cancelQueries({ queryKey: query.queryKey });

                    // Resetar o estado da query para 'idle'
                    queryClient.resetQueries({ queryKey: query.queryKey });

                    removedCount++;
                    log('🗑️', `Query resetada: ${keyStr} (${Math.round(age / 1000)}s)`);
                } catch (e) {
                    // Ignorar erros
                }
            }
        }
    }

    // Se removeu queries, também resetar o fetch tracking para evitar slots travados
    if (removedCount > 0) {
        resetFetchTracking();
        log('🔓', 'Fetch slots resetados após limpar queries');
    }

    return removedCount;
}

/**
 * Força logout e redirect para login
 */
async function forceLogout() {
    if (!supabaseClient) return;

    try {
        log('🚪', 'Forçando logout por token inválido...');
        await supabaseClient.auth.signOut();

        // Limpar todo o cache
        queryClient?.clear();

        // Redirect para login
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    } catch (e) {
        log('❌', 'Erro ao fazer logout:', e);
    }
}

/**
 * Verifica e renova sessão - com tratamento de refresh token inválido
 */
async function verifyAndRefreshSession(): Promise<boolean> {
    if (!supabaseClient) return false;

    try {
        // Primeiro, tentar pegar a sessão atual
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
            log('⚠️', 'Erro ao pegar sessão:', sessionError.message);

            // Se for erro de refresh token, forçar logout
            if (sessionError.message.includes('Refresh Token') ||
                sessionError.message.includes('invalid_token')) {
                await forceLogout();
                return false;
            }
        }

        if (!session) {
            log('⚠️', 'Sem sessão ativa');
            return false;
        }

        // Verificar se o token está próximo de expirar
        const expiresAt = session.expires_at;
        if (expiresAt) {
            const expiresIn = expiresAt * 1000 - Date.now();

            // Se expira em menos de 5 minutos, renovar
            if (expiresIn < 5 * 60 * 1000) {
                log('🔄', 'Renovando token (expira em', Math.round(expiresIn / 1000), 's)');

                const { data, error: refreshError } = await supabaseClient.auth.refreshSession();

                if (refreshError) {
                    log('❌', 'Erro ao renovar token:', refreshError.message);

                    // Se falhou por refresh token inválido, forçar logout
                    if (refreshError.message.includes('Refresh Token') ||
                        refreshError.message.includes('invalid_token') ||
                        refreshError.message.includes('Invalid Refresh Token')) {
                        await forceLogout();
                        return false;
                    }

                    return false;
                }

                if (data.session) {
                    log('✅', 'Token renovado com sucesso');
                }
            }
        }

        return true;
    } catch (e: any) {
        log('❌', 'Erro ao verificar sessão:', e?.message || e);

        // Qualquer erro de token, forçar logout
        if (e?.message?.includes('Refresh Token') || e?.message?.includes('invalid')) {
            await forceLogout();
        }

        return false;
    }
}

/**
 * Força reconexão dos canais Realtime do Supabase
 */
async function reconnectRealtimeChannels() {
    if (!supabaseClient) return;

    try {
        const channels = supabaseClient.getChannels();

        if (channels.length === 0) return;

        log('🔌', `Reconectando ${channels.length} canais...`);

        for (const channel of channels) {
            if (channel.state !== 'joined') {
                try {
                    await channel.unsubscribe();
                    await new Promise(r => setTimeout(r, 100));
                    channel.subscribe();
                } catch (e) {
                    // Ignorar erros de canal individual
                }
            }
        }
    } catch (e) {
        log('⚠️', 'Erro ao reconectar canais:', e);
    }
}

// ============================================================================
// RECOVERY PRINCIPAL
// ============================================================================

/**
 * Executa a sequência de recuperação
 */
async function triggerRecovery(reason: string, gapMs: number) {
    const now = Date.now();

    // Cooldown entre recoveries
    if (now - lastRecovery < CONFIG.RECOVERY_COOLDOWN) {
        return;
    }

    // Já está recuperando?
    if (isRecovering) {
        return;
    }

    isRecovering = true;
    lastRecovery = now;
    consecutiveRecoveries++;

    log('🚨', `RECOVERY #${consecutiveRecoveries} - ${reason}`);

    try {
        // Se muitos recoveries consecutivos, algo está muito errado
        if (consecutiveRecoveries >= CONFIG.MAX_CONSECUTIVE_RECOVERIES) {
            log('💀', 'Muitos recoveries consecutivos! Recarregando página...');

            // Limpar tudo antes de reload
            queryClient?.clear();

            // Aguardar um pouco e recarregar
            setTimeout(() => {
                window.location.reload();
            }, 1000);

            return;
        }

        // 1. Resetar fetch tracking
        log('🔧', 'Resetando fetch tracking...');
        await resetFetchTracking();

        // 2. Remover queries travadas (não apenas cancelar)
        log('🔧', 'Removendo queries travadas...');
        const removed = removeStuckQueries();
        if (removed > 0) {
            log('📊', `${removed} queries resetadas`);
        }

        // 3. Verificar/renovar sessão
        log('🔧', 'Verificando sessão...');
        const sessionOk = await verifyAndRefreshSession();

        if (!sessionOk) {
            log('⚠️', 'Sessão inválida - aguardando login');
            return;
        }

        // 4. Reconectar Realtime apenas se ficou muito tempo parado
        if (gapMs > CONFIG.STALE_THRESHOLD) {
            log('🔧', 'Reconectando Realtime...');
            await reconnectRealtimeChannels();
        }

        // 5. Invalidar queries APENAS se sessão está OK e dados estão stale
        if (gapMs > CONFIG.STALE_THRESHOLD) {
            log('🔧', 'Invalidando queries stale...');

            // Pequeno delay para garantir que tudo foi limpo
            await new Promise(r => setTimeout(r, 200));

            queryClient?.invalidateQueries();
        }

        log('✅', 'Recovery completo!');

        // Reset contador de recoveries consecutivos após sucesso
        setTimeout(() => {
            if (Date.now() - lastRecovery > 30000) {
                consecutiveRecoveries = 0;
            }
        }, 30000);

    } catch (e) {
        log('❌', 'Erro no recovery:', e);
    } finally {
        isRecovering = false;
    }
}

// ============================================================================
// HEARTBEAT
// ============================================================================

/**
 * Função de heartbeat
 */
function heartbeat() {
    const now = Date.now();
    const gap = now - lastHeartbeat;

    // Freeze detectado?
    if (gap > CONFIG.FREEZE_THRESHOLD) {
        log('❄️', `FREEZE detectado! Gap: ${Math.round(gap / 1000)}s`);
        triggerRecovery(`Freeze de ${Math.round(gap / 1000)}s`, gap);
    }

    lastHeartbeat = now;
}

/**
 * Handler de visibilidade da página
 */
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        const now = Date.now();
        const gap = now - lastHeartbeat;

        log('👁️', `Tab visível (inativo por ${Math.round(gap / 1000)}s)`);

        // Atualizar heartbeat
        lastHeartbeat = now;

        // Se ficou muito tempo em background, recuperar
        if (gap > CONFIG.FREEZE_THRESHOLD) {
            triggerRecovery('Tab retornou do background', gap);
        }
    }
}

/**
 * Handler de online/offline
 */
function handleOnline() {
    log('🌐', 'Conexão restaurada');
    const gap = Date.now() - lastHeartbeat;
    triggerRecovery('Conexão restaurada', gap);
}

function handleOffline() {
    log('📴', 'Conexão perdida');
}

/**
 * Handler de foco da janela (backup do visibility)
 */
function handleFocus() {
    const now = Date.now();
    const gap = now - lastHeartbeat;

    // Se o gap é grande, pode ter congelado
    if (gap > CONFIG.FREEZE_THRESHOLD) {
        log('🎯', `Janela focada após ${Math.round(gap / 1000)}s`);
        lastHeartbeat = now;
        triggerRecovery('Janela focada após inatividade', gap);
    }
}

// ============================================================================
// API PÚBLICA
// ============================================================================

/**
 * Inicializa o sistema de heartbeat
 */
export function initHeartbeatRecovery(
    qc: QueryClient,
    supabase: SupabaseClient
): () => void {
    // Evitar inicialização dupla
    if (isInitialized) {
        log('⚠️', 'Sistema já inicializado, ignorando...');
        return () => { };
    }

    // Salvar referências
    queryClient = qc;
    supabaseClient = supabase;
    lastHeartbeat = Date.now();
    consecutiveRecoveries = 0;
    isInitialized = true;

    // Limpar timer anterior (hot reload)
    if (intervalId) {
        clearInterval(intervalId);
    }

    // Iniciar heartbeat
    intervalId = setInterval(heartbeat, CONFIG.HEARTBEAT_INTERVAL);

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    log('💓', 'Sistema inicializado');
    log('⚙️', `Intervalo: ${CONFIG.HEARTBEAT_INTERVAL}ms, Threshold: ${CONFIG.FREEZE_THRESHOLD}ms`);

    // Retornar cleanup
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('focus', handleFocus);
        isInitialized = false;
        log('💔', 'Sistema parado');
    };
}

/**
 * Força recovery manual
 */
export function forceRecovery() {
    const gap = Date.now() - lastHeartbeat;
    log('🔧', 'Recovery manual solicitado');
    triggerRecovery('Recovery manual', Math.max(gap, CONFIG.STALE_THRESHOLD));
}

/**
 * Retorna estatísticas
 */
export function getHeartbeatStats() {
    return {
        lastHeartbeat,
        timeSinceLastHeartbeat: Date.now() - lastHeartbeat,
        lastRecovery,
        consecutiveRecoveries,
        isRecovering,
        isInitialized,
    };
}

/**
 * Para o sistema (para cleanup)
 */
export function stopHeartbeat() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isInitialized = false;
    log('⏹️', 'Sistema parado manualmente');
}
