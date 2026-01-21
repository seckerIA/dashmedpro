/**
 * Hook para gerenciar mensagens do WhatsApp
 * @module hooks/useWhatsAppMessages
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/components/ui/use-toast';
import { WHATSAPP_CONVERSATIONS_KEY, WHATSAPP_INBOX_STATS_KEY } from './useWhatsAppConversations';
import { withQueryTimeout } from '@/lib/queryUtils';
import type {
  WhatsAppMessage,
  WhatsAppMessageWithRelations,
  WhatsAppMessageInsert,
  SendTextMessagePayload,
  SendMediaMessagePayload,
  SendTemplateMessagePayload,
} from '@/types/whatsapp';

// Query keys
export const WHATSAPP_MESSAGES_KEY = 'whatsapp-messages';

interface UseWhatsAppMessagesOptions {
  conversationId: string;
  limit?: number;
  enabled?: boolean;
}

export function useWhatsAppMessages(options: UseWhatsAppMessagesOptions) {
  const { conversationId, limit = 50, enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  // =========================================
  // Query: Lista de mensagens (paginada)
  // =========================================
  const messagesQuery = useInfiniteQuery({
    queryKey: [WHATSAPP_MESSAGES_KEY, conversationId],
    queryFn: async ({ pageParam = 0 }): Promise<WhatsAppMessageWithRelations[]> => {
      return withQueryTimeout(async () => {
        if (!conversationId) return [];

        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select(`
          *,
          media:whatsapp_media(*)
        `)
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: false })
          .range(pageParam, pageParam + limit - 1);

        if (error) {
          console.error('[useWhatsAppMessages] Error:', error);
          throw error;
        }

        // Reverter ordem para exibição (mais antigas primeiro)
        return (data || []).reverse() as WhatsAppMessageWithRelations[];
      }, 15000); // 15s timeout
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
    enabled: enabled && !!conversationId,
    staleTime: Infinity, // Mensagens são atualizadas via Realtime ou Mutação
    refetchOnWindowFocus: false, // Evitar refetch ao trocar de aba
  });

  // Flatten all pages into single array in chronological order
  // Pages are fetched newest first (Page 0 = most recent)
  // To have chronological order [oldest -> newest], we reverse the pages array
  // Also deduplicate messages by ID to prevent React key warnings
  const allMessages = useMemo(() => {
    if (!messagesQuery.data?.pages) return [];

    const flattened = [...messagesQuery.data.pages].reverse().flat();

    // Deduplicar por ID (mantém a primeira ocorrência)
    const seen = new Set<string>();
    return flattened.filter(msg => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });
  }, [messagesQuery.data?.pages]);

  // =========================================
  // Mutation: Enviar mensagem de texto
  // =========================================
  const sendTextMutation = useMutation({
    mutationFn: async (payload: SendTextMessagePayload): Promise<WhatsAppMessage> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // console.log('[sendText] User ID:', user.id);
      // console.log('[sendText] Conversation ID:', payload.conversation_id);

      // Buscar dados da conversa
      const { data: conversation, error: convError } = await (supabase
        .from('whatsapp_conversations' as any)
        .select('phone_number, user_id')
        .eq('id', payload.conversation_id)
        .single() as any);

      // console.log('[sendText] Query result:', { conversation, error: convError });

      if (convError || !conversation) {
        console.error('[sendText] Conversation not found. Error:', convError);
        throw new Error(`Conversa não encontrada: ${convError?.message || 'desconhecido'}`);
      }

      // Criar mensagem no banco (status: sending)
      const messageData: WhatsAppMessageInsert = {
        user_id: conversation.user_id,
        organization_id: profile?.organization_id,
        conversation_id: payload.conversation_id,
        phone_number: conversation.phone_number,
        content: payload.content,
        direction: 'outbound',
        message_type: 'text',
        status: 'sent',
        sent_at: new Date().toISOString(),
        reply_to_message_id: payload.reply_to_message_id || null,
      };

      const { data: message, error: msgError } = await (supabase
        .from('whatsapp_messages' as any)
        .insert(messageData as any)
        .select()
        .single() as any);

      if (msgError) throw msgError;

      // Chamar Edge Function para enviar via WhatsApp API
      const { error: sendError } = await supabase.functions.invoke('whatsapp-send-message', {
        body: {
          message_id: message.id,
          phone_number: conversation.phone_number,
          content: payload.content,
          reply_to_wa_id: payload.reply_to_message_id
            ? await getWhatsAppMessageId(payload.reply_to_message_id)
            : undefined,
        },
      });

      if (sendError) {
        // Atualizar status para failed
        await (supabase
          .from('whatsapp_messages' as any)
          .update({
            status: 'failed',
            error_message: sendError.message,
          } as any)
          .eq('id', message.id) as any);

        throw sendError;
      }

      // Atualizar conversa
      await (supabase
        .from('whatsapp_conversations' as any)
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: payload.content.substring(0, 100),
          last_message_direction: 'outbound',
          unread_count: 0,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payload.conversation_id) as any);

      return message as WhatsAppMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, conversationId] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Enviar mídia
  // =========================================
  const sendMediaMutation = useMutation({
    mutationFn: async (payload: SendMediaMessagePayload): Promise<WhatsAppMessage> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Buscar dados da conversa
      const { data: conversation, error: convError } = await (supabase
        .from('whatsapp_conversations' as any)
        .select('phone_number, user_id')
        .eq('id', payload.conversation_id)
        .single() as any);

      if (convError || !conversation) {
        throw new Error('Conversa não encontrada');
      }

      // Criar mensagem no banco
      const { data: message, error: msgError } = await (supabase
        .from('whatsapp_messages' as any)
        .insert({
          user_id: conversation.user_id,
          organization_id: profile?.organization_id,
          conversation_id: payload.conversation_id,
          phone_number: conversation.phone_number,
          content: payload.caption || `[${payload.media_type}]`,
          direction: 'outbound',
          message_type: payload.media_type,
          status: 'sent',
          sent_at: new Date().toISOString(),
          reply_to_message_id: payload.reply_to_message_id || null,
        } as any)
        .select()
        .single() as any);

      if (msgError) throw msgError;

      // Salvar mídia
      await (supabase.from('whatsapp_media' as any).insert({
        message_id: message.id,
        media_type: payload.media_type,
        media_url: payload.media_url,
        file_name: payload.file_name || null,
      } as any) as any);

      // Chamar Edge Function para enviar via WhatsApp API
      const { error: sendError } = await supabase.functions.invoke('whatsapp-send-message', {
        body: {
          message_id: message.id,
          phone_number: conversation.phone_number,
          media_type: payload.media_type,
          media_url: payload.media_url,
          caption: payload.caption,
        },
      });

      if (sendError) {
        await (supabase
          .from('whatsapp_messages' as any)
          .update({
            status: 'failed',
            error_message: sendError.message,
          } as any)
          .eq('id', message.id) as any);

        throw sendError;
      }

      // Atualizar conversa
      await (supabase
        .from('whatsapp_conversations' as any)
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: payload.caption || `[${payload.media_type}]`,
          last_message_direction: 'outbound',
          unread_count: 0,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payload.conversation_id) as any);

      return message as WhatsAppMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, conversationId] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mídia',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Enviar template
  // =========================================
  const sendTemplateMutation = useMutation({
    mutationFn: async (payload: SendTemplateMessagePayload): Promise<WhatsAppMessage> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Buscar dados da conversa e template
      const [conversationResult, templateResult] = await Promise.all([
        supabase
          .from('whatsapp_conversations' as any)
          .select('phone_number, user_id')
          .eq('id', payload.conversation_id)
          .single() as any,
        supabase
          .from('whatsapp_templates' as any)
          .select('*')
          .eq('id', payload.template_id)
          .single() as any,
      ]);

      if (conversationResult.error || !conversationResult.data) {
        throw new Error('Conversa não encontrada');
      }
      if (templateResult.error || !templateResult.data) {
        throw new Error('Template não encontrado');
      }

      const conversation = conversationResult.data;
      const template = templateResult.data;

      // Montar preview do template
      let preview = template.name;
      const bodyComponent = (template.components as any[])?.find(c => c.type === 'BODY');
      if (bodyComponent?.text) {
        preview = bodyComponent.text;
        // Substituir variáveis
        if (payload.template_variables) {
          Object.entries(payload.template_variables).forEach(([key, value]) => {
            preview = preview.replace(`{{${key}}}`, value);
          });
        }
      }

      // Criar mensagem no banco
      const { data: message, error: msgError } = await (supabase
        .from('whatsapp_messages' as any)
        .insert({
          user_id: conversation.user_id,
          organization_id: profile?.organization_id,
          conversation_id: payload.conversation_id,
          phone_number: conversation.phone_number,
          content: preview,
          direction: 'outbound',
          message_type: 'template',
          status: 'sent',
          sent_at: new Date().toISOString(),
          template_id: payload.template_id,
          metadata: {
            template_name: template.name,
            template_variables: payload.template_variables,
          },
        } as any)
        .select()
        .single() as any);

      if (msgError) throw msgError;

      // Chamar Edge Function para enviar via WhatsApp API
      const { error: sendError } = await supabase.functions.invoke('whatsapp-send-message', {
        body: {
          message_id: message.id,
          phone_number: conversation.phone_number,
          template_name: template.name,
          template_language: template.language,
          template_variables: payload.template_variables,
        },
      });

      if (sendError) {
        await (supabase
          .from('whatsapp_messages' as any)
          .update({
            status: 'failed',
            error_message: sendError.message,
          } as any)
          .eq('id', message.id) as any);

        throw sendError;
      }

      // Atualizar conversa
      await (supabase
        .from('whatsapp_conversations' as any)
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: preview.substring(0, 100),
          last_message_direction: 'outbound',
          unread_count: 0,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payload.conversation_id) as any);

      return message as WhatsAppMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, conversationId] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
      toast({
        title: 'Template enviado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Helper: Buscar wa_id de uma mensagem
  // =========================================
  async function getWhatsAppMessageId(messageId: string): Promise<string | undefined> {
    const { data } = await (supabase
      .from('whatsapp_messages' as any)
      .select('message_id')
      .eq('id', messageId)
      .single() as any);

    return data?.message_id || undefined;
  }

  // =========================================
  // Helpers
  // =========================================
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: [WHATSAPP_MESSAGES_KEY, conversationId] });
  };

  const addOptimisticMessage = (content: string) => {
    // Adicionar mensagem otimisticamente ao cache
    queryClient.setQueryData(
      [WHATSAPP_MESSAGES_KEY, conversationId],
      (old: any) => {
        if (!old) return old;
        const optimisticMessage: Partial<WhatsAppMessage> = {
          id: `temp-${Date.now()}`,
          content,
          direction: 'outbound',
          message_type: 'text',
          status: 'sent',
          sent_at: new Date().toISOString(),
          conversation_id: conversationId,
        };
        return {
          ...old,
          pages: [
            ...old.pages.slice(0, -1),
            [...(old.pages[old.pages.length - 1] || []), optimisticMessage],
          ],
        };
      }
    );
  };

  return {
    // Data
    messages: allMessages,
    isLoading: messagesQuery.isLoading,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    hasNextPage: messagesQuery.hasNextPage,
    error: messagesQuery.error,

    // Pagination
    fetchNextPage: messagesQuery.fetchNextPage,

    // Mutations
    sendText: sendTextMutation.mutateAsync,
    isSendingText: sendTextMutation.isPending,

    sendMedia: sendMediaMutation.mutateAsync,
    isSendingMedia: sendMediaMutation.isPending,

    sendTemplate: sendTemplateMutation.mutateAsync,
    isSendingTemplate: sendTemplateMutation.isPending,

    isSending: sendTextMutation.isPending || sendMediaMutation.isPending || sendTemplateMutation.isPending,

    // Helpers
    refetch,
    addOptimisticMessage,
  };
}
