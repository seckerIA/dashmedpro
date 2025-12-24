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
  // #region agent log
  const sessionCheckStart = Date.now();
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'verificando sessão',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
  // #endregion

  try {
    // Obter sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'sessão obtida',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id,elapsed:Date.now()-sessionCheckStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
    // #endregion

    if (sessionError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'erro ao obter sessão',data:{errorMessage:sessionError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
      // #endregion
      throw new Error(`Erro ao verificar sessão: ${sessionError.message}`);
    }

    if (!session) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'sem sessão',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
      // #endregion
      throw new Error('Sessão inválida ou expirada. Por favor, faça login novamente.');
    }

    // Verificar se o token está próximo de expirar (menos de 5 minutos)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresIn = expiresAt - Math.floor(Date.now() / 1000); // segundos até expirar
      const fiveMinutes = 5 * 60; // 5 minutos em segundos

      if (expiresIn < fiveMinutes) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'token próximo de expirar, fazendo refresh',data:{expiresIn,expiresAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
        // #endregion

        // Tentar fazer refresh do token
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'erro ao fazer refresh',data:{errorMessage:refreshError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
          // #endregion
          throw new Error(`Erro ao renovar sessão: ${refreshError?.message || 'Sessão não renovada'}`);
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'sessão renovada com sucesso',data:{userId:refreshedSession.user.id,elapsed:Date.now()-sessionCheckStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
        // #endregion

        return refreshedSession;
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'sessão válida',data:{userId:session.user.id,elapsed:Date.now()-sessionCheckStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
    // #endregion

    return session;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHelpers.ts:ensureValidSession',message:'erro em ensureValidSession',data:{errorMessage:error?.message,elapsed:Date.now()-sessionCheckStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'session-check'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

