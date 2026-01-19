import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, User, Phone, Stethoscope, MoreVertical, Edit, Trash2, CheckCircle2, XCircle, DollarSign, UserCheck, UserX, UserCog } from 'lucide-react';
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
  const patientName = appointment.contact?.full_name || 'Sem paciente';
  const patientPhone = appointment.contact?.phone || 'Sem telefone';
  const appointmentType = APPOINTMENT_TYPE_LABELS[appointment.appointment_type] || appointment.appointment_type;
  const doctorName = appointment.doctor?.full_name || appointment.doctor?.email;

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

              {/* Médico Responsável */}
              {doctorName && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCog className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">Dr(a). {doctorName}</span>
                </div>
              )}

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

              {/* Badge de pagamento antecipado */}
              {appointment.paid_in_advance && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Pago Antecipado
                  </Badge>
                </div>
              )}

              {/* Botões de presença/ausência - visíveis apenas se não estiver concluído/cancelado */}
              {appointment.status !== 'completed' && 
               appointment.status !== 'no_show' && 
               appointment.status !== 'cancelled' && 
               (onMarkAttended || onMarkNoShow) && (
                <div className="flex items-center gap-2 pt-2">
                  {onMarkAttended && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onMarkAttended}
                      className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Compareceu
                    </Button>
                  )}
                  {onMarkNoShow && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onMarkNoShow}
                      className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                    >
                      <UserX className="h-3.5 w-3.5 mr-1.5" />
                      Falta
                    </Button>
                  )}
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
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {appointment.status !== 'completed' && 
               appointment.status !== 'no_show' && 
               appointment.status !== 'cancelled' && (
                <>
                  {onMarkAttended && (
                    <DropdownMenuItem onClick={onMarkAttended} className="text-green-600 focus:text-green-600">
                      <UserCheck className="h-4 w-4 mr-2" />
                  Compareceu
                    </DropdownMenuItem>
                  )}
                  {onMarkNoShow && (
                    <DropdownMenuItem onClick={onMarkNoShow} className="text-red-600 focus:text-red-600">
                      <UserX className="h-4 w-4 mr-2" />
                  Não Compareceu
                    </DropdownMenuItem>
                  )}
                </>
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
              {canEdit && onDelete && (
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

