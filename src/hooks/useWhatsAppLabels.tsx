/**
 * Hook para gerenciar labels das conversas do WhatsApp
 * @module hooks/useWhatsAppLabels
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
type WhatsAppConversationLabel = any;
type WhatsAppConversationLabelInsert = any;

// Query keys
export const WHATSAPP_LABELS_KEY = 'whatsapp-labels';
export const WHATSAPP_CONVERSATION_LABELS_KEY = 'whatsapp-conversation-labels';

interface UseWhatsAppLabelsOptions {
  enabled?: boolean;
}

export function useWhatsAppLabels(options: UseWhatsAppLabelsOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // =========================================
  // Query: Lista de labels disponíveis
  // =========================================
  const labelsQuery = useQuery({
    queryKey: [WHATSAPP_LABELS_KEY, user?.id],
    queryFn: async (): Promise<WhatsAppConversationLabel[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('whatsapp_conversation_labels')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('[useWhatsAppLabels] Error:', error);
        throw error;
      }

      return data as WhatsAppConversationLabel[];
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // =========================================
  // Mutation: Criar label
  // =========================================
  const createLabelMutation = useMutation({
    mutationFn: async (
      data: Omit<WhatsAppConversationLabelInsert, 'user_id'>
    ): Promise<WhatsAppConversationLabel> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: label, error } = await supabase
        .from('whatsapp_conversation_labels')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return label as WhatsAppConversationLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_LABELS_KEY] });
      toast({ title: 'Label criada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Atualizar label
  // =========================================
  const updateLabelMutation = useMutation({
    mutationFn: async ({
      labelId,
      updates,
    }: {
      labelId: string;
      updates: Partial<WhatsAppConversationLabelInsert>;
    }): Promise<WhatsAppConversationLabel> => {
      const { data, error } = await supabase
        .from('whatsapp_conversation_labels')
        .update(updates)
        .eq('id', labelId)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConversationLabel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_LABELS_KEY] });
      toast({ title: 'Label atualizada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Deletar label
  // =========================================
  const deleteLabelMutation = useMutation({
    mutationFn: async (labelId: string): Promise<void> => {
      const { error } = await supabase
        .from('whatsapp_conversation_labels')
        .delete()
        .eq('id', labelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_LABELS_KEY] });
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATION_LABELS_KEY] });
      toast({ title: 'Label removida' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Atribuir label a conversa
  // =========================================
  const assignLabelMutation = useMutation({
    mutationFn: async ({
      conversationId,
      labelId,
    }: {
      conversationId: string;
      labelId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('whatsapp_conversation_label_assignments')
        .insert({
          conversation_id: conversationId,
          label_id: labelId,
        });

      if (error) {
        // Ignorar erro de duplicata
        if (error.code !== '23505') throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATION_LABELS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atribuir label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Remover label de conversa
  // =========================================
  const unassignLabelMutation = useMutation({
    mutationFn: async ({
      conversationId,
      labelId,
    }: {
      conversationId: string;
      labelId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('whatsapp_conversation_label_assignments')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('label_id', labelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATION_LABELS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    labels: labelsQuery.data || [],
    isLoading: labelsQuery.isLoading,
    error: labelsQuery.error,

    createLabel: createLabelMutation.mutateAsync,
    isCreating: createLabelMutation.isPending,

    updateLabel: updateLabelMutation.mutateAsync,
    isUpdating: updateLabelMutation.isPending,

    deleteLabel: deleteLabelMutation.mutateAsync,
    isDeleting: deleteLabelMutation.isPending,

    assignLabel: assignLabelMutation.mutateAsync,
    isAssigning: assignLabelMutation.isPending,

    unassignLabel: unassignLabelMutation.mutateAsync,
    isUnassigning: unassignLabelMutation.isPending,

    refetch: labelsQuery.refetch,
  };
}

/**
 * Hook para gerenciar labels de uma conversa específica
 */
export function useConversationLabels(conversationId: string, enabled = true) {
  const queryClient = useQueryClient();
  const { assignLabel, unassignLabel, isAssigning, isUnassigning } = useWhatsAppLabels();

  const labelsQuery = useQuery({
    queryKey: [WHATSAPP_CONVERSATION_LABELS_KEY, conversationId],
    queryFn: async (): Promise<WhatsAppConversationLabel[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('whatsapp_conversation_label_assignments')
        .select(`
          label:whatsapp_conversation_labels(*)
        `)
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('[useConversationLabels] Error:', error);
        throw error;
      }

      return data.map(d => d.label).filter(Boolean) as WhatsAppConversationLabel[];
    },
    enabled: enabled && !!conversationId,
    staleTime: 30 * 1000,
  });

  const toggleLabel = async (labelId: string, isAssigned: boolean) => {
    if (isAssigned) {
      await unassignLabel({ conversationId, labelId });
    } else {
      await assignLabel({ conversationId, labelId });
    }
    queryClient.invalidateQueries({ queryKey: [WHATSAPP_CONVERSATION_LABELS_KEY, conversationId] });
  };

  return {
    conversationLabels: labelsQuery.data || [],
    isLoading: labelsQuery.isLoading,
    toggleLabel,
    isToggling: isAssigning || isUnassigning,
    refetch: labelsQuery.refetch,
  };
}
