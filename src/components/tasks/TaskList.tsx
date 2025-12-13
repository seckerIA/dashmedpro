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
import { TaskWithProfile, CreateTaskData, UpdateTaskData, TaskPriority } from '@/types/tasks';
import { Plus, Calendar, CheckCircle2, AlertCircle, Sparkles, Star, Zap, Target, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface TaskListProps {
  tasks: TaskWithProfile[];
  onTaskCreate: (data: CreateTaskData) => Promise<void>;
  onTaskUpdate: (taskId: string, data: UpdateTaskData) => Promise<void>;
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
  const [selectedTask, setSelectedTask] = useState<TaskWithProfile | null>(null);
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
      await onTaskCreate(data);
      console.log('[TaskList] Tarefa criada com sucesso');
      setIsCreating(false);
    } catch (error) {
      console.error('[TaskList] Erro ao criar tarefa:', error);
      throw error;
    }
  };

  const handleTaskUpdate = async (data: UpdateTaskData) => {
    if (selectedTask) {
      await onTaskUpdate(selectedTask.id, data);
      setSelectedTask(null);
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

  const handleEditTask = (task: TaskWithProfile) => {
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
      {/* Header melhorado */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <h2 className="text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="relative">
              <Calendar className="h-10 w-10 text-primary" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              <Star className="h-4 w-4 text-amber-500 absolute -bottom-1 -left-1 animate-pulse" />
            </div>
            <span className="font-bold">
              Tarefas
            </span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg font-medium">
            {pendingTasks.length} pendentes • {completedTasks.length} concluídas
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Filtro Todas/Minhas tarefas */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <Select value={filter} onValueChange={(value: 'all' | 'my_tasks') => setFilter(value)}>
              <SelectTrigger className="w-48 bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                <SelectValue placeholder="Filtrar tarefas" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                <SelectItem value="all" className="hover:bg-accent">
                  Todas as tarefas
                </SelectItem>
                <SelectItem value="my_tasks" className="hover:bg-accent">
                  Minhas tarefas
                </SelectItem>
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
                  "transition-all font-semibold",
                  selectedPriorities.includes('alta') 
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                    : "hover:bg-red-100 hover:text-red-700 border-red-300 text-red-700"
                )}
              >
                Alta
              </Button>
              <Button
                variant={selectedPriorities.includes('media') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityToggle('media')}
                className={cn(
                  "transition-all font-semibold",
                  selectedPriorities.includes('media')
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
                    : "hover:bg-yellow-100 hover:text-yellow-700 border-yellow-300 text-yellow-700"
                )}
              >
                Média
              </Button>
              <Button
                variant={selectedPriorities.includes('baixa') ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityToggle('baixa')}
                className={cn(
                  "transition-all font-semibold",
                  selectedPriorities.includes('baixa')
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                    : "hover:bg-green-100 hover:text-green-700 border-green-300 text-green-700"
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
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold text-lg px-6 py-3"
          >
            <Zap className="h-5 w-5" />
            {isLoading ? 'Carregando...' : 'Nova Tarefa'}
          </Button>
        </div>
      </div>

      {/* Tarefas Pendentes */}
      <Card className="relative bg-gradient-to-br from-card/80 via-card/50 to-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="pb-4 pt-8 px-8 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="relative">
                <AlertCircle className="h-7 w-7 text-primary" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="font-bold">
                Tarefas Pendentes
              </span>
            </CardTitle>
            <Badge className="bg-primary/10 border-primary/20 text-primary font-bold px-4 py-2 text-sm shadow-lg backdrop-blur-sm">
              <Target className="h-4 w-4 mr-1" />
              {pendingTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 relative z-10">
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
            <div className="text-center py-16">
              <div className="relative inline-block">
                <Calendar className="h-20 w-20 mx-auto mb-6 text-primary animate-bounce" />
                <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-3 -right-3 animate-pulse" />
                <Star className="h-6 w-6 text-amber-500 absolute -bottom-2 -left-2 animate-ping" />
              </div>
              <p className="font-bold text-2xl mb-3 text-foreground">
                Nenhuma tarefa pendente
              </p>
              <p className="text-base font-medium mb-8 text-muted-foreground">Crie sua primeira tarefa para começar!</p>
              <Button
                onClick={handleNewTaskClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold text-lg px-8 py-4"
              >
                <Zap className="h-5 w-5 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas Concluídas */}
      {completedTasks.length > 0 && (
        <Card className="relative bg-gradient-to-br from-card/80 via-card/50 to-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600/60 via-green-600 to-green-600/60" />
          <CardHeader className="pb-4 pt-8 px-8 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <div className="relative">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                  <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span className="font-bold">
                  Tarefas Concluídas
                </span>
              </CardTitle>
              <Badge className="bg-green-600/10 border-green-600/20 text-green-600 font-bold px-4 py-2 text-sm shadow-lg backdrop-blur-sm">
                <Target className="h-4 w-4 mr-1" />
                {completedTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 relative z-10">
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

    </div>
  );
}