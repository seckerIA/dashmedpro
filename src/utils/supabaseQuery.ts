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
  // Verificar se já foi cancelado externamente
  if (signal?.aborted) {
    throw new Error('Query cancelada');
  }

  // Criar promise de timeout que SEMPRE rejeita após o tempo especificado
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout após ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // CRÍTICO: Forçar execução imediata da query usando IIFE
  // O Supabase usa lazy evaluation, então precisamos iniciar a execução ANTES do Promise.race
  const executedQueryPromise = (async () => {
    return await queryPromise;
  })().then((result) => {
    clearTimeout(timeoutId);
    return result;
  }).catch((err) => {
    clearTimeout(timeoutId);
    throw err;
  });

  try {
    // Promise.race vai retornar o primeiro que resolver/rejeitar
    // Se a query travar, o timeout vai rejeitar primeiro
    const result = await Promise.race([
      executedQueryPromise,
      timeoutPromise
    ]) as SupabaseQueryResult<T>;

    // Verificar cancelamento externo após a race
    if (signal?.aborted) {
      throw new Error('Query cancelada');
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Rejeitar com o erro (timeout ou outro)
    throw error;
  }
}
