import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskViewModal } from './TaskViewModal';
import { TaskWithProfile, TaskWithCRM, CreateTaskData, UpdateTaskData, TaskPriority } from '@/types/tasks';
import { CheckCircle2, AlertCircle, Zap, Target, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface TaskListProps {
  tasks: TaskWithCRM[];
  onTaskCreate: (data: CreateTaskData) => Promise<any>;
  onTaskUpdate: (taskId: string, data: UpdateTaskData) => Promise<any>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskReorder: (taskIds: string[]) => Promise<void>;
  onAssignmentToggle?: (assignmentId: string) => Promise<void>;
  isLoading?: boolean;
  teamMembers?: Array<{
    id: string;
    full_name: string | null;
    email: string;
  }>;
}

export function TaskList({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskReorder,
  onAssignmentToggle,
  isLoading = false,
  teamMembers = [],
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithCRM | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskWithCRM | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my_tasks'>('all');
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over?.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const newTaskIds = newTasks.map((task) => task.id);

      await onTaskReorder(newTaskIds);
    }
  };

  const handleTaskCreate = async (data: CreateTaskData) => {
    try {
      console.log('[TaskList] Iniciando criação de tarefa:', data);
      // Retornamos a tarefa criada para que o TaskForm possa usar o ID para uploads
      // Não fechamos o modal aqui (setIsCreating(false)) para permitir que o TaskForm termine os uploads
      return await onTaskCreate(data);
    } catch (error) {
      console.error('[TaskList] Erro ao criar tarefa:', error);
      throw error;
    }
  };

  const handleTaskUpdate = async (data: UpdateTaskData) => {
    if (selectedTask) {
      // Mesma lógica: retornamos e não fechamos o modal aqui
      return await onTaskUpdate(selectedTask.id, data);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    await onTaskDelete(taskId);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleTaskToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newStatus = task.status === 'pendente' ? 'concluida' : 'pendente';
      await onTaskUpdate(taskId, { status: newStatus });
    }
  };

  const handleEditTask = (task: TaskWithCRM) => {
    setViewingTask(null); // Close view modal if open
    setSelectedTask(task);
    setIsCreating(false);
  };

  const handleCancelForm = () => {
    console.log('[TaskList] Cancelando formulário');
    setSelectedTask(null);
    setIsCreating(false);
  };

  const handleNewTaskClick = () => {
    console.log('[TaskList] Botão Nova Tarefa clicado');
    console.log('[TaskList] Estado atual - isCreating:', isCreating);
    console.log('[TaskList] Estado atual - selectedTask:', selectedTask);
    console.log('[TaskList] Tasks disponíveis:', tasks.length);
    console.log('[TaskList] Team members disponíveis:', teamMembers.length);
    setIsCreating(true);
    console.log('[TaskList] Estado isCreating alterado para true');
  };

  const handleTaskClick = (task: TaskWithCRM) => {
    setViewingTask(task);
  };

  const handleCloseView = () => {
    setViewingTask(null);
  };

  const handlePriorityToggle = (priority: TaskPriority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  // Filtrar tarefas baseado no filtro selecionado
  const filteredTasks = tasks.filter(task => {
    // Filtro de "Minhas tarefas" vs "Todas"
    if (filter === 'my_tasks') {
      // Mostrar apenas tarefas criadas pelo usuário ou atribuídas a ele
      const isMyTask = task.created_by === user?.id ||
        task.assigned_to === user?.id ||
        task.my_assignment !== null ||
        task.assignments?.some(a => a.user_id === user?.id);
      if (!isMyTask) return false;
    }

    // Filtro de prioridade
    if (selectedPriorities.length > 0) {
      return selectedPriorities.includes(task.priority as TaskPriority);
    }

    return true;
  });

  const pendingTasks = filteredTasks.filter(task => {
    // Para tarefas com atribuição individual, usar o status da atribuição
    const taskStatus = task.my_assignment?.status || task.status;
    return taskStatus === 'pendente';
  });

  const completedTasks = filteredTasks.filter(task => {
    // Para tarefas com atribuição individual, usar o status da atribuição
    const taskStatus = task.my_assignment?.status || task.status;
    return taskStatus === 'concluida';
  });

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Filtro Todas/Minhas tarefas */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: 'all' | 'my_tasks') => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar tarefas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tarefas</SelectItem>
                <SelectItem value="my_tasks">Minhas tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Prioridades */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Prioridade:</span>
            <div className="flex gap-2">
              <Button
                variant={selectedPriorities.includes('alta') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityToggle('alta')}
                className={cn(
                  selectedPriorities.includes('alta') && "bg-red-600 hover:bg-red-700"
                )}
              >
                Alta
              </Button>
              <Button
                variant={selectedPriorities.includes('media') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityToggle('media')}
                className={cn(
                  selectedPriorities.includes('media') && "bg-yellow-600 hover:bg-yellow-700"
                )}
              >
                Média
              </Button>
              <Button
                variant={selectedPriorities.includes('baixa') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityToggle('baixa')}
                className={cn(
                  selectedPriorities.includes('baixa') && "bg-green-600 hover:bg-green-700"
                )}
              >
                Baixa
              </Button>
            </div>
          </div>

          {/* Botão Nova Tarefa */}
          <Button
            onClick={handleNewTaskClick}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isLoading ? 'Carregando...' : 'Nova Tarefa'}
          </Button>
        </div>
      </div>

      {/* Tarefas Pendentes */}
      <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span>Tarefas Pendentes</span>
            </CardTitle>
            <Badge variant="secondary" className="font-semibold">
              {pendingTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingTasks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pendingTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {pendingTasks.map((task, index) => (
                    <div
                      key={task.id}
                      style={{
                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                      }}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onEdit={handleEditTask}
                        onDelete={handleTaskDelete}
                        onToggleComplete={handleTaskToggleComplete}
                        onToggleAssignmentComplete={onAssignmentToggle}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <AlertCircle className="h-16 w-16 mb-6 text-muted-foreground" />
              <p className="font-semibold text-xl mb-2 text-foreground">
                Nenhuma tarefa pendente
              </p>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Crie sua primeira tarefa para começar!
              </p>
              <Button
                onClick={handleNewTaskClick}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Criar Primeira Tarefa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas Concluídas */}
      {completedTasks.length > 0 && (
        <Card className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Tarefas Concluídas</span>
              </CardTitle>
              <Badge variant="secondary" className="font-semibold">
                {completedTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <TaskCard
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onEdit={handleEditTask}
                    onDelete={handleTaskDelete}
                    onToggleComplete={handleTaskToggleComplete}
                    onToggleAssignmentComplete={onAssignmentToggle}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Criação/Edição */}
      {(isCreating || selectedTask) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Fecha o modal ao clicar fora dele
            if (e.target === e.currentTarget) {
              console.log('[TaskList] Clique fora do modal detectado');
              handleCancelForm();
            }
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TaskForm
              task={selectedTask}
              onSave={selectedTask ? handleTaskUpdate : handleTaskCreate}
              onCancel={handleCancelForm}
              isLoading={isLoading}
              teamMembers={teamMembers}
            />
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      <TaskViewModal
        task={viewingTask}
        isOpen={!!viewingTask}
        onClose={handleCloseView}
        onEdit={handleEditTask}
      />

    </div>
  );
}