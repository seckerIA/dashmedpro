/**
 * IDLE DETECTOR V3 - Detecção de inatividade sem deadlock
 * 
 * MUDANÇAS CRÍTICAS:
 * 1. SessionManager independente (não depende de queries)
 * 2. Wake-up não bloqueia o QueryClient
 * 3. Recovery suave sem travar o sistema
 * 4. Soft session check em vez de hard refresh
 */

import { useEffect, useRef, useCallback } from 'react';
import { sessionManager } from './sessionManager';

const IDLE_THRESHOLD = 3 * 60 * 1000; // 3 minutos
const VISIBILITY_CHECK_INTERVAL = 1000; // 1s
const ACTIVITY_STORAGE_KEY = 'last_user_activity';

interface IdleState {
    lastActivity: number;
    wasIdle: boolean;
    idleDuration: number;
}

export function useIdleDetector() {
    const stateRef = useRef<IdleState>({
        lastActivity: Date.now(),
        wasIdle: false,
        idleDuration: 0,
    });

    const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recoveryInProgressRef = useRef(false);

    /**
     * Atualiza atividade do usuário
     */
    const updateActivity = useCallback(() => {
        const now = Date.now();
        stateRef.current.lastActivity = now;
        stateRef.current.wasIdle = false;
        stateRef.current.idleDuration = 0;

        // Persiste para sobreviver a reloads
        localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
    }, []);

    /**
     * Calcula tempo de idle considerando localStorage
     */
    const getIdleTime = useCallback((): number => {
        const now = Date.now();
        const storedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        const lastActivity = storedActivity ? parseInt(storedActivity, 10) : stateRef.current.lastActivity;

        return now - lastActivity;
    }, []);

    /**
     * Recovery após idle LONGO - SEM bloquear queries
     */
    const handleLongIdle = useCallback(async (idleTime: number) => {
        if (recoveryInProgressRef.current) {
            console.log('⏭️ [IdleDetector] Recovery já em andamento, pulando...');
            return;
        }

        recoveryInProgressRef.current = true;
        console.log(`🔄 [IdleDetector] Long idle detected (${Math.round(idleTime / 1000)}s). Starting soft recovery...`);

        try {
            // 1. Verifica/renova sessão (independente de queries)
            const sessionValid = await sessionManager.forceRenewal();

            if (!sessionValid) {
                console.error('❌ [IdleDetector] Sessão inválida após renovação. Redirecionando...');
                // window.location.href = '/login'; // Desativado
                return;
            }

            // 2. Limpa cache antigo (opcional, não crítico)
            try {
                const { queryClient } = await import('./queryUtils');

                // Remove apenas queries muito antigas (>10min)
                const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
                queryClient.getQueryCache().getAll().forEach(query => {
                    const dataUpdatedAt = query.state.dataUpdatedAt;
                    if (dataUpdatedAt && dataUpdatedAt < tenMinutesAgo) {
                        queryClient.removeQueries({ queryKey: query.queryKey });
                    }
                });

                console.log('🧹 [IdleDetector] Cache antigo removido');
            } catch (error) {
                console.warn('⚠️ [IdleDetector] Erro ao limpar cache (não crítico):', error);
            }

            console.log('✅ [IdleDetector] Recovery completo');
        } catch (error) {
            console.error('❌ [IdleDetector] Erro no recovery:', error);
        } finally {
            recoveryInProgressRef.current = false;
            updateActivity();
        }
    }, [updateActivity]);

    /**
     * Verifica idle periodicamente quando tab está visível
     */
    const checkIdle = useCallback(() => {
        if (document.hidden) return;

        const idleTime = getIdleTime();
        const isIdle = idleTime > IDLE_THRESHOLD;

        if (isIdle && !stateRef.current.wasIdle) {
            // Entrou em idle agora
            console.log(`⏱️ [IdleDetector] User idle detected (${Math.round(idleTime / 1000)}s)`);
            stateRef.current.wasIdle = true;
            stateRef.current.idleDuration = idleTime;
        } else if (!isIdle && stateRef.current.wasIdle) {
            // Saiu do idle
            const idleDuration = stateRef.current.idleDuration;
            console.log(`👁️ [IdleDetector] User active after ${Math.round(idleDuration / 1000)}s idle`);

            // Se idle foi muito longo, faz recovery
            if (idleDuration > IDLE_THRESHOLD) {
                handleLongIdle(idleDuration);
            }

            updateActivity();
        }
    }, [getIdleTime, handleLongIdle, updateActivity]);

    /**
     * Handler de visibilidade da tab
     */
    const handleVisibilityChange = useCallback(() => {
        if (!document.hidden) {
            // Tab ficou visível
            const idleTime = getIdleTime();
            console.log(`👁️ [IdleDetector] Tab visible. Idle time: ${Math.round(idleTime / 1000)}s`);

            // Se ficou muito tempo idle, faz recovery
            if (idleTime > IDLE_THRESHOLD) {
                handleLongIdle(idleTime);
            } else {
                updateActivity();
            }

            // Inicia verificação periódica
            if (visibilityTimerRef.current) {
                clearInterval(visibilityTimerRef.current);
            }
            visibilityTimerRef.current = setInterval(checkIdle, VISIBILITY_CHECK_INTERVAL);
        } else {
            // Tab ficou escondida - para verificação
            console.log('🌙 [IdleDetector] Tab hidden. Pausing checks...');
            if (visibilityTimerRef.current) {
                clearInterval(visibilityTimerRef.current);
                visibilityTimerRef.current = null;
            }
        }
    }, [getIdleTime, handleLongIdle, updateActivity, checkIdle]);

    /**
     * Handlers de atividade do usuário
     */
    const activityHandlers = useCallback(() => {
        updateActivity();
    }, [updateActivity]);

    /**
     * Setup inicial
     */
    useEffect(() => {
        // Inicializa com timestamp do localStorage se disponível
        const storedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (storedActivity) {
            const timestamp = parseInt(storedActivity, 10);
            if (!isNaN(timestamp)) {
                stateRef.current.lastActivity = timestamp;
            }
        }

        // Event listeners de atividade
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, activityHandlers, { passive: true });
        });

        // Visibility listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Inicia verificação se tab está visível
        if (!document.hidden) {
            visibilityTimerRef.current = setInterval(checkIdle, VISIBILITY_CHECK_INTERVAL);
        }

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, activityHandlers);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (visibilityTimerRef.current) {
                clearInterval(visibilityTimerRef.current);
                visibilityTimerRef.current = null;
            }
        };
    }, [activityHandlers, handleVisibilityChange, checkIdle]);

    return {
        getIdleTime,
        isIdle: () => getIdleTime() > IDLE_THRESHOLD,
        updateActivity,
    };
}
