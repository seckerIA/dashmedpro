/**
 * Constantes para estratégias de cache do React Query
 * Padroniza os tempos de cache em todo o sistema
 */

// Tempos em milissegundos
export const CACHE_TIMES = {
  // Dados críticos que mudam frequentemente (consultas, agendamentos)
  CRITICAL: 2 * 60 * 1000, // 2 minutos
  
  // Dados normais que mudam ocasionalmente (métricas, dashboard)
  NORMAL: 5 * 60 * 1000, // 5 minutos
  
  // Dados estáveis que raramente mudam (contatos, configurações)
  STABLE: 10 * 60 * 1000, // 10 minutos
  
  // Dados de referência que quase nunca mudam (categorias, tipos)
  REFERENCE: 15 * 60 * 1000, // 15 minutos
} as const;

// Tempos de garbage collection (quando remover do cache)
export const GC_TIMES = {
  CRITICAL: 5 * 60 * 1000, // 5 minutos
  NORMAL: 10 * 60 * 1000, // 10 minutos
  STABLE: 15 * 60 * 1000, // 15 minutos
  REFERENCE: 30 * 60 * 1000, // 30 minutos
} as const;

// Configurações padrão para queries
export const DEFAULT_QUERY_OPTIONS = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: 1000,
} as const;
