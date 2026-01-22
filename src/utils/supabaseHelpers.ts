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
