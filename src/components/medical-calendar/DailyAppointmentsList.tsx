import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { AppointmentCard } from './AppointmentCard';
import { Calendar } from 'lucide-react';
import { isLocalCalendarDayEqual } from '@/lib/utils';

interface DailyAppointmentsListProps {
  selectedDate: Date;
  appointments: MedicalAppointmentWithRelations[];
  onEdit?: (appointment: MedicalAppointmentWithRelations) => void;
  onDelete?: (appointment: MedicalAppointmentWithRelations) => void;
  onMarkCompleted?: (appointment: MedicalAppointmentWithRelations) => void;
  onCancel?: (appointment: MedicalAppointmentWithRelations) => void;
  onMarkAttended?: (appointment: MedicalAppointmentWithRelations) => void;
  onMarkNoShow?: (appointment: MedicalAppointmentWithRelations) => void;
  /** Se false, oculta opções de Editar e Excluir (para secretárias) */
  canEdit?: boolean;
}

export function DailyAppointmentsList({
  selectedDate,
  appointments,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCancel,
  onMarkAttended,
  onMarkNoShow,
  canEdit = true,
}: DailyAppointmentsListProps) {
  // Filtrar consultas do dia selecionado
  const dailyAppointments = appointments.filter(appt => {
    try {
      if (!appt.start_time) return false;
      return isLocalCalendarDayEqual(appt.start_time, selectedDate);
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

  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Card className="shadow-sm border-border h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold leading-tight">Consultas do Dia</CardTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{capitalizedDate}</p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg">
            {dailyAppointments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-[200px] sm:min-h-[400px] lg:min-h-[600px] px-3 sm:px-6">
        {dailyAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-16">
            <div className="rounded-2xl border-2 border-dashed border-border/60 p-5 sm:p-8 text-center max-w-xs">
              <div className="mx-auto p-2.5 sm:p-3 rounded-full bg-muted/50 w-fit mb-3 sm:mb-4">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Nenhuma consulta agendada</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/70 mt-1">
                para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {dailyAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={() => onEdit?.(appointment)}
                onDelete={() => onDelete?.(appointment)}
                onMarkCompleted={() => onMarkCompleted?.(appointment)}
                onCancel={() => onCancel?.(appointment)}
                onMarkAttended={() => onMarkAttended?.(appointment)}
                onMarkNoShow={() => onMarkNoShow?.(appointment)}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
