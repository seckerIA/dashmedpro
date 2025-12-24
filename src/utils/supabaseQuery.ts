/**
 * Wrapper para queries do Supabase com timeout real
 * 
 * Este wrapper resolve o problema de queries do Supabase que podem travar indefinidamente.
 * Força rejeição da Promise após o timeout, mesmo que a query original não tenha resolvido.
 * 
 * CRÍTICO: O Supabase usa lazy evaluation - a Promise só executa quando await é chamado diretamente.
 * Este wrapper força a execução imediata da query antes de entrar no Promise.race.
 */

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

/**
 * Executa uma query do Supabase com timeout real
 * 
 * O problema: queries do Supabase podem travar e nunca resolver nem rejeitar.
 * Solução: usar Promise.race com uma promise que SEMPRE rejeita após o timeout,
 * garantindo que a função retorne dentro do tempo especificado.
 * 
 * IMPORTANTE: A query é executada IMEDIATAMENTE ao chamar esta função, não quando
 * a Promise é passada para Promise.race. Isso garante que o fetch HTTP seja iniciado
 * imediatamente.
 * 
 * @param queryPromise - Promise retornada pela query do Supabase (será executada imediatamente)
 * @param timeoutMs - Timeout em milissegundos (padrão: 30000 = 30 segundos)
 * @param signal - AbortSignal opcional para cancelamento externo
 * @returns Promise que resolve com { data, error } ou rejeita com erro de timeout
 */
export async function supabaseQueryWithTimeout<T>(
  queryPromise: Promise<SupabaseQueryResult<T>>,
  timeoutMs: number = 30000,
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {
  const queryStartTime = Date.now();
  const queryId = Math.random().toString(36).substring(7);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'wrapper iniciado',data:{queryId,timeoutMs,hasSignal:!!signal,signalAborted:signal?.aborted},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'wrapper'})}).catch(()=>{});
  // #endregion

  // Verificar se já foi cancelado externamente
  if (signal?.aborted) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'query já cancelada',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'wrapper'})}).catch(()=>{});
    // #endregion
    throw new Error('Query cancelada');
  }

  // Criar promise de timeout que SEMPRE rejeita após o tempo especificado
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'timeout disparado',data:{queryId,elapsed:Date.now()-queryStartTime,timeoutMs},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'timeout'})}).catch(()=>{});
      // #endregion
      reject(new Error(`Query timeout após ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // CRÍTICO: Forçar execução imediata da query
  // O Supabase usa lazy evaluation, então precisamos iniciar a execução ANTES do Promise.race
  // Usar IIFE (Immediately Invoked Function Expression) para garantir execução imediata
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'forçando execução imediata da query',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'execution'})}).catch(()=>{});
  // #endregion

  // Criar uma Promise que executa a query imediatamente
  // Isso garante que o fetch HTTP seja iniciado antes do Promise.race
  const executedQueryPromise = Promise.resolve(queryPromise).then(async (result) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'query executada e resolvida',data:{queryId,hasData:!!result.data,hasError:!!result.error,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'success'})}).catch(()=>{});
    // #endregion
    clearTimeout(timeoutId);
    return result;
  }).catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'query rejeitada',data:{queryId,errorMessage:err?.message,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'error'})}).catch(()=>{});
    // #endregion
    clearTimeout(timeoutId);
    throw err;
  });

  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'iniciando Promise.race',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'race'})}).catch(()=>{});
    // #endregion

    // Promise.race vai retornar o primeiro que resolver/rejeitar
    // Se a query travar, o timeout vai rejeitar primeiro
    const result = await Promise.race([
      executedQueryPromise,
      timeoutPromise
    ]) as SupabaseQueryResult<T>;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'Promise.race completou',data:{queryId,hasData:!!result.data,hasError:!!result.error,elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'race-complete'})}).catch(()=>{});
    // #endregion

    // Verificar cancelamento externo após a race
    if (signal?.aborted) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'signal cancelado após race',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'cancelled'})}).catch(()=>{});
      // #endregion
      throw new Error('Query cancelada');
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseQuery.ts:supabaseQueryWithTimeout',message:'erro capturado',data:{queryId,errorMessage:error?.message,isTimeout:error?.message?.includes('timeout'),elapsed:Date.now()-queryStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'error-caught'})}).catch(()=>{});
    // #endregion

    // Rejeitar com o erro (timeout ou outro)
    throw error;
  }
}

