import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    Target,
    User,
    Building2,
    AlertCircle,
    Paperclip,
    Edit,
    CheckCircle2,
    X
} from "lucide-react";
import { TaskWithCRM, TASK_PRIORITIES, TASK_STATUSES } from '@/types/tasks';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskAttachments } from './TaskAttachments';

interface TaskViewModalProps {
    task: TaskWithCRM | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (task: TaskWithCRM) => void;
}

export function TaskViewModal({ task, isOpen, onClose, onEdit }: TaskViewModalProps) {
    if (!task) return null;

    const priorityConfig = TASK_PRIORITIES.find(p => p.value === task.priority);
    const statusConfig = TASK_STATUSES.find(s => s.value === task.status);

    const formatDueDate = (dateString: string | null) => {
        if (!dateString) return "Sem data definida";
        return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    };

    const getAssignmentsText = () => {
        if (!task.assignments || task.assignments.length === 0) return "Sem atribuição";
        // We might need to fetch user names if not populated, but assuming they might be available or we show count
        // The task object from useTasks might not have full profile data for assignments unless joined.
        // Let's rely on what's available or just show count/IDs for now if names aren't hydrated.
        // Note: In TaskForm we select users. In TaskView we want to show them.
        // If 'assignments' contains explicit profiles, we list them.
        // For now, let's just list the "assigned_to" if single, or count if multiple,
        // or ideally list names if we have the profiles.
        // The TaskWithCRM type has `assignments: TaskAssignment[]`. TaskAssignment has `user_id`.
        // It seems we might not have the profile names readily available in `assignments` array without a join.
        // However, `task.assigned_to` generally points to one user.
        return `${task.assignments.length} pessoa${task.assignments.length !== 1 ? 's' : ''}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-start justify-between mr-8">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
                                {task.status === 'concluida' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                                {task.title}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Priority Badge */}
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs font-semibold px-2 py-0.5", priorityConfig?.color)}
                                >
                                    {priorityConfig?.label}
                                </Badge>

                                {/* Category Badge */}
                                {task.category && (
                                    <Badge variant="outline" className="text-xs font-semibold bg-primary/5 text-primary border-primary/20">
                                        {task.category}
                                    </Badge>
                                )}

                                {/* Status Badge */}
                                <Badge variant="secondary" className="text-xs font-semibold">
                                    {statusConfig?.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Descrição</h4>
                        <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
                            {task.description || <span className="text-muted-foreground italic">Sem descrição.</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Data de Vencimento
                            </h4>
                            <p className="text-sm font-medium">{formatDueDate(task.due_date)}</p>
                        </div>

                        {/* Assignments */}
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <User className="h-3 w-3" /> Atribuído para
                            </h4>
                            <p className="text-sm font-medium">{getAssignmentsText()}</p>
                        </div>
                    </div>

                    {/* CRM Context */}
                    {(task.deal || task.contact) && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2">Contexto CRM</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {task.deal && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Negócio</p>
                                            <p className="text-sm font-semibold text-foreground truncate max-w-[150px]" title={task.deal.title}>
                                                {task.deal.title}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {task.contact && (
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                                            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contato</p>
                                            <p className="text-sm font-semibold text-foreground truncate max-w-[150px]" title={task.contact.full_name || task.contact.email}>
                                                {task.contact.full_name || task.contact.email}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-2 flex items-center gap-2">
                            <Paperclip className="h-4 w-4" /> Anexos
                        </h4>
                        <div className="bg-background rounded-lg">
                            <TaskAttachments
                                taskId={task.id}
                                isEditing={false} // View-only mode for attachments usually implies download, not upload/delete, unless owner
                            // Actually TaskAttachments component handles delete permissions via RLS internally or UI checks. 
                            // Since this is a "View Mode", maybe we want to allow adding files? 
                            // The user said "read-only view... edit button". 
                            // So probably purely read-only (download only).
                            // Let's pass isEditing={false} which usually hides the upload button.
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                    <Button onClick={() => onEdit(task)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Editar Tarefa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
