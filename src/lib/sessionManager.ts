/**
 * SESSION MANAGER - Gerencia sessão de forma independente
 * 
 * PRIORIDADE MÁXIMA:
 * - Renovação de sessão NÃO pode depender de queries bloqueadas
 * - Deve funcionar mesmo com QueryClient em recovery
 * - Timeout agressivo para falhas
 */

import { supabase } from '@/integrations/supabase/client';

interface SessionState {
    isValid: boolean;
    lastCheck: number;
    renewalInProgress: boolean;
    consecutiveFailures: number;
}

class SessionManager {
    private state: SessionState = {
        isValid: true,
        lastCheck: Date.now(),
        renewalInProgress: false,
        consecutiveFailures: 0,
    };

    private readonly MAX_FAILURES = 3;
    private readonly CHECK_INTERVAL = 30000; // 30s
    private readonly RENEWAL_TIMEOUT = 20000; // 20s (mais tolerante)

    private checkTimer: NodeJS.Timeout | null = null;
    private renewalTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this.startPeriodicCheck();
        this.setupAuthListener();
    }

    /**
     * Verifica se a sessão está válida
     * Retorna instantaneamente se verificou recentemente
     */
    async isSessionValid(): Promise<boolean> {
        const now = Date.now();
        const timeSinceCheck = now - this.state.lastCheck;

        // Se verificou há menos de 10s, confia no cache
        if (timeSinceCheck < 10000) {
            return this.state.isValid;
        }

        // Verifica a sessão
        return this.checkSession();
    }

    /**
     * Força renovação imediata da sessão
     * CRÍTICO: Não depende de queries ou outros sistemas
     */
    async forceRenewal(): Promise<boolean> {
        if (this.state.renewalInProgress) {
            console.log('🔄 [SessionManager] Renovação já em progresso, aguardando...');
            return this.waitForRenewal();
        }

        console.log('🔐 [SessionManager] Forçando renovação de sessão...');
        this.state.renewalInProgress = true;

        try {
            const result = await this.renewWithTimeout();

            if (result) {
                console.log('✅ [SessionManager] Sessão renovada com sucesso');
                this.state.isValid = true;
                this.state.consecutiveFailures = 0;
                this.state.lastCheck = Date.now();
                return true;
            } else {
                throw new Error('Renewal failed');
            }
        } catch (error) {
            this.state.consecutiveFailures++;
            console.error(`❌ [SessionManager] Falha na renovação (${this.state.consecutiveFailures}/${this.MAX_FAILURES}):`, error);

            // Se falhou muitas vezes, força logout
            if (this.state.consecutiveFailures >= this.MAX_FAILURES) {
                console.error('🚨 [SessionManager] Muitas falhas consecutivas. Forçando logout...');
                await this.forceLogout();
                return false;
            }

            this.state.isValid = false;
            this.state.lastCheck = Date.now();
            return false;
        } finally {
            this.state.renewalInProgress = false;
            if (this.renewalTimeout) {
                clearTimeout(this.renewalTimeout);
                this.renewalTimeout = null;
            }
        }
    }

    /**
     * Verifica a sessão sem renovar
     */
    private async checkSession(): Promise<boolean> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            const isValid = !!session;
            this.state.isValid = isValid;
            this.state.lastCheck = Date.now();

            if (!isValid) {
                console.warn('⚠️ [SessionManager] Sessão inválida detectada');
            }

            return isValid;
        } catch (error) {
            console.error('❌ [SessionManager] Erro ao verificar sessão:', error);
            this.state.isValid = false;
            this.state.lastCheck = Date.now();
            return false;
        }
    }

    /**
     * Renova a sessão com timeout agressivo
     */
    private renewWithTimeout(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Timeout agressivo
            this.renewalTimeout = setTimeout(() => {
                reject(new Error('Session renewal timeout'));
            }, this.RENEWAL_TIMEOUT);

            // Tenta renovar
            supabase.auth.refreshSession()
                .then(({ data, error }) => {
                    if (this.renewalTimeout) {
                        clearTimeout(this.renewalTimeout);
                        this.renewalTimeout = null;
                    }

                    if (error) {
                        reject(error);
                    } else {
                        resolve(!!data.session);
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Aguarda renovação em progresso
     */
    private async waitForRenewal(): Promise<boolean> {
        const maxWait = 10000; // 10s
        const startTime = Date.now();

        while (this.state.renewalInProgress && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return this.state.isValid;
    }

    /**
     * Verificação periódica em background
     */
    private startPeriodicCheck() {
        this.checkTimer = setInterval(() => {
            if (!this.state.renewalInProgress) {
                this.checkSession().catch(console.error);
            }
        }, this.CHECK_INTERVAL);
    }

    /**
     * Escuta eventos de autenticação do Supabase
     */
    private setupAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`🔐 [SessionManager] Auth event: ${event}`);

            switch (event) {
                case 'SIGNED_IN':
                case 'TOKEN_REFRESHED':
                    this.state.isValid = true;
                    this.state.consecutiveFailures = 0;
                    this.state.lastCheck = Date.now();
                    break;

                case 'SIGNED_OUT':
                    this.state.isValid = false;
                    this.state.lastCheck = Date.now();
                    break;

                case 'USER_UPDATED':
                    this.state.lastCheck = Date.now();
                    break;
            }
        });
    }

    /**
     * Força logout completo
     */
    private async forceLogout() {
        try {
            await supabase.auth.signOut();
            this.state.isValid = false;
            this.state.consecutiveFailures = 0;

            // Recarrega a página para limpar tudo
            // window.location.href = '/login'; // Desativado
        } catch (error) {
            console.error('❌ [SessionManager] Erro ao forçar logout:', error);
            // Se nem logout funcionar, recarrega de qualquer forma
            // window.location.href = '/login'; // Desativado
        }
    }

    /**
     * Limpa recursos
     */
    destroy() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        if (this.renewalTimeout) {
            clearTimeout(this.renewalTimeout);
            this.renewalTimeout = null;
        }
    }

    /**
     * Retorna informações de debug
     */
    getDebugInfo() {
        return {
            ...this.state,
            timeSinceCheck: Date.now() - this.state.lastCheck,
        };
    }
}

// Singleton global
export const sessionManager = new SessionManager();

// Helper para uso em hooks
export function useSessionManager() {
    return {
        isSessionValid: () => sessionManager.isSessionValid(),
        forceRenewal: () => sessionManager.forceRenewal(),
        getDebugInfo: () => sessionManager.getDebugInfo(),
    };
}
