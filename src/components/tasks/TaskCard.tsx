import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  Edit,
  Trash2,
  GripVertical,
  Target,
  Building2,
  Users
} from 'lucide-react';
import { TaskWithProfile, TaskWithCRM, TASK_PRIORITIES, TASK_STATUSES, TASK_CATEGORIES } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTaskCategories } from '@/hooks/useTaskCategories';
import { TaskAttachmentsBadge } from './TaskAttachments';

interface TaskCardProps {
  task: TaskWithCRM;
  onEdit: (task: TaskWithCRM) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleAssignmentComplete?: (assignmentId: string) => void;
  onClick?: () => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggleComplete, onToggleAssignmentComplete, onClick }: TaskCardProps) {
  const { user } = useAuth();
  const { categories } = useTaskCategories();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = TASK_PRIORITIES.find(p => p.value === task.priority);
  const statusConfig = TASK_STATUSES.find(s => s.value === task.status);

  // Buscar configuração da categoria - primeiro no banco, depois nas padrão
  const dynamicCategory = categories.find(cat => cat.name === task.category);
  const staticCategory = TASK_CATEGORIES.find(cat => cat.value === task.category);

  // Label e cor para exibição (prioridade: banco > padrão > fallback)
  const categoryLabel = dynamicCategory?.name || staticCategory?.label || (task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1).replace(/_/g, ' ') : null);
  const categoryColor = dynamicCategory?.color || staticCategory?.color || 'text-gray-600';

  // Lógica para determinar se deve mostrar "Criada por"
  const isCreatedByOther = task.created_by && task.created_by !== user?.id;
  const isCreatedByCurrentUser = task.created_by === user?.id;

  // Determinar status da tarefa para o usuário atual
  const currentUserStatus = task.my_assignment?.status || task.status;
  const isCompleted = currentUserStatus === 'concluida';

  // Verificar se o usuário atual é o criador da tarefa
  const isCreator = task.created_by === user?.id;

  // Função para formatar o texto "Criada por"
  const getCreatedByText = () => {
    if (!task.created_by_profile) return null;

    if (isCreatedByCurrentUser) {
      return "Criada por mim";
    }

    if (isCreatedByOther) {
      const name = task.created_by_profile.full_name;
      return name ? `Criada por ${name}` : `Criada por ${task.created_by_profile.email || 'Usuário'}`;
    }

    return null;
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar se a tarefa está atrasada
  const isOverdue = task.due_date &&
    currentUserStatus === 'pendente' &&
    new Date(task.due_date) < new Date();

  // Função para lidar com toggle de conclusão
  const handleToggleComplete = () => {
    if (task.my_assignment && onToggleAssignmentComplete) {
      // Se tem atribuição individual, usar função específica
      onToggleAssignmentComplete(task.my_assignment.id);
    } else {
      // Senão, usar função padrão
      onToggleComplete(task.id);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Prevent click when interacting with controls
        if (
          (e.target as HTMLElement).closest('button') ||
          (e.target as HTMLElement).closest('[role="checkbox"]') ||
          (e.target as HTMLElement).closest('[data-no-card-click="true"]')
        ) {
          return;
        }
        onClick?.();
      }}
      className={cn(
        "border border-border shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md cursor-pointer group",
        isDragging && "opacity-50 scale-105 border-primary",
        isCompleted && "opacity-60",
        isOverdue && "border-red-500 bg-red-500/5"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center p-1 rounded-lg hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
            data-no-card-click="true"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
          />

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Categoria Badge */}
            {categoryLabel && (
              <Badge variant="outline" className={cn("mb-2 text-xs", categoryColor)}>
                {categoryLabel}
              </Badge>
            )}

            {/* Badge de Anexos */}
            <TaskAttachmentsBadge taskId={task.id} />

            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={cn(
                "font-semibold text-foreground text-sm leading-tight",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>

              <div className="flex items-center gap-2">
                {/* Overdue Badge */}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs px-2 py-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Atrasado
                  </Badge>
                )}

                {/* Priority Badge */}
                {task.priority && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-1",
                      priorityConfig?.color
                    )}
                  >
                    {priorityConfig?.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className={cn(
                "text-sm text-muted-foreground mb-3 line-clamp-2",
                isCompleted && "line-through"
              )}>
                {task.description}
              </p>
            )}

            {/* CRM Information */}
            {(task.deal || task.contact) && (
              <div className="mb-3 space-y-2">
                {/* Deal Information */}
                {task.deal && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Target className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {task.deal.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {task.deal.stage}
                        </Badge>
                        {task.deal.value && (
                          <span>
                            R$ {task.deal.value.toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {task.contact && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {task.contact?.full_name || task.contact?.email || 'Sem contato'}
                      </p>
                      {task.contact.company && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Task Meta Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              {/* Left side - Due Date, Assigned To, Status */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className={cn(
                      task.due_date && new Date(task.due_date) < new Date() && task.status === 'pendente' && "text-red-500 font-medium"
                    )}>
                      {formatDueDate(task.due_date)}
                    </span>
                  </div>
                )}

                {/* Assigned To - Mostrar apenas para o criador */}
                {isCreator && task.assignments && task.assignments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{task.assignments.length} pessoa{task.assignments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Status individual */}
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    currentUserStatus === 'pendente' ? "bg-orange-500" : "bg-green-500"
                  )} />
                  <span>{TASK_STATUSES.find(s => s.value === currentUserStatus)?.label}</span>
                </div>
              </div>

              {/* Right side - Created By */}
              {getCreatedByText() && (
                <div className="text-xs text-muted-foreground/70 italic">
                  {getCreatedByText()}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
