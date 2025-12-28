/**
 * Helpers para operações com Supabase
 *
 * Funções auxiliares para garantir sessão válida e outras operações comuns
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

/**
 * Garante que há uma sessão válida antes de executar queries
 *
 * Verifica se há sessão válida e tenta fazer refresh se o token está próximo de expirar.
 * Lança erro claro se não há sessão válida.
 *
 * @returns Promise que resolve com a sessão válida
 * @throws Error se não há sessão válida ou se não foi possível fazer refresh
 */
export async function ensureValidSession(): Promise<Session> {
  try {
    // Obter sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

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
        // Tentar fazer refresh do token
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          throw new Error(`Erro ao renovar sessão: ${refreshError?.message || 'Sessão não renovada'}`);
        }

        return refreshedSession;
      }
    }

    return session;
  } catch (error: any) {
    throw error;
  }
}
