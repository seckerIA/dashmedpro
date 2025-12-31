/**
 * Hook para subscriptions realtime do WhatsApp
 * @module hooks/useWhatsAppRealtime
 */

import { useEffect, useCallback, useRef } from 'react';
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
  onNewMessage?: (message: any) => void;
  onStatusUpdate?: (update: any) => void;
}

export function useWhatsAppRealtime(options: UseWhatsAppRealtimeOptions = {}) {
  const {
    enabled = true,
    conversationId,
    onNewMessage,
    onStatusUpdate,
  } = options;

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { linkedDoctorIds } = useSecretaryDoctors();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // IDs para filtrar (próprio usuário + médicos vinculados para secretária)
  const userIds = user?.id ? [user.id, ...(linkedDoctorIds || [])] : [];

  // =========================================
  // Subscription para novas mensagens
  // =========================================
  useEffect(() => {
    if (!enabled || !user?.id || userIds.length === 0) return;

    // Criar canal
    const channel = supabase.channel('whatsapp-realtime', {
      config: { presence: { key: user.id } },
    });

    // Subscription para mensagens
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: conversationId
          ? `conversation_id=eq.${conversationId}`
          : undefined,
      },
      (payload) => {
        console.log('[WhatsApp Realtime] New message:', payload.new);

        // Verificar se a mensagem pertence a um dos usuários monitorados
        const message = payload.new as any;
        if (!userIds.includes(message.user_id)) return;

        // Callback customizado
        if (onNewMessage) {
          onNewMessage(message);
        }

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, message.conversation_id] });
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });

        // Notificação para mensagens recebidas
        if (message.direction === 'inbound') {
          // Buscar info da conversa para o toast
          const conversations = queryClient.getQueryData<any[]>([WHATSAPP_CONVERSATIONS_KEY]) || [];
          const conversation = conversations.find((c: any) => c.id === message.conversation_id);
          const contactName = conversation?.contact_name || message.phone_number || 'Novo contato';

          toast({
            title: contactName,
            description: message.content?.substring(0, 50) || 'Nova mensagem',
          });
        }
      }
    );

    // Subscription para status updates (delivered, read)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: conversationId
          ? `conversation_id=eq.${conversationId}`
          : undefined,
      },
      (payload) => {
        console.log('[WhatsApp Realtime] Status update:', payload.new);

        const message = payload.new as any;
        if (!userIds.includes(message.user_id)) return;

        // Callback customizado
        if (onStatusUpdate) {
          onStatusUpdate(message);
        }

        // Invalidar apenas mensagens
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, message.conversation_id] });
      }
    );

    // Subscription para conversas (novos contatos, mudanças de status)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'whatsapp_conversations',
      },
      (payload) => {
        console.log('[WhatsApp Realtime] Conversation change:', payload);

        const conversation = (payload.new || payload.old) as any;
        if (!userIds.includes(conversation?.user_id)) return;

        queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
        queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });
      }
    );

    // Iniciar subscription
    channel.subscribe((status) => {
      console.log('[WhatsApp Realtime] Subscription status:', status);
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[WhatsApp Realtime] Unsubscribing...');
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, user?.id, userIds.join(','), conversationId, queryClient, onNewMessage, onStatusUpdate]);

  // =========================================
  // Broadcast de "digitando..."
  // =========================================
  const sendTypingIndicator = useCallback(
    async (conversationId: string, isTyping: boolean) => {
      if (!channelRef.current || !user?.id) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            conversationId,
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
      if (!channelRef.current) return () => {};

      channelRef.current.on('broadcast', { event: 'typing' }, ({ payload }) => {
        callback(payload);
      });

      return () => {
        // Cleanup handled by channel unsubscribe
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
