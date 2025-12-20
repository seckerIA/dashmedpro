import React, { useEffect } from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskData, UpdateTaskData } from '@/types/tasks';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckSquare } from 'lucide-react';

const Tasks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    tasks,
    teamMembers,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    updateAssignment,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
    isUpdatingAssignment,
  } = useTasks();

  // Log de debug para verificar estado
  useEffect(() => {
    console.log('[Tasks] Componente montado');
    console.log('[Tasks] User:', user);
    console.log('[Tasks] Tasks:', tasks);
    console.log('[Tasks] Team Members:', teamMembers);
    console.log('[Tasks] IsLoading:', isLoading);
  }, [user, tasks, teamMembers, isLoading]);

  const handleTaskCreate = async (data: CreateTaskData) => {
    try {
      console.log('[Tasks] Iniciando criação de tarefa:', data);
      
      if (!user?.id) {
        console.error('[Tasks] Erro: Usuário não autenticado');
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para criar tarefas.",
        });
        return;
      }
      
      await createTask(data);
      console.log('[Tasks] Tarefa criada com sucesso');
      
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso!",
      });
    } catch (error) {
      console.error('[Tasks] Erro ao criar tarefa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar tarefa",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a tarefa. Tente novamente.",
      });
      // Re-throw para que o componente TaskList possa tratar
      throw error;
    }
  };

  const handleTaskUpdate = async (taskId: string, data: UpdateTaskData) => {
    try {
      await updateTask({ taskId, data });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar tarefa",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a tarefa. Tente novamente.",
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "Tarefa removida",
        description: "A tarefa foi removida com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover tarefa",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao remover a tarefa. Tente novamente.",
      });
    }
  };

  const handleTaskReorder = async (taskIds: string[]) => {
    try {
      await reorderTasks(taskIds);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reordenar tarefas",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao reordenar as tarefas. Tente novamente.",
      });
    }
  };

  const handleAssignmentToggle = async (assignmentId: string) => {
    try {
      // Buscar a atribuição atual para determinar o novo status
      const task = tasks.find(t => t.assignments?.some(a => a.id === assignmentId));
      const assignment = task?.assignments?.find(a => a.id === assignmentId);
      
      if (!assignment) {
        throw new Error('Atribuição não encontrada');
      }
      
      const newStatus = assignment.status === 'pendente' ? 'concluida' : 'pendente';
      
      await updateAssignment({ assignmentId, data: { status: newStatus } });
      
      toast({
        title: "Status atualizado",
        description: `A tarefa foi marcada como ${newStatus === 'concluida' ? 'concluída' : 'pendente'}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o status da tarefa. Tente novamente.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Você precisa estar autenticado para acessar as tarefas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 backdrop-blur-sm border border-primary/20">
              <CheckSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Tarefas</h1>
              <p className="text-muted-foreground text-sm font-medium">
                Gerencie suas tarefas e atividades
              </p>
            </div>
          </div>
        </div>
      </div>

      <TaskList
        tasks={tasks}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onTaskReorder={handleTaskReorder}
        onAssignmentToggle={handleAssignmentToggle}
        isLoading={isLoading || isCreating || isUpdating || isDeleting || isReordering || isUpdatingAssignment}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default Tasks;
