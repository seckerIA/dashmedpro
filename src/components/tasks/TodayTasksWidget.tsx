import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
  Star,
  Target
} from 'lucide-react';
import { TaskWithProfile, TASK_PRIORITIES } from '@/types/tasks';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function TodayTasksWidget() {
  const { toast } = useToast();
  const { todayTasks, isLoading } = useTodayTasks();
  const { updateTask } = useTasks();

  // Calcular estatísticas
  const completedTasks = todayTasks.filter(t => t.status === 'concluida').length;
  const totalTasks = todayTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const pendingTasks = totalTasks - completedTasks;

  const handleToggleComplete = async (taskId: string) => {
    try {
      await updateTask({ taskId, data: { status: 'concluida' } });
      toast({
        title: "Tarefa concluída",
        description: "Parabéns! Tarefa marcada como concluída.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar tarefa",
        description: "Ocorreu um erro ao marcar a tarefa como concluída.",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityConfig = (priority: string) => {
    return TASK_PRIORITIES.find(p => p.value === priority);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card className="relative bg-gradient-to-br from-emerald-500/15 via-green-400/10 to-teal-500/15 backdrop-blur-xl border border-emerald-500/30 shadow-2xl rounded-3xl overflow-hidden group">
        {/* Magic UI Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-teal-400/5 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
        
        <CardHeader className="pb-4 pt-8 px-8 relative z-10">
          <CardTitle className="text-2xl font-bold text-card-foreground tracking-tight flex items-center gap-3">
            <div className="relative">
              <Calendar className="h-7 w-7 text-emerald-400" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            Tarefas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 relative z-10">
          <div className="text-center py-8 text-foreground/60">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-400 mx-auto mb-4"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <p className="text-base font-medium">Carregando tarefas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-3 sm:pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">Tarefas de Hoje</CardTitle>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-xs sm:text-sm bg-primary/10 text-primary border-primary/20">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {pendingTasks} pendente{pendingTasks !== 1 ? 's' : ''}
            </Badge>
            <Link to="/tarefas">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-primary hover:text-primary/80">
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ver todas</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="space-y-1 sm:space-y-2 mt-2 sm:mt-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Progresso de hoje</span>
              <span className="font-medium text-foreground">
                {completedTasks}/{totalTasks} concluída{completedTasks !== 1 ? 's' : ''}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
        
        {todayTasks.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {todayTasks.slice(0, 3).map((task, index) => {
              const priorityConfig = getPriorityConfig(task.priority || '');
              const overdue = task.due_date ? isOverdue(task.due_date) : false;
              const isCompleted = task.status === 'concluida';
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all",
                    isCompleted 
                      ? "bg-muted/30 border-border" 
                      : "bg-muted/20 border-border hover:bg-muted/40 hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => !isCompleted && handleToggleComplete(task.id)}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <p className={cn(
                        "font-medium text-xs sm:text-sm truncate",
                        isCompleted && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {task.priority && !isCompleted && (
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[10px] sm:text-xs",
                            task.priority === 'alta' && "border-red-300 text-red-700",
                            task.priority === 'media' && "border-yellow-300 text-yellow-700",
                            task.priority === 'baixa' && "border-gray-300 text-gray-700"
                          )}
                        >
                          {priorityConfig?.label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                      {task.due_date && (
                        <div className={cn(
                          "flex items-center gap-1",
                          overdue && !isCompleted && "text-red-600 font-medium"
                        )}>
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{formatTime(task.due_date)}</span>
                          {overdue && !isCompleted && (
                            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1" />
                          )}
                        </div>
                      )}
                      
                      {task.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="truncate">
                            Atribuído
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {todayTasks.length > 3 && (
              <div className="text-center pt-2 sm:pt-3">
                <Link to="/tarefas">
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ver mais {todayTasks.length - 3} tarefa{todayTasks.length - 3 !== 1 ? 's' : ''}
                  </Button>
                </Link>
              </div>
            )}
            
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-positive" />
            <p className="text-sm sm:text-base font-medium mb-1 sm:mb-2">
              Nenhuma tarefa para hoje!
            </p>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4">
              Você está em dia com suas tarefas. 🎉
            </p>
            <Link to="/tarefas">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Criar nova tarefa
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
