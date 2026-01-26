/**
 * Helpers para operações com Supabase
 *
 * Funções auxiliares para garantir sessão válida e outras operações comuns
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

// Timeout for session operations to prevent extension-related hangs
const SESSION_TIMEOUT_MS = 8000;

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function createSessionTimeout<T>(ms: number, operation: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} Timeout (${ms}ms)`)), ms);
  });
}

/**
 * Garante que há uma sessão válida antes de executar queries
 *
 * Verifica se há sessão válida e tenta fazer refresh se o token está próximo de expirar.
 * IMPORTANTE: Todas as operações têm timeout para evitar travamento por extensões.
 *
 * @returns Promise que resolve com a sessão válida
 * @throws Error se não há sessão válida, timeout, ou se não foi possível fazer refresh
 */
export async function ensureValidSession(): Promise<Session> {
  // Se acabamos de voltar de idle longo, pular verificação de rede
  // Isso evita timeout que bloqueia queries - 401 do Supabase fará logout se token inválido
  if (typeof window !== 'undefined' && (window as any).__skipNextAuthCheck) {
    (window as any).__skipNextAuthCheck = false;
    console.log('⏭️ [ensureValidSession] Pulando verificação de rede (retornou de idle)');

    // Verificar apenas se existe sessão no localStorage (sem rede)
    const stored = localStorage.getItem(`sb-adzaqkduxnpckbcuqpmg-auth-token`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token && parsed?.refresh_token) {
          // Construir sessão mínima a partir do localStorage
          // O token pode estar expirado mas deixamos o Supabase tratar o refresh automaticamente
          return {
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            expires_at: parsed.expires_at,
            expires_in: parsed.expires_in || 3600,
            token_type: 'bearer',
            user: parsed.user || {
              id: '',
              aud: 'authenticated',
              role: 'authenticated',
              email: '',
              created_at: '',
              app_metadata: {},
              user_metadata: {},
            },
          } as Session;
        }
      } catch {
        // Se não conseguir parsear, continuar com verificação normal
      }
    }
    // Se não há sessão válida no localStorage, throw para forçar login
    throw new Error('Sessão inválida ou expirada. Por favor, faça login novamente.');
  }

  try {
    // Obter sessão atual COM TIMEOUT
    // Esta é a operação mais crítica - se uma extensão trava o fetch, travamos aqui
    const getSessionPromise = supabase.auth.getSession();

    const { data: { session }, error: sessionError } = await Promise.race([
      getSessionPromise,
      createSessionTimeout<{ data: { session: Session | null }, error: any }>(SESSION_TIMEOUT_MS, 'getSession')
    ]) as any;

    if (sessionError) {
      throw new Error(`Erro ao verificar sessão: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('Sessão inválida ou expirada. Por favor, faça login novamente.');
    }

    // Verificar se o token está próximo de expirar (menos de 5 minutos)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = expiresAt - now; // segundos até expirar
      const fiveMinutes = 5 * 60; // 5 minutos em segundos

      if (expiresIn < fiveMinutes) {
        // Tentar fazer refresh do token COM TIMEOUT
        console.log('🔄 [ensureValidSession] Refreshing near-expiry token...');

        const refreshPromise = supabase.auth.refreshSession();

        const { data: { session: refreshedSession }, error: refreshError } = await Promise.race([
          refreshPromise,
          createSessionTimeout<{ data: { session: Session | null }, error: any }>(SESSION_TIMEOUT_MS, 'refreshSession')
        ]) as any;

        if (refreshError || !refreshedSession) {
          throw new Error(`Erro ao renovar sessão: ${refreshError?.message || 'Sessão não renovada'}`);
        }

        return refreshedSession;
      }
    }

    return session;
  } catch (error: any) {
    // Log timeout errors specifically for debugging
    if (error?.message?.includes('Timeout')) {
      console.warn('⚠️ [ensureValidSession]', error.message, '- Possível interferência de extensão');
    }
    throw error;
  }
}
