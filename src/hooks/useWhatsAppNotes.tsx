/**
 * Hook para gerenciar notas internas das conversas do WhatsApp
 * @module hooks/useWhatsAppNotes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type { WhatsAppInternalNote, WhatsAppInternalNoteInsert } from '@/types/whatsapp';

// Query keys
export const WHATSAPP_NOTES_KEY = 'whatsapp-notes';

interface UseWhatsAppNotesOptions {
  conversationId: string;
  enabled?: boolean;
}

export function useWhatsAppNotes(options: UseWhatsAppNotesOptions) {
  const { conversationId, enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // =========================================
  // Query: Lista de notas
  // =========================================
  const notesQuery = useQuery({
    queryKey: [WHATSAPP_NOTES_KEY, conversationId],
    queryFn: async ({ signal }): Promise<WhatsAppInternalNote[]> => {
      if (!conversationId) return [];
      if (signal?.aborted) return [];

      const { data, error} = await supabase
        .from('whatsapp_internal_notes')
        .select('*')
        .eq('conversation_id', conversationId)
        .abortSignal(signal)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('[useWhatsAppNotes] Error:', error);
        throw error;
      }

      return data as WhatsAppInternalNote[];
    },
    enabled: enabled && !!conversationId,
    staleTime: 30 * 1000,
    refetchOnMount: false,
  });

  // =========================================
  // Mutation: Criar nota
  // =========================================
  const createNoteMutation = useMutation({
    mutationFn: async (content: string): Promise<WhatsAppInternalNote> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_internal_notes')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as WhatsAppInternalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_NOTES_KEY, conversationId] });
      toast({
        title: 'Nota adicionada',
        description: 'A nota interna foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar nota',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Atualizar nota
  // =========================================
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      content,
    }: {
      noteId: string;
      content: string;
    }): Promise<WhatsAppInternalNote> => {
      const { data, error } = await supabase
        .from('whatsapp_internal_notes')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppInternalNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_NOTES_KEY, conversationId] });
      toast({ title: 'Nota atualizada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar nota',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =========================================
  // Mutation: Deletar nota
  // =========================================
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string): Promise<void> => {
      const { error } = await supabase
        .from('whatsapp_internal_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WHATSAPP_NOTES_KEY, conversationId] });
      toast({ title: 'Nota removida' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover nota',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,

    createNote: createNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,

    updateNote: updateNoteMutation.mutateAsync,
    isUpdating: updateNoteMutation.isPending,

    deleteNote: deleteNoteMutation.mutateAsync,
    isDeleting: deleteNoteMutation.isPending,

    refetch: notesQuery.refetch,
  };
}
