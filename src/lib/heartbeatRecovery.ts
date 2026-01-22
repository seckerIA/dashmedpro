/**
 * Heartbeat Recovery System v3 (Deep Wake-up Protocol)
 * 
 * Camadas de Recuperação:
 * 1. Curta (< 5m): Reset de slots e validação simples.
 * 2. Média (5m - 60m): Smart Retry com backoff (aguarda rede).
 * 3. Longa (> 60m): Hard Reload para limpar memória e forçar token novo.
 */

import { QueryClient, onlineManager } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Intervalo do heartbeat (ms)
    HEARTBEAT_INTERVAL: 2000,

    // Se o gap for maior que isso, consideramos freeze/sleep
    FREEZE_THRESHOLD: 5000,

    // Tempo mínimo entre recoveries (evita loops)
    RECOVERY_COOLDOWN: 3000,

    // LIMIAR HIBERNAÇÃO (Média Duração) - Força verificação robusta
    STALE_THRESHOLD: 45000, // 45s

    // LIMIAR DEEP SLEEP (Longa Duração) - Força Reload
    // 1 Hora = 3600000 ms
    DEEP_SLEEP_THRESHOLD: 1 * 60 * 60 * 1000,

    // Máximo de tentativas de reconexão na Camada 2
    MAX_RETRY_ATTEMPTS: 3,

    // Tempo para considerar query como travada
    STUCK_QUERY_THRESHOLD: 8000,
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

function log(emoji: string, message: string, ...args: any[]) {
    const time = new Date().toLocaleTimeString('pt-BR');
    console.log(`${emoji} [Heartbeat ${time}] ${message}`, ...args);
}

async function resetFetchTracking() {
    try {
        const { resetFetchTracking: reset } = await import('@/lib/queryUtils');
        reset();
    } catch (e) {
        // Ignorar
    }
}

function removeStuckQueries(): number {
    if (!queryClient) return 0;
    const queries = queryClient.getQueryCache().getAll();
    let removedCount = 0;
    const now = Date.now();

    for (const query of queries) {
        const state = query.state;
        if (state.fetchStatus === 'fetching') {
            const dataUpdatedAt = state.dataUpdatedAt || 0;
            const errorUpdatedAt = state.errorUpdatedAt || 0;
            const lastUpdate = Math.max(dataUpdatedAt, errorUpdatedAt);
            const age = lastUpdate > 0 ? now - lastUpdate : now;

            if (age > CONFIG.STUCK_QUERY_THRESHOLD || lastUpdate === 0) {
                try {
                    queryClient.cancelQueries({ queryKey: query.queryKey });
                    queryClient.resetQueries({ queryKey: query.queryKey });
                    removedCount++;
                } catch (e) {
                    // Ignorar
                }
            }
        }
    }
    if (removedCount > 0) resetFetchTracking();
    return removedCount;
}

async function forceLogout() {
    if (!supabaseClient) return;
    try {
        log('🚪', 'Forçando logout (Sessão inválida)...');
        await supabaseClient.auth.signOut();
        queryClient?.clear();
        if (typeof window !== 'undefined') window.location.href = '/login';
    } catch (e) {
        console.error(e);
    }
}

// ============================================================================
// PROCESSO DE VALIDAÇÃO DE SESSÃO
// ============================================================================

async function verifyAndRefreshSession(retryCount = 0): Promise<boolean> {
    if (!supabaseClient) return false;

    try {
        // Tentar pegar sessão
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        // ERRO DE SESSÃO
        if (sessionError) {
            log('⚠️', `Erro de sessão (Tentativa ${retryCount + 1}):`, sessionError.message);

            // Se for erro recuperável (network) e ainda temos tentativas
            if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                const delay = 1000 * (retryCount + 1); // Backoff: 1s, 2s, 3s
                log('⏳', `Aguardando rede (${delay}ms)...`);
                await new Promise(r => setTimeout(r, delay));
                return verifyAndRefreshSession(retryCount + 1);
            }

            // Se for refresh token inválido, tchau
            if (sessionError.message.includes('Refresh Token') ||
                sessionError.message.includes('invalid_token')) {
                await forceLogout();
                return false;
            }
            return false;
        }

        // SEM SESSÃO
        if (!session) {
            // Se não tem sessão mas esperávamos ter, pode ser delay de rede
            if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                log('⚠️', `Sessão vazia. Retentando (${retryCount + 1})...`);
                await new Promise(r => setTimeout(r, 1000));
                return verifyAndRefreshSession(retryCount + 1);
            }
            return false;
        }

        // VERIFICAR EXPIRAÇÃO
        const expiresAt = session.expires_at || 0;
        const expiresIn = expiresAt * 1000 - Date.now();

        // Se expira em menos de 5 minutos, renovar
        if (expiresIn < 5 * 60 * 1000) {
            log('🔄', `Renovando token (expira em ${Math.round(expiresIn / 1000)}s)`);
            const { data, error: refreshError } = await supabaseClient.auth.refreshSession();

            if (refreshError) {
                log('❌', 'Falha na renovação:', refreshError.message);

                // Retry na renovação também
                if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                    await new Promise(r => setTimeout(r, 1000));
                    return verifyAndRefreshSession(retryCount + 1);
                }

                if (refreshError.message.includes('Refresh Token') ||
                    refreshError.message.includes('invalid_token')) {
                    await forceLogout();
                }
                return false;
            }

            log('✅', 'Token renovado com sucesso');
        }

        // CRITICAL: Force a REAL network request to wake up the socket
        // getSession() may be local-only, so we ping the database
        log('🔌', 'Pingando banco de dados para acordar conexão...');
        const pingStart = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const { error: pingError } = await supabaseClient
                .from('profiles')
                .select('id')
                .limit(1)
                .abortSignal(controller.signal)
                .single();

            clearTimeout(timeoutId);

            if (pingError && !pingError.message.includes('aborted')) {
                log('⚠️', `Ping falhou: ${pingError.message}`);
                if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                    await new Promise(r => setTimeout(r, 1000));
                    return verifyAndRefreshSession(retryCount + 1);
                }
                return false;
            }

            log('✅', `Ping OK (${Date.now() - pingStart}ms)`);
        } catch (pingEx: any) {
            if (pingEx.name === 'AbortError') {
                log('⚠️', 'Ping timeout (5s) - conexão ainda morta');
                if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
                    await new Promise(r => setTimeout(r, 1000));
                    return verifyAndRefreshSession(retryCount + 1);
                }
                return false;
            }
            throw pingEx;
        }

        return true;

    } catch (e: any) {
        log('❌', 'Exceção na verificação:', e);
        if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 1000));
            return verifyAndRefreshSession(retryCount + 1);
        }
        return false;
    }
}

async function reconnectRealtimeChannels() {
    if (!supabaseClient) return;
    try {
        const channels = supabaseClient.getChannels();
        if (channels.length === 0) return;

        // Reconecta canais desconectados
        for (const channel of channels) {
            if (channel.state !== 'joined') {
                channel.subscribe();
            }
        }
    } catch (e) {
        // Silent fail
    }
}

// ============================================================================
// RECOVERY PRINCIPAL
// ============================================================================

async function triggerRecovery(reason: string, gapMs: number) {
    const now = Date.now();
    if (now - lastRecovery < CONFIG.RECOVERY_COOLDOWN && !isRecovering) return;
    if (isRecovering) return;

    // CAMADA 3: DEEP SLEEP (> 1 Hora) -> HARD RELOAD
    if (gapMs > CONFIG.DEEP_SLEEP_THRESHOLD) {
        log('💀', `DEEP SLEEP DETECTADO (${Math.round(gapMs / 1000 / 60)}min). Iniciando Hard Reload...`);
        // Limpar queries antes de morrer
        queryClient?.clear();
        // Reload forçado
        window.location.reload();
        return;
    }

    isRecovering = true;
    lastRecovery = now;
    consecutiveRecoveries++;

    // PAUSE - Impedir que queries disparem no socket morto
    onlineManager.setOnline(false);

    log('🚨', `RECOVERY (${reason}) - Gap: ${Math.round(gapMs / 1000)}s`);

    try {
        // CAMADA 1: Limpeza Básica
        await resetFetchTracking();
        const removed = removeStuckQueries();
        if (removed > 0) log('🧹', `${removed} queries limpas`);

        // CAMADA 2: Validação de Sessão (Smart Retry)
        if (gapMs > CONFIG.STALE_THRESHOLD) {
            log('🔒', 'Validando sessão com retry...');
            const sessionOk = await verifyAndRefreshSession();

            if (!sessionOk) {
                log('⚠️', 'Sessão perdida após tentativas. Aguardando ação do usuário.');
                return;
            }

            // Checkpoints extras para sessões longas
            await reconnectRealtimeChannels();

            // Invalidação geral para garantir dados frescos
            log('📊', 'Atualizando dados...');
            await queryClient?.invalidateQueries();
        }

        log('✅', 'Sistema recuperado');

        // Reset contador após sucesso
        setTimeout(() => {
            if (Date.now() - lastRecovery > 30000) consecutiveRecoveries = 0;
        }, 30000);

    } catch (e) {
        log('❌', 'Falha no recovery:', e);
    } finally {
        isRecovering = false;
        // RESUME - Liberar queries no socket novo (ou deixar falhar)
        onlineManager.setOnline(true);
    }
}

// ============================================================================
// HEARTBEAT LOOP
// ============================================================================

function heartbeat() {
    const now = Date.now();
    const gap = now - lastHeartbeat;

    if (gap > CONFIG.FREEZE_THRESHOLD) {
        log('❄️', `Freeze detectado: ${Math.round(gap / 1000)}s`);
        triggerRecovery('Freeze', gap);
    }
    lastHeartbeat = now;
}

function handleVisibility() {
    if (document.visibilityState === 'visible') {
        const gap = Date.now() - lastHeartbeat;
        log('👁️', `Tab ativa. Gap: ${Math.round(gap / 1000)}s`);
        lastHeartbeat = Date.now();

        if (gap > CONFIG.FREEZE_THRESHOLD) {
            triggerRecovery('Tab Visibility', gap);
        }
    }
}

function handleFocus() {
    const gap = Date.now() - lastHeartbeat;
    if (gap > CONFIG.FREEZE_THRESHOLD) {
        lastHeartbeat = Date.now();
        triggerRecovery('Focus', gap);
    }
}

function handleOnline() {
    const gap = Date.now() - lastHeartbeat;
    log('🌐', 'Online detectado');
    triggerRecovery('Network Online', gap);
}

// ============================================================================
// EXPORT SETUP
// ============================================================================

export function initHeartbeatRecovery(qc: QueryClient, sb: SupabaseClient): () => void {
    if (isInitialized) return () => { };

    queryClient = qc;
    supabaseClient = sb;
    lastHeartbeat = Date.now();
    isInitialized = true;

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(heartbeat, CONFIG.HEARTBEAT_INTERVAL);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    log('💓', 'Deep Wake-up Protocol Ativado v3');
    return () => stopHeartbeat();
}

export function stopHeartbeat() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('online', handleOnline);
    isInitialized = false;
}

export function forceRecovery() {
    triggerRecovery('Manual Force', CONFIG.STALE_THRESHOLD + 1000);
}

export function getHeartbeatStats() {
    return { lastHeartbeat, isRecovering, consecutiveRecoveries };
}
