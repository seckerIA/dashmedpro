/**
 * Heartbeat Recovery System v3 (Deep Wake-up Protocol)
 * 
 * Camadas de Recuperação:
 * 1. Curta (< 5m): Reset de slots e validação simples.
 * 2. Média (5m - 60m): Smart Retry com backoff (aguarda rede).
 * 3. Longa (> 60m): Hard Reload para limpar memória e forçar token novo.
 */

import { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Intervalo do heartbeat (ms)
    HEARTBEAT_INTERVAL: 2000,

    // Se o gap for maior que isso, consideramos freeze/sleep
    // 30 segundos - muito menos agressivo
    FREEZE_THRESHOLD: 30000,

    // Tempo mínimo entre recoveries (evita loops)
    // 10 segundos - mais espaço entre tentativas
    RECOVERY_COOLDOWN: 10000,

    // LIMIAR HIBERNAÇÃO (Média Duração) - Força verificação robusta
    // 2 minutos - só para idle realmente longo
    STALE_THRESHOLD: 120000,

    // LIMIAR DEEP SLEEP (Longa Duração) - Força Reload
    // 30 minutos - só em casos extremos (não usado mais)
    DEEP_SLEEP_THRESHOLD: 30 * 60 * 1000,

    // Máximo de tentativas de reconexão
    // 1 tentativa apenas - fail-fast, não bloquear
    MAX_RETRY_ATTEMPTS: 1,

    // Tempo para considerar query como travada
    // 30 segundos - mais tolerante para não competir com timeouts de 15s
    STUCK_QUERY_THRESHOLD: 30000,
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
        // if (typeof window !== 'undefined') window.location.href = '/login'; // Desativado
    } catch (e) {
        console.error(e);
    }
}

// ============================================================================
// PROCESSO DE VALIDAÇÃO DE SESSÃO
// ============================================================================

async function verifyAndRefreshSession(): Promise<boolean> {
    if (!supabaseClient) return false;

    try {
        // UMA tentativa apenas - fail-fast
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        // ERRO DE SESSÃO - não retry, apenas false
        if (sessionError) {
            log('⚠️', 'Erro de sessão:', sessionError.message);

            // Se for refresh token inválido, logout
            if (sessionError.message.includes('Refresh Token') ||
                sessionError.message.includes('invalid_token')) {
                await forceLogout();
            }
            return false;
        }

        // SEM SESSÃO - retorna false, usuário será redirecionado naturalmente
        if (!session) {
            log('⚠️', 'Sem sessão');
            return false;
        }

        // Sessão existe e é válida
        log('✅', 'Sessão OK');
        return true;

    } catch (e: any) {
        log('⚠️', 'Exceção na verificação:', e.message);
        return false;
    }
}

async function reconnectRealtimeChannels() {
    if (!supabaseClient) return;
    try {
        // Primeiro: fazer um fetch simples para "acordar" o socket HTTP
        // Isso força o browser a criar uma nova conexão se a anterior morreu
        log('🔌', 'Testando conexão com banco...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .select('id')
                .limit(1)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
                log('⚠️', `Teste de conexão falhou: ${error.message}`);
                // Não é fatal - o próximo fetch do usuário vai tentar novamente
            } else {
                log('✅', 'Conexão HTTP OK');
            }
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                log('⚠️', 'Timeout no teste de conexão (5s)');
            } else {
                log('⚠️', 'Erro no teste de conexão:', e);
            }
        }

        // Segundo: reconectar canais Realtime
        const channels = supabaseClient.getChannels();
        if (channels.length === 0) {
            log('📡', 'Nenhum canal Realtime para reconectar');
            return;
        }

        log('📡', `Reconectando ${channels.length} canais Realtime...`);

        // Remove e reconecta para forçar nova conexão WebSocket
        for (const channel of channels) {
            try {
                await supabaseClient.removeChannel(channel);
            } catch (e) {
                // Ignorar erros de remoção
            }
        }

        // Os hooks que usam Realtime vão re-subscrever automaticamente
        // quando o componente re-renderizar
        log('✅', 'Canais Realtime limpos. Re-subscrição automática.');

    } catch (e) {
        log('⚠️', 'Erro ao reconectar Realtime:', e);
    }
}

// ============================================================================
// RECOVERY PRINCIPAL
// ============================================================================

async function triggerRecovery(reason: string, gapMs: number) {
    const now = Date.now();
    if (now - lastRecovery < CONFIG.RECOVERY_COOLDOWN && !isRecovering) return;
    if (isRecovering) return;

    // Recovery é feito em background para NUNCA bloquear a UI
    // Se algo falhar, as queries vão falhar individualmente (melhor que travar tudo)
    doRecoveryInBackground(reason, gapMs);
}

async function doRecoveryInBackground(reason: string, gapMs: number) {
    isRecovering = true;
    lastRecovery = Date.now();
    consecutiveRecoveries++;

    // NÃO usa onlineManager.setOnline(false) - isso trava a UI!
    // Deixamos queries rodarem normalmente, se falharem, falham individualmente

    log('�', `Recovery em background (${reason}) - Gap: ${Math.round(gapMs / 1000)}s`);

    try {
        // CAMADA 1: Limpeza Básica (rápido, não bloqueia)
        await resetFetchTracking();
        const removed = removeStuckQueries();
        if (removed > 0) log('🧹', `${removed} queries limpas`);

        // CAMADA 2: Apenas para idle muito longo (>2 min)
        if (gapMs > CONFIG.STALE_THRESHOLD) {
            log('🔒', 'Verificando sessão...');

            // UMA tentativa apenas, sem retry
            const sessionOk = await verifyAndRefreshSession();

            if (!sessionOk) {
                log('⚠️', 'Sessão inválida. Usuário será redirecionado ao tentar ação.');
                // Não fazemos nada - as queries vão falhar e redirecionar naturalmente
            } else {
                // Tentar reconectar Realtime em background
                reconnectRealtimeChannels().catch(() => { });
                log('✅', 'Sessão OK. Realtime reconectando em background.');
            }
        }

        log('✅', 'Recovery concluído (não-bloqueante)');

    } catch (e) {
        log('⚠️', 'Recovery falhou (sem impacto na UI):', e);
    } finally {
        isRecovering = false;
        // NÃO chama onlineManager.setOnline() - nunca pausamos
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

        // Log para diagnóstico
        const gapMinutes = Math.round(gap / 1000 / 60);
        const gapSeconds = Math.round(gap / 1000);

        if (gapMinutes > 0) {
            log('👁️', `Tab ativa após ${gapMinutes}min`);
        } else {
            log('👁️', `Tab ativa. Gap: ${gapSeconds}s`);
        }

        lastHeartbeat = Date.now();

        // Só faz recovery se ficou mais de 1 MINUTO inativo
        // Menos que isso, não vale a pena - pode ser só alt-tab rápido
        if (gap > 60000) {
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
