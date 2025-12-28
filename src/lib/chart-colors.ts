/**
 * Paleta de cores consistente para gráficos
 * Suporta dark mode e cores semânticas
 */

export const CHART_COLORS = {
  // Cores primárias para gráficos
  primary: [
    '#6366f1', // Índigo
    '#8b5cf6', // Roxo
    '#ec4899', // Rosa
    '#f59e0b', // Amarelo
    '#10b981', // Verde
    '#06b6d4', // Ciano
    '#3b82f6', // Azul
    '#f97316', // Laranja
  ],
  
  // Cores semânticas
  semantic: {
    success: {
      light: '#10b981',
      dark: '#34d399',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      light: '#f59e0b',
      dark: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    error: {
      light: '#ef4444',
      dark: '#f87171',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    info: {
      light: '#3b82f6',
      dark: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
  },
  
  // Gradientes para gráficos modernos
  gradients: [
    { start: '#6366f1', end: '#8b5cf6' }, // Índigo → Roxo
    { start: '#ec4899', end: '#f472b6' }, // Rosa → Rosa claro
    { start: '#f59e0b', end: '#fbbf24' }, // Amarelo → Amarelo claro
    { start: '#10b981', end: '#34d399' }, // Verde → Verde claro
    { start: '#06b6d4', end: '#22d3ee' }, // Ciano → Ciano claro
    { start: '#3b82f6', end: '#60a5fa' }, // Azul → Azul claro
    { start: '#8b5cf6', end: '#a78bfa' }, // Roxo → Roxo claro
    { start: '#f97316', end: '#fb923c' }, // Laranja → Laranja claro
  ],
  
  // Cores para funil de conversão
  funnel: [
    { start: '#8b5cf6', end: '#6366f1' }, // Roxo → Índigo
    { start: '#6366f1', end: '#3b82f6' }, // Índigo → Azul
    { start: '#3b82f6', end: '#06b6d4' }, // Azul → Ciano
    { start: '#06b6d4', end: '#10b981' }, // Ciano → Verde
    { start: '#10b981', end: '#34d399' }, // Verde → Verde claro
  ],
};

/**
 * Obtém cor do gráfico por índice
 */
export function getChartColor(index: number): string {
  return CHART_COLORS.primary[index % CHART_COLORS.primary.length];
}

/**
 * Obtém gradiente por índice
 */
export function getGradient(index: number): { start: string; end: string } {
  return CHART_COLORS.gradients[index % CHART_COLORS.gradients.length];
}

/**
 * Obtém cor semântica baseada em valor
 */
export function getSemanticColor(value: number, threshold: number = 0): 'success' | 'warning' | 'error' {
  if (value >= threshold) return 'success';
  if (value >= threshold * 0.5) return 'warning';
  return 'error';
}








