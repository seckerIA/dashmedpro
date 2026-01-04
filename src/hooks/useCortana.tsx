// useCortana - Hook para acessar a Cortana de qualquer componente

import { useContext } from 'react';
import { CortanaContext } from '@/components/cortana/CortanaProvider';

/**
 * Hook para acessar a Cortana
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, startConversation, stopConversation } = useCortana();
 *
 *   if (state.isConnected) {
 *     return <button onClick={stopConversation}>Parar Cortana</button>;
 *   }
 *
 *   return <button onClick={startConversation}>Iniciar Cortana</button>;
 * }
 * ```
 */
export function useCortana() {
  const context = useContext(CortanaContext);

  if (!context) {
    throw new Error(
      'useCortana deve ser usado dentro de um CortanaProvider. ' +
      'Certifique-se de que seu componente está envolvido pelo CortanaProvider.'
    );
  }

  return context;
}

/**
 * Hook que retorna apenas o status da Cortana (mais leve)
 */
export function useCortanaStatus() {
  const { state } = useCortana();
  return {
    status: state.status,
    isConnected: state.isConnected,
    isMuted: state.isMuted,
    hasError: state.status === 'error',
    error: state.error,
  };
}

/**
 * Hook que retorna apenas as ações da Cortana
 */
export function useCortanaActions() {
  const { startConversation, stopConversation, toggleMute } = useCortana();
  return {
    startConversation,
    stopConversation,
    toggleMute,
  };
}

/**
 * Hook para verificar se uma ação é permitida para o usuário atual
 */
export function useCortanaPermissions() {
  const { userContext, isAllowedAction } = useCortana();

  return {
    userRole: userContext?.userRole,
    userName: userContext?.userName,
    isAllowedAction,
    allowedActions: userContext?.allowedActions || [],
  };
}

export default useCortana;
