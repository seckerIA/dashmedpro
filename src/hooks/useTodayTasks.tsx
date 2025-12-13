import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskWithProfile } from '@/types/tasks';
import { useAuth } from './useAuth';

// Função para buscar tarefas do dia atual
const fetchTodayTasks = async (userId: string): Promise<TaskWithProfile[]> => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .or(`user_id.eq.${userId},created_by.eq.${userId},assigned_to.eq.${userId}`)
    .eq('status', 'pendente')
    .gte('due_date', startOfDay.toISOString())
    .lt('due_date', endOfDay.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar tarefas do dia: ${error.message}`);
  }

  return (data || []) as TaskWithProfile[];
};

// Hook para usar tarefas do dia
export function useTodayTasks() {
  const { user } = useAuth();

  const {
    data: todayTasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: () => fetchTodayTasks(user?.id || ''),
    enabled: !!user?.id,
    // Refetch a cada 5 minutos para manter os dados atualizados
    refetchInterval: 5 * 60 * 1000,
  });

  return {
    todayTasks,
    isLoading,
    error,
  };
}
