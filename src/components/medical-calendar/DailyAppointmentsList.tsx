import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { AppointmentCard } from './AppointmentCard';
import { Calendar } from 'lucide-react';

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
      const apptDate = parseISO(appt.start_time);
      return isSameDay(apptDate, selectedDate);
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
    <Card className="bg-gradient-card shadow-card border-border h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold mb-1">Consultas do Dia</CardTitle>
            <p className="text-sm text-muted-foreground">{capitalizedDate}</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold">
            <Calendar className="h-3 w-3 mr-1" />
            {dailyAppointments.length} {dailyAppointments.length === 1 ? 'consulta' : 'consultas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-[400px] lg:min-h-[600px]">
        {dailyAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma consulta agendada</p>
            <p className="text-sm text-muted-foreground mt-1">
              para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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

