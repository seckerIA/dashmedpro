// CortanaProvider - Provider principal da Cortana
// Gerencia a conexão com ElevenLabs e fornece contexto

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { CORTANA_CONFIG, isCortanaConfigured } from '@/config/cortana';
import { supabase } from '@/integrations/supabase/client';
import { CortanaStatus, CortanaState, CortanaContext as CortanaUserContext } from '@/types/cortana';
import { buildCortanaContext, getDynamicOverrides } from '@/services/cortana/contextBuilder';
import { createClientTools, setActionCallback, PendingAction } from '@/services/cortana/clientTools';
import { initializeActionExecutor, injectHighlightStyles, executeAction } from '@/services/cortana/actionExecutor';

interface CortanaContextValue {
  // Estado
  state: CortanaState;
  isConfigured: boolean;
  userContext: CortanaUserContext | null;
  showModal: boolean;

  // Ações
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleMute: () => void;

  // Helpers
  isAllowedAction: (action: string) => boolean;
}

const CortanaContext = createContext<CortanaContextValue | null>(null);

export function CortanaProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();

  // Estado local
  const [state, setState] = useState<CortanaState>({
    status: 'idle',
    isConnected: false,
    isMuted: false,
    transcript: '',
    lastResponse: '',
    error: null,
  });

  // Controle para manter modal aberto mesmo após desconexão
  const [showModal, setShowModal] = useState(false);

  const isConfigured = isCortanaConfigured();

  // Construir contexto do usuário
  const userContext = useMemo(() => {
    if (!user || !profile) return null;
    return buildCortanaContext(
      user,
      profile,
      doctorIds?.map(id => ({ doctor_id: id })) || []
    );
  }, [user, profile, doctorIds]);

  // Criar client tools
  const clientTools = useMemo(() => {
    if (!userContext) return {};
    return createClientTools(userContext);
  }, [userContext]);



  // Hook do ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      // console.log('[Cortana] Conectada ao ElevenLabs');
      setShowModal(true);
      setState(prev => ({
        ...prev,
        status: 'listening',
        isConnected: true,
        error: null,
      }));
    },
    onDisconnect: () => {
      console.log('[Cortana] Desconectada - mantendo modal aberto');
      // Mantém modal aberto e mostra estado "desconectada"
      setState(prev => ({
        ...prev,
        status: 'idle',
        isConnected: false,
      }));
      // NÃO fecha o modal imediatamente - deixa o usuário decidir
    },
    onMessage: (message) => {
      // console.log('[Cortana] Mensagem:', message);
      if (message.source === 'user') {
        setState(prev => ({
          ...prev,
          transcript: message.message,
        }));
      } else if (message.source === 'ai') {
        setState(prev => ({
          ...prev,
          lastResponse: message.message,
        }));
      }
    },
    onError: (error) => {
      console.error('[Cortana] Erro:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: typeof error === 'string' ? error : 'Erro na conexão com a Cortana',
      }));
      toast({
        title: 'Erro na Cortana',
        description: 'Não foi possível conectar ao assistente de voz.',
        variant: 'destructive',
      });
    },
    onModeChange: (mode) => {
      console.log('[Cortana] Modo:', mode);
      // Atualizar status baseado no modo
      if (mode.mode === 'speaking') {
        setState(prev => ({ ...prev, status: 'speaking' }));
      } else if (mode.mode === 'listening') {
        setState(prev => ({ ...prev, status: 'listening' }));
      }
    },
  });

  // Iniciar conversa
  const startConversation = useCallback(async () => {
    if (!isConfigured) {
      toast({
        title: 'Cortana não configurada',
        description: 'Configure o Agent ID do ElevenLabs nas variáveis de ambiente.',
        variant: 'destructive',
      });
      return;
    }

    if (!userContext) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para usar a Cortana.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setShowModal(true); // Abre modal imediatamente
      setState(prev => ({ ...prev, status: 'connecting' }));

      // Solicitar permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log('[Cortana] Iniciando sessão com agentId:', CORTANA_CONFIG.agentId);

      // Verificar limite de uso diário (5 chamadas)
      const { data: usageData, error: usageError } = await supabase.rpc('check_and_increment_cortana_usage', {
        limit_count: 5
      });

      if (usageError) {
        console.error('[Cortana] Erro ao verificar limite:', usageError);
        // Em caso de erro técnico na verificação, optamos por permitir (fail open) ou bloquear?
        // Vamos permitir mas logar erro, ou bloquear por segurança.
        // Por segurança financeira, vamos bloquear temporariamente se der erro no RPC.
        toast({
          title: 'Erro de verificação',
          description: 'Não foi possível verificar seu limite de uso diário. Tente novamente.',
          variant: 'destructive',
        });
        setState(prev => ({ ...prev, status: 'idle', isConnected: false }));
        setShowModal(false);
        return;
      }

      if (usageData && !usageData.allowed) {
        toast({
          title: 'Limite Diário Atingido',
          description: `Você atingiu o limite de 5 utilizações diárias da Cortana.`,
          variant: 'destructive',
        });
        setState(prev => ({ ...prev, status: 'idle', isConnected: false }));
        setShowModal(false);
        return;
      }

      // Gerar variáveis dinâmicas
      const dynamicVariables = getDynamicOverrides(userContext);

      // Se passou, iniciar sessão
      await conversation.startSession({
        agentId: CORTANA_CONFIG.agentId,
        clientTools,
        dynamicVariables,
      });

      console.log('[Cortana] Sessão iniciada com sucesso');
    } catch (error: any) {
      console.error('[Cortana] Erro ao iniciar:', error);

      let errorMessage = 'Erro ao iniciar a Cortana.';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de microfone negada. Permita o acesso ao microfone para usar a Cortana.';
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));

      toast({
        title: 'Erro na Cortana',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isConfigured, userContext, conversation, clientTools, toast]);

  // Parar conversa e fechar modal
  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('[Cortana] Erro ao parar:', error);
    }
    // Sempre fecha o modal e reseta estado
    setShowModal(false);
    setState(prev => ({
      ...prev,
      status: 'idle',
      isConnected: false,
      transcript: '',
      lastResponse: '',
    }));
  }, [conversation]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    // O ElevenLabs SDK não tem um método direto de mute
    // Podemos implementar desconectando e reconectando
    setState(prev => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  }, []);

  // Verificar se ação é permitida
  const isAllowedAction = useCallback((action: string) => {
    if (!userContext) return false;
    return userContext.allowedActions.includes(action) || userContext.allowedActions.includes('*');
  }, [userContext]);

  // Hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key, ctrlKey, shiftKey } = CORTANA_CONFIG.hotkey;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrlKey &&
        e.shiftKey === shiftKey
      ) {
        e.preventDefault();

        if (state.isConnected) {
          stopConversation();
        } else {
          startConversation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isConnected, startConversation, stopConversation]);

  // Refs para manter dependências estáveis sem recriar o executor
  const stopConversationRef = useRef(stopConversation);

  useEffect(() => {
    stopConversationRef.current = stopConversation;
  }, [stopConversation]);

  // Inicializar Action Executor (apenas uma vez ou quando dependências críticas mudarem)
  useEffect(() => {
    console.log('[CortanaProvider] Inicializando ActionExecutor');

    initializeActionExecutor({
      navigate,
      toast,
      closeModal: () => stopConversationRef.current(),
      createToastAction: (label, onClick) => (
        <ToastAction altText={label} onClick={onClick}>
          {label}
        </ToastAction>
      ),
    });
    injectHighlightStyles();

    // Configurar callback para ações dos client tools
    setActionCallback((action: PendingAction) => {
      executeAction(action);
    });
  }, [navigate, toast]); // Removemos stopConversation das dependências diretas

  const value: CortanaContextValue = {
    state,
    isConfigured,
    userContext,
    showModal,
    startConversation,
    stopConversation,
    toggleMute,
    isAllowedAction,
  };

  return (
    <CortanaContext.Provider value={value}>
      {children}
    </CortanaContext.Provider>
  );
}

export function useCortanaContext() {
  const context = useContext(CortanaContext);
  if (!context) {
    throw new Error('useCortanaContext deve ser usado dentro de CortanaProvider');
  }
  return context;
}

export { CortanaContext };
