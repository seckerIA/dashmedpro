import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { FollowUp, CreateFollowUpData, UpdateFollowUpData } from '@/types/followUp';
import { useAuth } from './useAuth';

// Buscar follow-ups do usuário
const fetchFollowUps = async (userId: string, viewAsUserIds?: string[], signal?: AbortSignal): Promise<FollowUp[]> => {
  let queryPromise = supabase
    .from('crm_follow_ups')
    .select('*');

  if (viewAsUserIds && viewAsUserIds.length > 0) {
    queryPromise = (queryPromise as any).in('user_id', viewAsUserIds);
  } else {
    queryPromise = (queryPromise as any).eq('user_id', userId);
  }

  queryPromise = (queryPromise as any).order('scheduled_date', { ascending: true });

  const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

  if (error) throw error;
  return (data || []) as FollowUp[];
};

// Criar follow-up
const createFollowUp = async (data: CreateFollowUpData & { user_id: string; type: string }): Promise<FollowUp> => {
  const { data: followUp, error } = await supabase
    .from('crm_follow_ups')
    .insert({
      ...data,
      completed: false // Default new to false
    })
    .select()
    .single();

  if (error) throw error;
  return followUp as FollowUp;
};

// Atualizar follow-up
const updateFollowUp = async ({
  id,
  data
}: {
  id: string;
  data: UpdateFollowUpData
}): Promise<FollowUp> => {
  const updateData: any = { ...data };

  // Se está marcando como concluído, adicionar timestamp
  if (data.completed === true) {
    updateData.completed_at = new Date().toISOString();
  } else if (data.completed === false) {
    updateData.completed_at = null;
  }

  const { data: followUp, error } = await supabase
    .from('crm_follow_ups')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return followUp as FollowUp;
};

// Deletar follow-up
const deleteFollowUp = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('crm_follow_ups')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export function useFollowUps(viewAsUserIds?: string[]) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar follow-ups
  const { data: followUps = [], isLoading, error } = useQuery({
    queryKey: ['followUps', user?.id, viewAsUserIds?.join(',')],
    queryFn: async ({ signal }) => {
      if (!user?.id) {
        return [];
      }
      try {
        return await fetchFollowUps(user.id, viewAsUserIds, signal);
      } catch (error) {
        console.error('❌ useFollowUps - Erro ao buscar follow-ups:', error);
        return [];
      }
    },
    enabled: !!user?.id && !authLoading, // Aguardar auth terminar de carregar
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Mutation para criar follow-up
  const createMutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  // Mutation para atualizar follow-up
  const updateMutation = useMutation({
    mutationFn: updateFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  // Mutation para deletar follow-up
  const deleteMutation = useMutation({
    mutationFn: deleteFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
    },
  });

  return {
    followUps,
    isLoading,
    error,
    createFollowUp: createMutation.mutateAsync,
    updateFollowUp: updateMutation.mutateAsync,
    deleteFollowUp: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
