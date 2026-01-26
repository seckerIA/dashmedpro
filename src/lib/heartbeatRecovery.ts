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
 * Verifica e renova sessão - com tratamento de refresh token inválido e timeouts
 */
async function verifyAndRefreshSession(): Promise<boolean> {
    if (!supabaseClient) return false;

    const SESSION_TIMEOUT = 8000;
    const REFRESH_TIMEOUT = 10000;

    try {
        // Primeiro, tentar pegar a sessão atual COM TIMEOUT
        const sessionPromise = supabaseClient.auth.getSession();
        const sessionTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getSession timeout')), SESSION_TIMEOUT)
        );

        let session: any = null;
        let sessionError: any = null;

        try {
            const result = await Promise.race([sessionPromise, sessionTimeout]) as any;
            session = result?.data?.session;
            sessionError = result?.error;
        } catch (timeoutErr: any) {
            log('⚠️', 'getSession travou, tentando refresh direto...');
            // Se getSession travou, tentar refresh diretamente
            try {
                const refreshPromise = supabaseClient.auth.refreshSession();
                const refreshTimeout = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('refreshSession timeout')), REFRESH_TIMEOUT)
                );
                const refreshResult = await Promise.race([refreshPromise, refreshTimeout]) as any;
                if (refreshResult?.data?.session) {
                    log('✅', 'Refresh direto bem-sucedido após timeout do getSession');
                    return true;
                }
            } catch {
                log('❌', 'Refresh direto também falhou');
            }
            return false;
        }

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

                try {
                    const refreshPromise = supabaseClient.auth.refreshSession();
                    const refreshTimeout = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('refreshSession timeout')), REFRESH_TIMEOUT)
                    );
                    const { data, error: refreshError } = await Promise.race([
                        refreshPromise,
                        refreshTimeout
                    ]) as any;

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

                    if (data?.session) {
                        log('✅', 'Token renovado com sucesso');
                    }
                } catch (refreshTimeoutErr) {
                    log('❌', 'Timeout ao renovar token');
                    return false;
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
 * Faz uma requisição de "warmup" para acordar a rede do browser
 * Browsers throttle network após idle longo - um request simples acorda tudo
 */
async function networkWarmup(): Promise<boolean> {
    try {
        log('🌐', 'Warmup de rede...');

        // Fazer um HEAD request simples para o Supabase
        // Isso acorda a stack de rede do browser
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch('https://adzaqkduxnpckbcuqpmg.supabase.co/rest/v1/', {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc',
            },
        });

        clearTimeout(timeoutId);
        log('✅', `Warmup OK (${response.status})`);
        return true;
    } catch (e: any) {
        log('⚠️', 'Warmup falhou:', e?.message);
        return false;
    }
}

/**
 * Faz um warmup REAL com uma query SELECT simples
 * Passa pelo mesmo caminho que as queries normais (fetchWithTimeout)
 * Isso força o browser a estabelecer uma nova conexão TCP funcional
 */
async function realQueryWarmup(): Promise<boolean> {
    if (!supabaseClient) return false;

    try {
        log('🔥', 'Warmup com query real...');

        // Query simples que passa pelo fetchWithTimeout
        // Usar tabela que sempre existe (profiles) com limit 1
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (error && !error.message.includes('No rows')) {
            throw error;
        }

        log('✅', 'Warmup real OK');
        return true;
    } catch (e: any) {
        log('⚠️', 'Warmup real falhou:', e?.message);
        return false;
    }
}

/**
 * Executa a sequência de recuperação
 *
 * ESTRATÉGIA v6:
 * 1. Abortar fetches pendentes (libera slots)
 * 2. Ativar post-recovery mode (fetch usará 2 tentativas)
 * 3. Warmup de rede HEAD (acorda browser)
 * 4. Warmup REAL com query SELECT (força nova conexão TCP)
 * 5. Cancelar queries travadas
 * 6. Deixar navegação natural do usuário disparar queries necessárias
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

    log('🚨', `RECOVERY #${consecutiveRecoveries} - ${reason} (${Math.round(gapMs / 1000)}s)`);

    try {
        // Se muitos recoveries consecutivos, algo está muito errado
        if (consecutiveRecoveries >= CONFIG.MAX_CONSECUTIVE_RECOVERIES) {
            log('💀', 'Muitos recoveries consecutivos! Recarregando página...');
            queryClient?.clear();
            setTimeout(() => window.location.reload(), 500);
            return;
        }

        // 1. Abortar TODAS as requisições HTTP pendentes
        // Isso libera slots de conexão imediatamente
        try {
            const { abortAllPendingFetches, getActiveFetchCount } = await import('@/lib/fetchRegistry');
            const before = getActiveFetchCount();
            log('📊', `Fetches ativos antes: ${before}`);

            const aborted = abortAllPendingFetches();
            if (aborted > 0) {
                log('🛑', `${aborted} requisições HTTP abortadas`);
            }
        } catch (e) {
            log('⚠️', 'Erro ao abortar requisições:', e);
        }

        // 2. Resetar fetch tracking
        await resetFetchTracking();

        // 3. Cancelar queries em andamento no React Query
        // (isso marca como cancelado no cache, não aborta HTTP - já fizemos isso acima)
        if (queryClient) {
            queryClient.cancelQueries();
            log('🔧', 'Queries canceladas no cache');
        }

        // 4. ATIVAR POST-RECOVERY MODE ANTES dos warmups
        // Isso faz com que os warmups também usem a estratégia de 2 tentativas
        (window as any).__postRecoveryMode = true;
        (window as any).__postRecoveryModeUntil = Date.now() + 30000; // 30 segundos
        log('⚡', 'Post-recovery mode ATIVO (30s) - fetch usará retry com URL modificada');

        // 5. Warmup HEAD request - acorda a stack de rede do browser
        const warmupOk = await networkWarmup();

        if (!warmupOk) {
            log('🔄', 'Tentando warmup novamente...');
            await new Promise(r => setTimeout(r, 500));
            await networkWarmup();
        }

        // 6. Warmup REAL com query SELECT
        // Isso força o browser a estabelecer uma conexão TCP funcional
        // passando pelo mesmo caminho que as queries normais
        const realWarmupOk = await realQueryWarmup();

        if (!realWarmupOk) {
            log('🔄', 'Tentando warmup real novamente...');
            await new Promise(r => setTimeout(r, 500));
            await realQueryWarmup();
        }

        // 7. Pequeno delay para estabilizar
        await new Promise(r => setTimeout(r, 200));

        // 8. Remover queries travadas do cache
        const removed = removeStuckQueries();
        if (removed > 0) {
            log('📊', `${removed} queries travadas resetadas`);
        }

        log('✅', 'Recovery completo! Navegação do usuário disparará queries necessárias.');

        // Reset contador após 60s sem novos recoveries
        setTimeout(() => {
            const timeSinceLastRecovery = Date.now() - lastRecovery;
            if (timeSinceLastRecovery >= 55000) { // ~60s
                consecutiveRecoveries = 0;
                log('🔄', 'Contador de recoveries resetado');
            }
        }, 60000);

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
 *
 * Durante background, apenas detecta freeze mas NÃO tenta recovery.
 * Recovery só acontece quando o usuário volta (visibilitychange).
 * Isso evita múltiplos recoveries inúteis durante idle.
 */
function heartbeat() {
    const now = Date.now();
    const gap = now - lastHeartbeat;

    // Apenas atualizar o heartbeat
    // Não fazer recovery durante background - esperar visibilitychange
    if (gap > CONFIG.FREEZE_THRESHOLD && document.visibilityState === 'visible') {
        log('❄️', `FREEZE detectado! Gap: ${Math.round(gap / 1000)}s`);
        // Não chamar triggerRecovery aqui - deixar para handleVisibilityChange
    }

    lastHeartbeat = now;
}

/**
 * Handler de visibilidade da página
 *
 * ESTRATÉGIA v6: Após idle longo, NÃO bloquear com checkToken.
 * Em vez disso:
 * 1. Abortar fetches pendentes
 * 2. Marcar que acabamos de voltar de idle (skip auth check)
 * 3. Deixar queries rodarem - se token inválido, 401 faz logout
 */
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        const now = Date.now();
        const heartbeatGap = now - lastHeartbeat;

        // Calcular idle time
        const lastActivity = (window as any).lastActivityTime || now;
        const idleTime = now - lastActivity;
        const storedIdleDuration = (window as any).lastLongIdleDuration || 0;
        const effectiveGap = Math.max(heartbeatGap, idleTime, storedIdleDuration);

        log('👁️', `Tab visível (idle: ${Math.round(effectiveGap / 1000)}s)`);

        // Atualizar heartbeat
        lastHeartbeat = now;
        (window as any).lastLongIdleDuration = 0;

        // Marcar que acabamos de voltar de idle longo
        // Isso faz com que checkToken() e ensureValidSession() pulem a verificação de rede
        // Reduz timeouts e deixa as queries rodarem imediatamente
        if (effectiveGap > 30000) { // 30 segundos
            (window as any).__skipNextAuthCheck = true;
            (window as any).__returnedFromIdleAt = now;
            log('⏭️', 'Próxima verificação de auth será pulada (evitar timeout)');
        }

        // Para idle maior, fazer recovery
        if (effectiveGap > CONFIG.FREEZE_THRESHOLD) {
            triggerRecovery('Tab retornou do background', effectiveGap);
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

/**
 * Verifica se estamos em modo pós-recovery
 * Durante esse período (10s), queries devem:
 * - Bypassar o slot queue (rodar em paralelo)
 * - Usar timeout curto (3s)
 * - Permitir retries rápidos
 */
export function isPostRecoveryMode(): boolean {
    if (typeof window === 'undefined') return false;

    const until = (window as any).__postRecoveryModeUntil || 0;
    const now = Date.now();

    // Se passou do tempo, desativar
    if (now > until) {
        if ((window as any).__postRecoveryMode) {
            (window as any).__postRecoveryMode = false;
            console.log('⏱️ [Heartbeat] Post-recovery mode EXPIRADO');
        }
        return false;
    }

    return (window as any).__postRecoveryMode === true;
}
