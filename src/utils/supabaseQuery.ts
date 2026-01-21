/**
 * Wrapper para queries do Supabase com timeout real
 */

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

type SupabaseQueryBuilder<T> = Promise<SupabaseQueryResult<T>> & {
  abortSignal(signal: AbortSignal): SupabaseQueryBuilder<T>;
};

export async function supabaseQueryWithTimeout<T>(
  queryBuilder: SupabaseQueryBuilder<T> | Promise<SupabaseQueryResult<T>>,
  timeoutMs: number = 25000, // 25s - tempo suficiente para conexões lentas após idle
  signal?: AbortSignal
): Promise<SupabaseQueryResult<T>> {

  const queryDesc = (queryBuilder as any)?.url || 'Query';
  // console.log(`🔍 [TimeoutWrapper] Iniciando: ${queryDesc}`);

  if (signal?.aborted) {
    // Query já abortada pelo React Query (comportamento normal em navegação rápida)
    throw new Error('Query cancelada');
  }

  // Criar AbortController para o timeout interno
  const timeoutController = new AbortController();

  // Promessa que rejeita se o tempo acabar
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(`⏳ [TimeoutWrapper] EXCEDIDO ${timeoutMs}ms em: ${queryDesc}`);
      timeoutController.abort();
      reject(new Error(`Timeout de ${timeoutMs}ms excedido`));
    }, timeoutMs);
  });

  // Listener para abort externo
  if (signal) {
    signal.addEventListener('abort', () => {
      // console.log(`🛑 [TimeoutWrapper] Abortado externamente: ${queryDesc}`);
      clearTimeout(timeoutId);
      timeoutController.abort();
    }, { once: true });
  }

  try {
    // Executar a query
    let queryPromise: Promise<SupabaseQueryResult<T>>;

    // Se o builder suportar abortSignal, injetamos o controller de timeout
    if (typeof (queryBuilder as any).abortSignal === 'function') {
      queryPromise = (queryBuilder as SupabaseQueryBuilder<T>).abortSignal(timeoutController.signal);
    } else {
      queryPromise = queryBuilder as Promise<SupabaseQueryResult<T>>;
    }

    // Corrida entre a query e o timeout
    const result = await Promise.race([
      queryPromise,
      timeoutPromise
    ]);

    clearTimeout(timeoutId);
    // console.log(`✨ [TimeoutWrapper] Finalizado com sucesso: ${queryDesc}`);
    return result as SupabaseQueryResult<T>;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || error.message?.includes('Timeout')) {
      // Já logado ou esperado
    } else {
      console.error(`❌ [TimeoutWrapper] ERRO em ${queryDesc}:`, error);
    }
    throw error;
  }
}
