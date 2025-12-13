import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskWithProfile, TaskWithCRM, CreateTaskData, UpdateTaskData, TaskAssignment, UpdateAssignmentData } from '@/types/tasks';
import { useAuth } from './useAuth';

// Função para buscar tarefas do usuário com múltiplas atribuições
const fetchTasks = async (userId: string): Promise<TaskWithCRM[]> => {
  // Buscar tarefas usando a função SQL criada
  const { data, error } = await supabase
    .rpc('get_tasks_with_assignments', { user_id_param: userId });

  if (error) {
    throw new Error(`Erro ao buscar tarefas: ${error.message}`);
  }

  if (!data) return [];

  // Agrupar dados por tarefa
  const tasksMap = new Map<string, TaskWithCRM>();
  
  data.forEach((row: any) => {
    const taskId = row.task_id;
    
    if (!tasksMap.has(taskId)) {
      // Criar objeto da tarefa
      const task: TaskWithCRM = {
        id: row.task_id,
        title: row.title,
        description: row.description,
        due_date: row.due_date,
        priority: row.priority,
        status: row.status,
        category: row.category,
        created_by: row.created_by,
        user_id: row.user_id,
        assigned_to: row.assigned_to,
        deal_id: row.deal_id,
        contact_id: row.contact_id,
        position: row.position,
        created_at: row.created_at,
        updated_at: row.updated_at,
        image_url: row.image_url || null,
        created_by_profile: {
          id: row.created_by,
          full_name: row.created_by_name,
          email: row.created_by_email,
        },
        assignments: [],
        my_assignment: null,
      };
      
      tasksMap.set(taskId, task);
    }
    
    const task = tasksMap.get(taskId)!;
    
    // Adicionar atribuição se existir
    if (row.assignment_id) {
      const assignment: TaskAssignment = {
        id: row.assignment_id,
        task_id: row.task_id,
        user_id: row.assigned_user_id,
        assigned_at: row.assigned_at,
        assigned_by: null, // Será preenchido se necessário
        status: row.assignment_status,
        completed_at: row.completed_at,
        created_at: row.assigned_at,
        updated_at: row.assigned_at,
        assigned_user_profile: {
          id: row.assigned_user_id,
          full_name: row.assigned_user_name,
          email: row.assigned_user_email,
        },
      };
      
      task.assignments!.push(assignment);
      
      // Se é a atribuição do usuário atual, salvar como my_assignment
      if (row.assigned_user_id === userId) {
        task.my_assignment = assignment;
      }
    }
  });
  
  // Buscar dados do CRM separadamente
  const taskIds = Array.from(tasksMap.keys());
  if (taskIds.length > 0) {
    const { data: crmData, error: crmError } = await supabase
      .from('tasks')
      .select(`
        id,
        deal:crm_deals(id, title, value, stage),
        contact:crm_contacts(id, full_name, email, company)
      `)
      .in('id', taskIds);
    
    if (!crmError && crmData) {
      crmData.forEach(crmRow => {
        const task = tasksMap.get(crmRow.id);
        if (task) {
          task.deal = crmRow.deal;
          task.contact = crmRow.contact;
        }
      });
    }
  }
  
  return Array.from(tasksMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
};

// Função para buscar membros da equipe
const fetchTeamMembers = async (): Promise<Array<{
  id: string;
  full_name: string | null;
  email: string;
}>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
  }

  return data || [];
};

// Função para criar tarefa com múltiplas atribuições
const createTask = async (data: CreateTaskData & { user_id: string }): Promise<TaskWithCRM> => {
  try {
    console.log('[useTasks] Iniciando criação de tarefa:', data);
    
    // Buscar a próxima posição
    const { data: lastTask, error: positionError } = await supabase
      .from('tasks')
      .select('position')
      .eq('user_id', data.user_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      console.error('[useTasks] Erro ao buscar última posição:', positionError);
    }

    const nextPosition = (lastTask?.position || 0) + 1;
    console.log('[useTasks] Próxima posição:', nextPosition);

    // Preparar dados para inserção da tarefa
    const { assigned_to_users, ...taskInsertData } = data;
    const insertData = {
      ...taskInsertData,
      position: nextPosition,
      created_by: data.user_id,
      status: 'pendente' as const,
      // Manter assigned_to para compatibilidade (primeiro usuário da lista)
      assigned_to: assigned_to_users && assigned_to_users.length > 0 ? assigned_to_users[0] : data.assigned_to,
    };

    console.log('[useTasks] Dados para inserção da tarefa:', insertData);

    // Criar a tarefa
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert(insertData)
      .select('*')
      .single();

    if (taskError) {
      console.error('[useTasks] Erro ao inserir tarefa:', taskError);
      throw new Error(`Erro ao criar tarefa: ${taskError.message}`);
    }

    console.log('[useTasks] Tarefa criada com sucesso:', newTask);

    // Criar atribuições múltiplas se especificadas
    if (assigned_to_users && assigned_to_users.length > 0) {
      const assignments = assigned_to_users.map(userId => ({
        task_id: newTask.id,
        user_id: userId,
        assigned_by: data.user_id,
        status: 'pendente' as const,
      }));

      console.log('[useTasks] Criando atribuições:', assignments);

      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert(assignments as any);

      if (assignmentError) {
        console.error('[useTasks] Erro ao criar atribuições:', assignmentError);
        // Não falhar a criação da tarefa se as atribuições falharem
      }
    }

    // Buscar a tarefa completa com todas as relações
    const completeTask = await fetchTasks(data.user_id);
    const createdTask = completeTask.find(t => t.id === newTask.id);
    
    if (!createdTask) {
      throw new Error('Erro ao buscar tarefa criada');
    }

    return createdTask;
  } catch (error) {
    console.error('[useTasks] Erro inesperado ao criar tarefa:', error);
    throw error;
  }
};

// Função para atualizar tarefa com atribuições
const updateTask = async ({ taskId, data }: { taskId: string; data: UpdateTaskData }): Promise<TaskWithCRM> => {
  const { assigned_to_users, ...taskUpdateData } = data;
  
  // Atualizar a tarefa
  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(taskUpdateData)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar tarefa: ${error.message}`);
  }

  // Se assigned_to_users foi fornecido, atualizar as atribuições
  if (assigned_to_users !== undefined) {
    // Remover todas as atribuições existentes
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId);

    // Criar novas atribuições se houver usuários
    if (assigned_to_users && assigned_to_users.length > 0) {
      const assignments = assigned_to_users.map(userId => ({
        task_id: taskId,
        user_id: userId,
        status: 'pendente' as const,
      }));

      await supabase
        .from('task_assignments')
        .insert(assignments);
    }
  }

  // Buscar a tarefa completa atualizada
  const { data: taskData, error: fetchError } = await supabase
    .rpc('get_tasks_with_assignments', { user_id_param: updatedTask.user_id });

  if (fetchError) {
    throw new Error(`Erro ao buscar tarefa atualizada: ${fetchError.message}`);
  }

  const completeTask = taskData?.find((t: any) => t.task_id === taskId);
  if (!completeTask) {
    throw new Error('Tarefa atualizada não encontrada');
  }

  // Transformar para TaskWithCRM
  const result: TaskWithCRM = {
    id: completeTask.task_id,
    title: completeTask.title,
    description: completeTask.description,
    due_date: completeTask.due_date,
    priority: completeTask.priority,
    status: completeTask.status,
    category: completeTask.category,
    created_by: completeTask.created_by,
    user_id: completeTask.user_id,
    assigned_to: completeTask.assigned_user_id || null,
    deal_id: completeTask.deal_id || null,
    contact_id: completeTask.contact_id || null,
    position: completeTask.position,
    created_at: completeTask.created_at,
    updated_at: completeTask.updated_at,
    image_url: completeTask.image_url || null,
    assignments: [],
  };

  return result;
};

// Função para deletar tarefa
const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    throw new Error(`Erro ao deletar tarefa: ${error.message}`);
  }
};

// Função para reordenar tarefas
const reorderTasks = async (taskIds: string[]): Promise<void> => {
  // Atualizar cada tarefa individualmente
  for (let i = 0; i < taskIds.length; i++) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: i + 1 })
      .eq('id', taskIds[i]);

    if (error) {
      throw new Error(`Erro ao reordenar tarefa ${taskIds[i]}: ${error.message}`);
    }
  }
};

// Função para atualizar atribuição individual
const updateAssignment = async ({ assignmentId, data }: { assignmentId: string; data: UpdateAssignmentData }): Promise<TaskAssignment> => {
  const updateData: any = { ...data };
  
  // Se está marcando como concluída, definir completed_at
  if (data.status === 'concluida' && !data.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }
  
  // Se está marcando como pendente, limpar completed_at
  if (data.status === 'pendente') {
    updateData.completed_at = null;
  }

  const { data: updatedAssignment, error } = await supabase
    .from('task_assignments')
    .update(updateData as any)
    .eq('id', assignmentId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar atribuição: ${error.message}`);
  }

  return updatedAssignment as TaskAssignment;
};

// Função para atualizar atribuições de uma tarefa
const updateTaskAssignments = async ({ taskId, userIds }: { taskId: string; userIds: string[] }): Promise<void> => {
  // Primeiro, remover todas as atribuições existentes
  const { error: deleteError } = await supabase
    .from('task_assignments')
    .delete()
    .eq('task_id', taskId);

  if (deleteError) {
    throw new Error(`Erro ao remover atribuições existentes: ${deleteError.message}`);
  }

  // Se não há usuários para atribuir, parar aqui
  if (userIds.length === 0) {
    return;
  }

  // Criar novas atribuições
  const assignments = userIds.map(userId => ({
    task_id: taskId,
    user_id: userId,
    assigned_by: null, // Será preenchido pelo trigger
    status: 'pendente' as const,
  }));

  const { error: insertError } = await supabase
    .from('task_assignments')
    .insert(assignments as any);

  if (insertError) {
    throw new Error(`Erro ao criar novas atribuições: ${insertError.message}`);
  }
};

// Hook para usar tarefas
export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar tarefas
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => fetchTasks(user?.id || ''),
    enabled: !!user?.id,
  });

  // Query para buscar membros da equipe
  const {
    data: teamMembers = [],
    isLoading: isLoadingTeamMembers,
  } = useQuery({
    queryKey: ['team-members'],
    queryFn: fetchTeamMembers,
  });

  // Mutation para criar tarefa
  const createTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskData) => {
      console.log('[useTasks] Iniciando mutation de criação');
      console.log('[useTasks] User ID:', user?.id);
      console.log('[useTasks] Task Data:', taskData);
      
      if (!user?.id) {
        console.error('[useTasks] Erro: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      return createTask({ ...taskData, user_id: user.id });
    },
    onSuccess: (data) => {
      console.log('[useTasks] Tarefa criada com sucesso, invalidando queries:', data);
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['today-tasks', user?.id] });
    },
    onError: (error) => {
      console.error('[useTasks] Erro na mutation de criação:', error);
    },
  });

  // Mutation para atualizar tarefa
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskData }) =>
      updateTask({ taskId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Mutation para deletar tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Mutation para reordenar tarefas
  const reorderTasksMutation = useMutation({
    mutationFn: reorderTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Mutation para atualizar atribuição individual
  const updateAssignmentMutation = useMutation({
    mutationFn: updateAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Mutation para atualizar atribuições de uma tarefa
  const updateTaskAssignmentsMutation = useMutation({
    mutationFn: updateTaskAssignments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  return {
    // Dados
    tasks,
    teamMembers,
    
    // Estados de carregamento
    isLoadingTasks,
    isLoadingTeamMembers,
    isLoading: isLoadingTasks || isLoadingTeamMembers,
    
    // Erros
    tasksError,
    
    // Mutations
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    reorderTasks: reorderTasksMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    updateTaskAssignments: updateTaskAssignmentsMutation.mutateAsync,
    
    // Estados das mutations
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isReordering: reorderTasksMutation.isPending,
    isUpdatingAssignment: updateAssignmentMutation.isPending,
    isUpdatingTaskAssignments: updateTaskAssignmentsMutation.isPending,
  };
}
