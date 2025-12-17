import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, User, Phone, Stethoscope, MoreVertical, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations, APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS } from '@/types/medicalAppointments';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: MedicalAppointmentWithRelations;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkCompleted?: () => void;
  onCancel?: () => void;
}

export function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCancel,
}: AppointmentCardProps) {
  const startTime = format(parseISO(appointment.start_time), 'HH:mm', { locale: ptBR });
  const patientName = appointment.contact?.full_name || 'Sem paciente';
  const patientPhone = appointment.contact?.phone || 'Sem telefone';
  const appointmentType = APPOINTMENT_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type;

  return (
    <Card className="hover:shadow-md hover:border-primary/30 transition-all duration-200 border-border bg-gradient-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Conteúdo principal */}
          <div className="flex-1 space-y-3">
            {/* Header: Horário e Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-lg">{startTime}</span>
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>

            {/* Informações do paciente */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{patientName}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{patientPhone}</span>
              </div>

              {appointment.title && (
                <div className="flex items-start gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">{appointment.title}</span>
                    {appointment.appointment_type && (
                      <span className="text-muted-foreground ml-2">
                        ({appointmentType})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {appointment.status !== 'completed' && onMarkCompleted && (
                <DropdownMenuItem onClick={onMarkCompleted}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </DropdownMenuItem>
              )}
              {appointment.status !== 'cancelled' && onCancel && (
                <DropdownMenuItem onClick={onCancel}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

