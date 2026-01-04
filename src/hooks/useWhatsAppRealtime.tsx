/**
 * Hook para subscriptions realtime do WhatsApp
 * @module hooks/useWhatsAppRealtime
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { toast } from '@/components/ui/use-toast';
import { WHATSAPP_CONVERSATIONS_KEY, WHATSAPP_INBOX_STATS_KEY } from '@/hooks/useWhatsAppConversations';
import { WHATSAPP_MESSAGES_KEY } from '@/hooks/useWhatsAppMessages';

interface UseWhatsAppRealtimeOptions {
  enabled?: boolean;
  conversationId?: string;
  ignoreConversationId?: string; // ID da conversa atual para não notificar
  onNewMessage?: (message: any) => void;
  onStatusUpdate?: (update: any) => void;
}

export function useWhatsAppRealtime(options: UseWhatsAppRealtimeOptions = {}) {
  const {
    enabled = true,
    conversationId,
    ignoreConversationId,
    onNewMessage,
    onStatusUpdate,
  } = options;

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { doctorIds } = useSecretaryDoctors();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Som de notificação (base64 para garantir que sempre funcione)
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleX98hYuAe3Z7gH1+gYSAe3t7fX9/fn9/gYGBgYGAgYGAgH9/f4CAgICAgICAgH+AgICAgICA');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.debug('[Realtime] Audio play blocked:', err));
    } catch (error) {
      console.error('[Realtime] Error playing sound:', error);
    }
  }, []);

  // Refs para callbacks estáveis (evita reiniciar effect se o pai recriar a função)
  const onNewMessageRef = useRef(onNewMessage);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onNewMessage, onStatusUpdate]);

  // Canal Único por instância do hook para evitar conflitos de binding
  const channelName = useMemo(() => {
    if (!user?.id) return 'whatsapp-rt-anon';
    const suffix = conversationId ? `chat-${conversationId}` : `global-${user.id}`;
    return `whatsapp-rt-${suffix}`;
  }, [conversationId, user?.id]);

  // =========================================
  // Subscription start
  // =========================================
  useEffect(() => {
    // 1. Validação básica (Primitive checks only)
    if (!enabled || !user?.id) return;

    // 2. Parse dos IDs (Deep check via string)
    const currentDoctorIds = doctorIds || [];
    const allUserIds = [user.id, ...currentDoctorIds];
    const userIdsStr = allUserIds.sort().join(','); // Sort garante consistência

    console.log(`[WhatsApp Realtime] Connecting:`, {
      channelName,
      userId: user.id,
      doctorIds: currentDoctorIds,
      allUserIds,
      conversationId: conversationId || 'global'
    });

    // Criar canal único
    const channel = supabase.channel(channelName);

    // Listener para mensagens
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
      (payload) => {
        const message = payload.new as any;
        const monitoredIds = userIdsStr.split(',');

        console.log('[REALTIME] Message received:', {
          id: message.id,
          direction: message.direction,
          conversation_id: message.conversation_id,
          currentConversationId: conversationId,
          isMatch: message.conversation_id === conversationId
        });

        // Invalidação imediata de estatísticas e conversas
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });

        // 1. Prioridade: Se é a conversa ATUAL, atualiza SEMPRE (bypass user filter)
        if (conversationId && message.conversation_id === conversationId) {
          console.log('[REALTIME] Refreshing current chat messages');

          // Forçar refetch das mensagens imediatamente
          queryClient.refetchQueries({
            queryKey: [WHATSAPP_MESSAGES_KEY, message.conversation_id],
            type: 'active',
          });

          if (onNewMessageRef.current) onNewMessageRef.current(message);

          // Tocar som para mensagens na conversa ativa
          if (message.direction === 'inbound') {
            playNotificationSound();
          }

          // AUTO-ANALYZE: Se for uma nova mensagem do paciente, dispara a análise de IA
          // Isso ativa a funcionalidade de Auto-Resposta caso esteja configurada na Edge Function
          if (message.direction === 'inbound') {
            // Chamar diretamente sem usar cache do React Query
            console.log('[AI-TRIGGER] Triggering auto-analyze for inbound message:', message.conversation_id);
            supabase.functions.invoke('whatsapp-ai-analyze', {
              body: { conversation_id: message.conversation_id }
            }).then(result => {
              if (result.error) {
                console.error('[AI-TRIGGER] Auto-analyze error:', result.error);
              } else {
                console.log('[AI-TRIGGER] Auto-analyze FULL RESULT:', JSON.stringify(result.data, null, 2));
                console.log('[AI-TRIGGER] Auto-analyze completed:', result.data?.analysis?.lead_status);
                // Invalidar queries de análise para atualizar UI
                queryClient.invalidateQueries({ queryKey: ['whatsapp-analysis', message.conversation_id] });
                queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions', message.conversation_id] });
              }
            }).catch(err => {
              console.error('[AI-TRIGGER] Auto-analyze exception:', err);
            });
          }
        }

        // 2. Filtro de Segurança/Global para outras conversas (Apenas se não for um hook de conversa específica)
        else if (!conversationId && monitoredIds.includes(message.user_id)) {
          // Notificação apenas se for relevante para o usuário
          if (message.direction === 'inbound' && message.conversation_id !== ignoreConversationId) {
            toast({
              title: 'Nova mensagem',
              description: message.content?.substring(0, 50) || 'Anexo recebido',
            });
            playNotificationSound();

            // Disparar análise mesmo em background para auto-resposta funcionar globalmente
            // console.log('[DEBUG-REALTIME] Triggering background auto-analyze');
            supabase.functions.invoke('whatsapp-ai-analyze', {
              body: { conversation_id: message.conversation_id }
            });
          }
        }
      }
    );

    // Listener para status updates
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
      (payload) => {
        const message = payload.new as any;
        const monitoredIds = userIdsStr.split(',');

        if (!monitoredIds.includes(message.user_id)) return;

        queryClient.invalidateQueries({
          queryKey: [WHATSAPP_MESSAGES_KEY, message.conversation_id],
          refetchType: 'active',
        });

        if (onStatusUpdateRef.current) onStatusUpdateRef.current(message);
      }
    );

    // Listener para conversas
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'whatsapp_conversations' },
      (payload) => {
        const conv = (payload.new || payload.old) as any;
        const monitoredIds = userIdsStr.split(',');

        if (!monitoredIds.includes(conv?.user_id)) return;

        queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });
      }
    );

    // Iniciar subscription
    channel.subscribe((status, err) => {
      console.log(`[WhatsApp Realtime] ${channelName} Status:`, status, err || '');
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      // console.log(`[WhatsApp Realtime] Cleaning up channel: ${channelName}`);
      channel.unsubscribe();
      channelRef.current = null;
    };
    // DEPENDENCIES: 
    // - channelName: Stable if conversationId and user.id are stable.
    // - userIdsStr: Stable if ID list content doesn't change (string comparison).
    // - enabled: boolean primitive.
    // NO FUNCTIONS (refs used), NO ARRAYS (string used).
  }, [enabled, user?.id, channelName, conversationId, ignoreConversationId, queryClient, doctorIds.length > 0 ? doctorIds.join(',') : '', user.id]);

  // =========================================
  // Broadcast de "digitando..."
  // =========================================
  const sendTypingIndicator = useCallback(
    async (targetConversationId: string, isTyping: boolean) => {
      if (!channelRef.current || !user?.id) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            conversationId: targetConversationId,
            userId: user.id,
            isTyping,
          },
        });
      } catch (error) {
        console.error('[WhatsApp Realtime] Error sending typing indicator:', error);
      }
    },
    [user?.id]
  );

  // =========================================
  // Subscribe para typing indicators
  // =========================================
  const onTypingIndicator = useCallback(
    (callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => {
      if (!channelRef.current) return () => { };

      const channel = channelRef.current;
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        callback(payload);
      });

      return () => {
        // Cleanup handled by channel unsubscribe generally, but we could remove listener if supabase-js supported it easily
      };
    },
    []
  );

  return {
    sendTypingIndicator,
    onTypingIndicator,
    isConnected: !!channelRef.current,
  };
}
