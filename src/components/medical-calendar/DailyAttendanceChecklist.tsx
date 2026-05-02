import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, User, Phone } from 'lucide-react';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { useUserProfile } from '@/hooks/useUserProfile';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { cn, isLocalCalendarDayEqual } from '@/lib/utils';

interface DailyAttendanceChecklistProps {
  selectedDate: Date;
}

export function DailyAttendanceChecklist({ selectedDate }: DailyAttendanceChecklistProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isMedico, isAdmin } = useUserProfile();
  const [isMinimized, setIsMinimized] = useState(true);
  const { appointments, markAsCompleted, markAsNoShow } = useMedicalAppointments({});

  // Filtrar consultas do dia selecionado que ainda não foram concluídas ou canceladas
  const dailyAppointments = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter((apt) => {
      try {
        if (!apt.start_time) return false;
        return (
          isLocalCalendarDayEqual(apt.start_time, selectedDate) &&
          apt.status !== 'completed' &&
          apt.status !== 'no_show' &&
          apt.status !== 'cancelled'
        );
      } catch {
        return false;
      }
    }).sort((a, b) => {
      try {
        const timeA = parseISO(a.start_time);
        const timeB = parseISO(b.start_time);
        return timeA.getTime() - timeB.getTime();
      } catch {
        return 0;
      }
    });
  }, [appointments, selectedDate]);

  const handleMarkAttended = async (appointment: MedicalAppointmentWithRelations) => {
    try {
      await markAsCompleted.mutateAsync(appointment.id);
      toast({
        title: 'Comparecimento confirmado',
        description: `${appointment.contact?.full_name || 'Paciente'} marcado como compareceu.`,
      });
      
      // Se for médico ou admin, redirecionar para o prontuário do paciente
      if ((isMedico || isAdmin) && appointment.contact_id) {
        navigate(`/prontuarios?patientId=${appointment.contact_id}&tab=historico`);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao confirmar comparecimento',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      });
    }
  };

  const handleMarkNoShow = async (appointment: MedicalAppointmentWithRelations) => {
    try {
      await markAsNoShow.mutateAsync(appointment.id);
      toast({
        title: 'Marcado como não compareceu',
        description: `${appointment.contact?.full_name || 'Paciente'} marcado como falta.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao marcar não comparecimento',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      });
    }
  };

  const isTodaySelected = isToday(selectedDate);
  const formattedDate = format(selectedDate, "d 'de' MMMM", { locale: ptBR });

  if (dailyAppointments.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">
              Checklist do Dia
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {dailyAppointments.length} {dailyAppointments.length === 1 ? 'consulta' : 'consultas'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
          >
            {isMinimized ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isTodaySelected ? 'Hoje' : formattedDate}
        </p>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0 space-y-2 max-h-[400px] overflow-y-auto">
          {dailyAppointments.map((appointment) => {
            const startTime = format(parseISO(appointment.start_time), 'HH:mm', { locale: ptBR });
            const patientName = appointment.contact?.full_name || 'Sem paciente';
            const patientPhone = appointment.contact?.phone || 'Sem telefone';

            return (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-card overflow-hidden"
              >
                <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm flex-shrink-0">{startTime}</span>
                    <div className="h-3 w-px bg-border flex-shrink-0" />
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{patientName}</span>
                    </div>
                    {patientPhone !== 'Sem telefone' && (
                      <>
                        <div className="h-3 w-px bg-border flex-shrink-0" />
                        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs truncate">{patientPhone}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {appointment.title && (
                    <p className="text-xs text-muted-foreground ml-6 truncate">
                      {appointment.title}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleMarkAttended(appointment)}
                    className="h-7 px-2 bg-green-600 hover:bg-green-700 text-xs whitespace-nowrap"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Compareceu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkNoShow(appointment)}
                    className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 text-xs whitespace-nowrap"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Falta
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}







