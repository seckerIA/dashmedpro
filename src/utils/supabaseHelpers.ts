/**
 * Helpers para operações com Supabase
 *
 * Funções auxiliares para garantir sessão válida e outras operações comuns
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

// Timeout MUITO curto - NUNCA bloquear por mais de 2 segundos
const SESSION_TIMEOUT_MS = 2000;

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
 * IMPORTANTE: 
 * - Timeout de 2 segundos apenas
 * - Se der timeout, usa sessão do cache local
 * - NUNCA bloqueia a UI
 *
 * @returns Promise que resolve com a sessão válida
 * @throws Error se não há sessão válida
 */
export async function ensureValidSession(): Promise<Session> {
  // Tentar pegar sessão local como fallback
  const localStorageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  let localSession: any = null;

  if (localStorageKey) {
    try {
      localSession = JSON.parse(localStorage.getItem(localStorageKey) || 'null');
    } catch (e) {
      // Ignorar erro de parse
    }
  }

  try {
    // Obter sessão atual COM TIMEOUT de 2 segundos
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

    // NÃO fazemos refresh manual aqui - Supabase auto-refresh cuida disso
    // Isso evita race condition e travamentos

    return session;
  } catch (error: any) {
    // Se for timeout E temos sessão local, usar como fallback
    if (error?.message?.includes('Timeout') && localSession?.currentSession) {
      console.warn('⚠️ [ensureValidSession] Timeout - usando sessão local como fallback');
      return localSession.currentSession as Session;
    }

    // Log timeout errors specifically for debugging
    if (error?.message?.includes('Timeout')) {
      console.warn('⚠️ [ensureValidSession]', error.message, '- Possível interferência de extensão');
    }
    throw error;
  }
}

