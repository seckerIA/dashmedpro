import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Stethoscope, Edit, Trash2, CheckCircle2, XCircle, DollarSign, UserCheck, UserX, UserCog } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations, APPOINTMENT_TYPE_LABELS } from '@/types/medicalAppointments';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { cn } from '@/lib/utils';

// Status-based color mappings for the left border accent
const statusAccentColors: Record<string, string> = {
  scheduled: 'border-l-blue-500',
  confirmed: 'border-l-green-500',
  in_progress: 'border-l-purple-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-gray-400',
  no_show: 'border-l-red-500',
};

// Status-based background tints for the time box
const statusTimeBgColors: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  confirmed: 'bg-green-500/10 text-green-700 dark:text-green-300',
  in_progress: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
  no_show: 'bg-red-500/10 text-red-700 dark:text-red-300',
};

interface AppointmentCardProps {
  appointment: MedicalAppointmentWithRelations;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkCompleted?: () => void;
  onCancel?: () => void;
  onMarkAttended?: () => void;
  onMarkNoShow?: () => void;
  /** Se false, oculta opções de Editar e Excluir (para secretárias) */
  canEdit?: boolean;
}

export function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCancel,
  onMarkAttended,
  onMarkNoShow,
  canEdit = true,
}: AppointmentCardProps) {
  const startTime = format(parseISO(appointment.start_time), 'HH:mm', { locale: ptBR });
  const dayOfWeek = format(parseISO(appointment.start_time), 'EEE', { locale: ptBR }).toUpperCase();
  const patientName = appointment.contact?.full_name || 'Sem paciente';
  const patientPhone = appointment.contact?.phone || 'Sem telefone';
  const appointmentType = APPOINTMENT_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type;
  const doctorName = appointment.doctor?.full_name || appointment.doctor?.email;

  const isActive = appointment.status !== 'completed' &&
    appointment.status !== 'no_show' &&
    appointment.status !== 'cancelled';

  return (
    <Card className={cn(
      "group overflow-hidden border-l-4 transition-all duration-200",
      "hover:shadow-md",
      statusAccentColors[appointment.status] || 'border-l-blue-500'
    )}>
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Time Box - left side */}
          <div className={cn(
            "flex flex-col items-center justify-center px-2.5 sm:px-4 py-3 min-w-[56px] sm:min-w-[72px] shrink-0",
            statusTimeBgColors[appointment.status] || 'bg-blue-500/10 text-blue-700'
          )}>
            <span className="text-base sm:text-lg font-bold leading-none">{startTime}</span>
            <span className="text-[10px] font-medium mt-1 opacity-70">{dayOfWeek}</span>
          </div>

          {/* Main content */}
          <div className="flex-1 p-2.5 sm:p-3 min-w-0">
            {/* Top row: Patient name + Status badge */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1">
              <span className="font-semibold text-xs sm:text-sm truncate">{patientName}</span>
              <AppointmentStatusBadge status={appointment.status} size="sm" />
            </div>

            {/* Details row */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
              {doctorName && (
                <span className="flex items-center gap-1">
                  <UserCog className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-primary font-medium truncate">Dr(a). {doctorName}</span>
                </span>
              )}
              {appointment.title && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{appointment.title}</span>
                  <span className="text-muted-foreground/60 hidden sm:inline">({appointmentType})</span>
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground mt-1">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{patientPhone}</span>
            </div>

            {/* Paid badge if applicable */}
            {appointment.paid_in_advance && (
              <Badge variant="outline" className="mt-1.5 bg-green-500/10 text-green-600 border-green-500/20 text-[10px] h-5">
                <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                Pago Antecipado
              </Badge>
            )}

            {/* Action buttons bar */}
            <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 pt-2 border-t border-border/40 flex-wrap">
              {/* Attendance: Compareceu / Falta */}
              {isActive && (
                <>
                  {onMarkAttended && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onMarkAttended}
                      className="h-8 sm:h-7 text-xs bg-green-600 hover:bg-green-700 active:bg-green-800"
                    >
                      <UserCheck className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Compareceu</span>
                    </Button>
                  )}
                  {onMarkNoShow && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onMarkNoShow}
                      className="h-8 sm:h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 active:bg-red-100 dark:active:bg-red-900"
                    >
                      <UserX className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Falta</span>
                    </Button>
                  )}
                </>
              )}

              {/* Mark completed */}
              {appointment.status !== 'completed' && onMarkCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMarkCompleted}
                  className="h-8 sm:h-7 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Concluído</span>
                </Button>
              )}

              {/* Cancel */}
              {appointment.status !== 'cancelled' && onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="h-8 sm:h-7 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
              )}

              {/* Edit */}
              {canEdit && onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-8 sm:h-7 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}

              {/* Delete */}
              {canEdit && onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 sm:h-7 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
