/**
 * Hook para gerenciar conversas do WhatsApp (Inbox)
 * @module hooks/useWhatsAppConversations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { toast } from '@/components/ui/use-toast';
import type {
  WhatsAppConversation,
  WhatsAppConversationWithRelations,
  WhatsAppConversationUpdate,
  WhatsAppConversationFilters,
  WhatsAppConversationStatus,
  WhatsAppInboxStats,
} from '@/types/whatsapp';

// Query keys
export const WHATSAPP_CONVERSATIONS_KEY = 'whatsapp-conversations';
export const WHATSAPP_INBOX_STATS_KEY = 'whatsapp-inbox-stats';

interface UseWhatsAppConversationsOptions {
  filters?: WhatsAppConversationFilters;
  limit?: number;
  enabled?: boolean;
}

export function useWhatsAppConversations(options: UseWhatsAppConversationsOptions = {}) {
  const { filters, limit = 50, enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { linkedDoctorIds } = useSecretaryDoctors();

  // IDs para filtrar (próprio usuário + médicos vinculados para secretária)
  const userIds = user?.id ? [user.id, ...(linkedDoctorIds || [])] : [];

  // =========================================
  // Query: Lista de conversas
  // =========================================
  const conversationsQuery = useQuery({
    queryKey: [WHATSAPP_CONVERSATIONS_KEY, filters, limit, userIds],
    queryFn: async (): Promise<WhatsAppConversationWithRelations[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          contact:crm_contacts(id, full_name, email, phone),
          assigned_to_profile:profiles!whatsapp_conversations_assigned_to_profiles_fkey(id, full_name, email, avatar_url)
        `)
        .in('user_id', userIds)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      // Aplicar filtros
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_to', null);
        } else if (filters.assignedTo !== 'all') {
          query = query.eq('assigned_to', filters.assignedTo);
        }
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.search) {
        query = query.or(`contact_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,last_message_preview.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useWhatsAppConversations] Error:', error);
        throw error;
      }

      // Buscar labels para cada conversa
      if (data && data.length > 0) {
        const conversationIds = data.map(c => c.id);
        const { data: labelAssignments } = await supabase
          .from('whatsapp_conversation_label_assignments')
          .select(`
            conversation_id,
            label:whatsapp_conversation_labels(id, name, color, description)
          `)
          .in('conversation_id', conversationIds);

        // Mapear labels para conversas
        const labelsMap = new Map<string, any[]>();
        labelAssignments?.forEach(la => {
          if (!labelsMap.has(la.conversation_id)) {
            labelsMap.set(la.conversation_id, []);
          }
          if (la.label) {
            labelsMap.get(la.conversation_id)!.push(la.label);
          }
        });

        return data.map(conv => ({
          ...conv,
          labels: labelsMap.get(conv.id) || [],
        })) as WhatsAppConversationWithRelations[];
      }

      return data as WhatsAppConversationWithRelations[];
    },
    enabled: enabled && !!user?.id && userIds.length > 0,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000,
    refetchInterval: 1000, // Atualiza a lista a cada 1s para refletir últimas mensagens
  });

  // =========================================
  // Query: Estatísticas do Inbox
  // =========================================
  const statsQuery = useQuery({
    queryKey: [WHATSAPP_INBOX_STATS_KEY, userIds],
    queryFn: async (): Promise<WhatsAppInboxStats> => {
      if (!user?.id) {
        return {
          total_conversations: 0,
          open_count: 0,
          pending_count: 0,
          resolved_count: 0,
          unread_messages: 0,
          assigned_to_me: 0,
        };
      }

      // Tentar usar função RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_whatsapp_inbox_stats', { p_user_id: user.id });

      if (!rpcError && rpcData) {
        return rpcData as WhatsAppInboxStats;
      }

      // Fallback: calcular manualmente
      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id, status, unread_count, assigned_to')
        .in('user_id', userIds);

      if (!conversations) {
        return {
          total_conversations: 0,
          open_count: 0,
          pending_count: 0,
          resolved_count: 0,
          unread_messages: 0,
          assigned_to_me: 0,
        };
      }

      return {
        total_conversations: conversations.length,
        open_count: conversations.filter(c => c.status === 'open').length,
        pending_count: conversations.filter(c => c.status === 'pending').length,
        resolved_count: conversations.filter(c => c.status === 'resolved').length,
        unread_messages: conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
        assigned_to_me: conversations.filter(c => c.assigned_to === user.id).length,
      };
    },
    enabled: enabled && !!user?.id,
    staleTime: 60 * 1000, // 1 minuto
  });

  // =========================================
  // Mutation: Atualizar conversa
  // =========================================
  const updateConversationMutation = useMutation({
    mutationFn: async ({
      conversationId,
      updates,
    }: {
      conversationId: string;
      updates: WhatsAppConversationUpdate;
    }): Promise<WhatsAppConversation> => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar conversa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Alterar status
  // =========================================
  const changeStatusMutation = useMutation({
    mutationFn: async ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: WhatsAppConversationStatus;
    }) => {
      return updateConversationMutation.mutateAsync({
        conversationId,
        updates: { status },
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Status atualizado',
        description: `Conversa marcada como ${variables.status}`,
      });
    },
  });

  // =========================================
  // Mutation: Atribuir atendente
  // =========================================
  const assignConversationMutation = useMutation({
    mutationFn: async ({
      conversationId,
      assignedTo,
    }: {
      conversationId: string;
      assignedTo: string | null;
    }) => {
      return updateConversationMutation.mutateAsync({
        conversationId,
        updates: { assigned_to: assignedTo },
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.assignedTo ? 'Conversa atribuída' : 'Atribuição removida',
      });
    },
  });

  // =========================================
  // Mutation: Marcar como lida
  // =========================================
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Tentar usar função RPC
      const { error: rpcError } = await supabase
        .rpc('mark_conversation_as_read', {
          p_conversation_id: conversationId,
          p_user_id: user?.id,
        });

      if (rpcError) {
        // Fallback: update direto
        await supabase
          .from('whatsapp_conversations')
          .update({ unread_count: 0 })
          .eq('id', conversationId);

        await supabase
          .from('whatsapp_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('direction', 'inbound')
          .is('read_at', null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });
    },
  });

  // =========================================
  // Mutation: Mutar/Desmutar conversa
  // =========================================
  const toggleMuteMutation = useMutation({
    mutationFn: async ({
      conversationId,
      mute,
    }: {
      conversationId: string;
      mute: boolean;
    }) => {
      return updateConversationMutation.mutateAsync({
        conversationId,
        updates: { is_muted: mute },
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.mute ? 'Conversa silenciada' : 'Notificações ativadas',
      });
    },
  });

  // =========================================
  // Helpers
  // =========================================
  const getConversationById = (id: string) => {
    return conversationsQuery.data?.find(c => c.id === id);
  };

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATIONS_KEY] });
    queryClient.invalidateQueries({ queryKey: [WHATSAPP_INBOX_STATS_KEY] });
  };

  return {
    // Data
    conversations: conversationsQuery.data || [],
    stats: statsQuery.data,
    isLoading: conversationsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    error: conversationsQuery.error,

    // Mutations
    updateConversation: updateConversationMutation.mutateAsync,
    isUpdating: updateConversationMutation.isPending,

    changeStatus: changeStatusMutation.mutateAsync,
    isChangingStatus: changeStatusMutation.isPending,

    assignConversation: assignConversationMutation.mutateAsync,
    isAssigning: assignConversationMutation.isPending,

    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,

    toggleMute: toggleMuteMutation.mutateAsync,
    isTogglingMute: toggleMuteMutation.isPending,

    // Helpers
    getConversationById,
    refetch: conversationsQuery.refetch,
    refetchAll,
  };
}
