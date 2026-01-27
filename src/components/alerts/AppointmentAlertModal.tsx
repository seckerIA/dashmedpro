import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  User,
  Phone,
  Clock,
  FileText,
  X,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations, APPOINTMENT_TYPE_LABELS } from '@/types/medicalAppointments';

interface AppointmentAlertModalProps {
  /** The appointment to display */
  appointment: MedicalAppointmentWithRelations;
  /** Minutes until the appointment starts */
  minutesUntil: number | null;
  /** Called when the user dismisses the alert */
  onDismiss: () => void;
  /** Called when the user wants to open the medical record */
  onOpenRecord: () => void;
}

/**
 * Modal alert component that displays appointment information
 * 10 minutes before a scheduled consultation.
 */
export function AppointmentAlertModal({
  appointment,
  minutesUntil,
  onDismiss,
  onOpenRecord,
}: AppointmentAlertModalProps) {
  const contactName = appointment.contact?.full_name || 'Paciente';
  const contactPhone = appointment.contact?.phone || 'Sem telefone';
  const appointmentTime = format(new Date(appointment.start_time), 'HH:mm', { locale: ptBR });
  const appointmentTypeLabel = APPOINTMENT_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Consulta em {minutesUntil} {minutesUntil === 1 ? 'minuto' : 'minutos'}
              </DialogTitle>
              <DialogDescription>
                Lembrete de agendamento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{contactName}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{contactPhone}</span>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Horario</p>
                <p className="font-medium">{appointmentTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Stethoscope className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium text-sm">{appointmentTypeLabel}</p>
              </div>
            </div>
          </div>

          {/* Title/Description */}
          {appointment.title && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Descricao</p>
                <p className="text-sm">{appointment.title}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30">
              <p className="text-xs text-muted-foreground mb-1">Observacoes</p>
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button
            onClick={onOpenRecord}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Abrir Prontuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
