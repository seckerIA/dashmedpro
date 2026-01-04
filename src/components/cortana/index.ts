// Cortana - Assistente de Voz IA
// Exporta todos os componentes e hooks relacionados

export { CortanaProvider, useCortanaContext, CortanaContext } from './CortanaProvider';
export { CortanaButton, CortanaButtonCompact } from './CortanaButton';
export { CortanaOverlay } from './CortanaOverlay';

// Re-export do hook principal
export { useCortana, useCortanaStatus, useCortanaActions, useCortanaPermissions } from '@/hooks/useCortana';

// Re-export de types
export type {
  CortanaStatus,
  CortanaState,
  CortanaContext as CortanaUserContext,
  CortanaCallbacks,
} from '@/types/cortana';
