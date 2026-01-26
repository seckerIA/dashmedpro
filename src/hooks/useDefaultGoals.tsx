import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserDailyGoals, UserDailyGoalsInsert, UserDailyGoalsUpdate } from '@/types/prospecting';
import { useToast } from './use-toast';

export function useDefaultGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: defaultGoals, isLoading } = useQuery({
    queryKey: ['user-default-goals', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return null;
      if (signal?.aborted) return null;
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchOnMount: false,
  });

  const saveDefaultGoals = useMutation({
    mutationFn: async (data: { goalCalls: number; goalContacts: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const upsertData: UserDailyGoalsInsert = {
        user_id: user.id,
        default_goal_calls: data.goalCalls,
        default_goal_contacts: data.goalContacts,
      };
      const { data: saved, error } = await supabase
        .from('user_daily_goals')
        .upsert(upsertData, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-default-goals'] });
      toast({
        title: 'Metas padrão salvas!',
        description: 'As novas metas serão usadas na próxima vez que iniciar um expediente.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar metas',
        description: error.message,
      });
    },
  });

  const getDefaultValues = () => ({
    goalCalls: defaultGoals?.default_goal_calls || 20,
    goalContacts: defaultGoals?.default_goal_contacts || 5,
  });

  return {
    defaultGoals,
    isLoading,
    saveDefaultGoals: saveDefaultGoals.mutateAsync,
    isSaving: saveDefaultGoals.isPending,
    getDefaultValues,
  };
}

