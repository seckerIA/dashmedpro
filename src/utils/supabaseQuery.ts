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
 * Tipo para query builder do Supabase que suporta abortSignal
 * O query builder do Supabase é uma Promise que também tem métodos como abortSignal
 */
type SupabaseQueryBuilder<T> = Promise<SupabaseQueryResult<T>> & {
  abortSignal(signal: AbortSignal): SupabaseQueryBuilder<T>;
};

/**
 * Executa uma query do Supabase com timeout real e suporte a cancelamento
 *
 * O problema: queries do Supabase podem travar e nunca resolver nem rejeitar.
 * Solução: usar Promise.race com uma promise que SEMPRE rejeita após o timeout,
 * garantindo que a função retorne dentro do tempo especificado.
 *
 * IMPORTANTE: A query é executada IMEDIATAMENTE ao chamar esta função, não quando
 * a Promise é passada para Promise.race. Isso garante que o fetch HTTP seja iniciado
 * imediatamente.
 *
 * Se um signal for fornecido, aplica .abortSignal() na query para cancelamento real.
 *
 * @param queryBuilder - Query builder do Supabase (que suporta .abortSignal()) ou Promise já executada
 * @param timeoutMs - Timeout em milissegundos (padrão: 30000 = 30 segundos)
 * @param signal - AbortSignal opcional para cancelamento externo
 * @returns Promise que resolve com { data, error } ou rejeita com erro de timeout
 */
export async function supabaseQueryWithTimeout<T>(
  queryBuilder: SupabaseQueryBuilder<T> | Promise<SupabaseQueryResult<T>>,
  timeoutMs: number = 60000,
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {
  // Verificar se já foi cancelado externamente
  if (signal?.aborted) {
    throw new Error('Query cancelada');
  }

  // Criar AbortController para timeout
  const timeoutController = new AbortController();

  // Criar um controller combinado que aborta quando QUALQUER um (timeout OU signal externo) abortar
  const combinedController = new AbortController();
  const signalToUse = combinedController.signal;

  // Criar promise de timeout que SEMPRE rejeita após o tempo especificado
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timeoutController.abort(); // Isso vai disparar o listener abaixo que aborta combinedController
      reject(new Error(`Query timeout após ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // Fazer o combined abortar quando timeout abortar
  timeoutController.signal.addEventListener('abort', () => {
    combinedController.abort();
  });

  // Se temos signal externo, fazer o combined abortar quando ele abortar e limpar timeout
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      combinedController.abort();
    });
  }

  // Determinar se queryBuilder suporta abortSignal (é um query builder, não uma promise já executada)
  const hasAbortSignal = typeof (queryBuilder as any)?.abortSignal === 'function';

  // CRÍTICO: Forçar execução imediata da query usando IIFE
  // O Supabase usa lazy evaluation, então precisamos iniciar a execução ANTES do Promise.race
  // Se o queryBuilder suporta abortSignal e temos um signal, aplicar antes de executar
  const executedQueryPromise = (async () => {
    // Se o queryBuilder suporta abortSignal, aplicar o signal antes de executar
    // O abortSignal retorna o próprio query builder (que é uma Promise), então aplicamos e aguardamos
    if (hasAbortSignal && signalToUse && !signalToUse.aborted) {
      const queryWithSignal = (queryBuilder as SupabaseQueryBuilder<T>).abortSignal(signalToUse);
      const result = await queryWithSignal;
      return result;
    } else {
      // Fallback para Promise já executada ou sem signal (compatibilidade retroativa)
      return await (queryBuilder as Promise<SupabaseQueryResult<T>>);
    }
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
    if (signal?.aborted || signalToUse?.aborted) {
      throw new Error('Query cancelada');
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Rejeitar com o erro (timeout ou outro)
    throw error;
  }
}
