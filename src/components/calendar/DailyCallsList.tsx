import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SalesCallWithRelations, CALL_STATUS_LABELS, CALL_STATUS_COLORS } from '@/types/salesCalls';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Phone, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Building2,
  User
} from 'lucide-react';
import { useSalesCalls } from '@/hooks/useSalesCalls';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DailyCallsListProps {
  calls: SalesCallWithRelations[];
  onEditCall: (call: SalesCallWithRelations) => void;
  onViewCall: (call: SalesCallWithRelations) => void;
}

export function DailyCallsList({ calls, onEditCall, onViewCall }: DailyCallsListProps) {
  const { toast } = useToast();
  const { deleteCall, markAsCompleted, markAsCancelled, markAsNoShow } = useSalesCalls();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [callToDelete, setCallToDelete] = useState<SalesCallWithRelations | null>(null);

  // Agrupar calls por data com validação
  const groupedCalls = calls.reduce((groups, call) => {
    try {
      // Garantir que scheduled_at é uma data válida
      const callDate = call.scheduled_at ? parseISO(call.scheduled_at) : new Date();
      const date = format(callDate, 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(call);
    } catch (error) {
      console.error('Erro ao processar call:', call, error);
    }
    return groups;
  }, {} as Record<string, SalesCallWithRelations[]>);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const handleDelete = async () => {
    if (!callToDelete) return;

    try {
      await deleteCall.mutateAsync(callToDelete.id);
      toast({
        title: 'Call excluída',
        description: 'A call foi excluída com sucesso.',
      });
      setDeleteDialogOpen(false);
      setCallToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a call.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsCompleted = async (call: SalesCallWithRelations) => {
    try {
      await markAsCompleted.mutateAsync(call.id);
      toast({
        title: 'Call marcada como realizada',
        description: 'A call foi marcada como realizada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a call como realizada.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsCancelled = async (call: SalesCallWithRelations) => {
    try {
      await markAsCancelled.mutateAsync(call.id);
      toast({
        title: 'Call cancelada',
        description: 'A call foi cancelada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a call.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsNoShow = async (call: SalesCallWithRelations) => {
    try {
      await markAsNoShow.mutateAsync(call.id);
      toast({
        title: 'Call marcada como não compareceu',
        description: 'A call foi marcada como não compareceu.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a call.',
        variant: 'destructive',
      });
    }
  };

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma call neste período</h3>
        <p className="text-sm text-muted-foreground">
          Clique no botão + para agendar uma nova call
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedCalls)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, dateCalls]) => (
          <div key={date} className="space-y-3">
            {/* Data Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {getDateLabel(date)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {dateCalls.length} {dateCalls.length === 1 ? 'call' : 'calls'}
              </p>
            </div>

            {/* Calls do dia */}
            <div className="space-y-2">
              {dateCalls
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map((call) => {
                  const statusColors = CALL_STATUS_COLORS[call.status];
                  const initials = call.contact?.full_name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '??';

                  return (
                    <Card 
                      key={call.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onViewCall(call)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {call.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground truncate">
                                    {call.contact?.full_name || 'Sem contato'}
                                  </span>
                                </div>
                                {call.contact?.company && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground truncate">
                                      {call.contact?.company}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Menu de ações */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onEditCall(call);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  
                                  {call.status === 'scheduled' && (
                                    <>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsCompleted(call);
                                      }}>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Marcar como Realizada
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsCancelled(call);
                                      }}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancelar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsNoShow(call);
                                      }}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Não Compareceu
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCallToDelete(call);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Horário e duração */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(parseISO(call.scheduled_at), 'HH:mm')}
                                </span>
                                <span className="text-muted-foreground">
                                  ({call.duration_minutes}min)
                                </span>
                              </div>

                              <Badge 
                                variant="secondary" 
                                className={`${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                              >
                                {CALL_STATUS_LABELS[call.status]}
                              </Badge>
                            </div>

                            {/* Notas (preview) */}
                            {call.notes && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                {call.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir call?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta call? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCallToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

