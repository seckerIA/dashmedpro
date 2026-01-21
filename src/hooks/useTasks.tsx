import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';
import { TaskWithProfile, TaskWithCRM, CreateTaskData, UpdateTaskData, TaskAssignment, UpdateAssignmentData } from '@/types/tasks';
import { useAuth } from './useAuth';
import { useTeamMembers } from './useTeamMembers';

// Função para buscar tarefas do usuário
const fetchTasks = async (userId: string, signal?: AbortSignal): Promise<TaskWithCRM[]> => {
  // Verificar e garantir sessão válida
  await ensureValidSession();

  const queryPromise = supabase
    .from('tasks' as any)
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = await supabaseQueryWithTimeout<TaskWithCRM[]>(queryPromise as any, 20000, signal);

  if (error) {
    if (!error.message?.includes('AbortError') && (error as any).code !== '20') {
      console.error('Erro ao buscar tarefas:', error);
    }
    throw new Error(`Erro ao buscar tarefas: ${error.message}`);
  }

  return (data || []).map(task => ({
    ...task,
    completed_at: task.completed_at || null,
    assignments: [],
    my_assignment: null,
  })) as TaskWithCRM[];
};

// Função para buscar uma única tarefa
const fetchTaskById = async (taskId: string): Promise<TaskWithCRM | null> => {
  const { data, error } = await supabase
    .from('tasks' as any)
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Erro ao buscar tarefa:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    completed_at: data.completed_at || null,
    assignments: [],
    my_assignment: null,
  } as TaskWithCRM;
};

// Hook principal
export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { teamMembers } = useTeamMembers();

  // Query para buscar todas as tarefas
  const {
    data: tasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: ({ signal }) => fetchTasks(user?.id || '', signal),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return 10 * 60 * 1000; // 10 minutos
    },
    refetchIntervalInBackground: false,
    retry: 2,
    retryDelay: 1000,
  });

  // Mutation para criar tarefa
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data, error } = await supabase
        .from('tasks' as any)
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'media',
          category: taskData.category || null,
          assigned_to: taskData.assigned_to || null,
          deal_id: taskData.deal_id || null,
          contact_id: taskData.contact_id || null,
          image_url: taskData.image_url || null,
          user_id: user?.id,
          created_by: user?.id,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para atualizar tarefa
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      const { data: updated, error } = await supabase
        .from('tasks' as any)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error(`Erro ao atualizar tarefa: ${error.message}`);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para deletar tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks' as any)
        .delete()
        .eq('id', taskId);

      if (error) throw new Error(`Erro ao deletar tarefa: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para completar tarefa
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks' as any)
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error(`Erro ao completar tarefa: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para reabrir tarefa
  const reopenTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks' as any)
        .update({
          status: 'pendente',
          completed_at: null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error(`Erro ao reabrir tarefa: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para reordenar tarefas (placeholder)
  const reorderTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      // Sem coluna position no banco, apenas retorna
      return taskIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation para atualizar assignment
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId: string; data: UpdateAssignmentData }) => {
      // Placeholder - implementar quando tabela task_assignments tiver coluna status
      return { assignmentId, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    teamMembers,
    isLoading,
    error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    reopenTask: reopenTaskMutation.mutateAsync,
    reorderTasks: reorderTasksMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isReordering: reorderTasksMutation.isPending,
    isUpdatingAssignment: updateAssignmentMutation.isPending,
    fetchTaskById,
  };
}
