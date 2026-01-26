/**
 * Fetch Registry - Global AbortController tracking
 *
 * Problema: TanStack Query's cancelQueries() não aborta requisições HTTP reais.
 * Os fetch() continuam ocupando slots de conexão do navegador (limite ~6/domínio).
 *
 * Solução: Este registry rastreia todos os AbortControllers ativos, permitindo
 * abortar TODAS as requisições pendentes de uma vez quando necessário (recovery).
 */

let controllerId = 0;
const activeControllers = new Map<number, AbortController>();

/**
 * Cria um novo AbortController e registra no registry
 * @returns Objeto com ID único e o controller
 */
export function createTrackedController(): { id: number; controller: AbortController } {
    const id = ++controllerId;
    const controller = new AbortController();
    activeControllers.set(id, controller);
    return { id, controller };
}

/**
 * Remove um controller do registry (chamado após fetch completar)
 * @param id - ID do controller a remover
 */
export function removeController(id: number): void {
    activeControllers.delete(id);
}

/**
 * ABORTA TODOS os controllers ativos
 * Isso libera imediatamente todos os slots de conexão do navegador
 * @returns Número de requisições abortadas
 */
export function abortAllPendingFetches(): number {
    const count = activeControllers.size;

    if (count > 0) {
        console.log(`🛑 [FetchRegistry] Abortando ${count} requisições pendentes...`);

        for (const [id, controller] of activeControllers) {
            try {
                controller.abort();
            } catch {
                // Ignorar erros de abort
            }
        }

        activeControllers.clear();
    }

    return count;
}

/**
 * Retorna quantidade de fetches ativos (para debug)
 */
export function getActiveFetchCount(): number {
    return activeControllers.size;
}
