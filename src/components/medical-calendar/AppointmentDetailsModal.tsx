import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { Edit, Trash2, CheckCircle, XCircle, UserX } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: MedicalAppointmentWithRelations | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkCompleted?: () => void;
  onMarkNoShow?: () => void;
  onCancel?: () => void;
}

export function AppointmentDetailsModal({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onDelete,
  onMarkCompleted,
  onMarkNoShow,
  onCancel,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {appointment.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex gap-2">
            <AppointmentStatusBadge status={appointment.status} showIcon />
            <PaymentStatusBadge status={appointment.payment_status} showIcon />
          </div>

          {/* Patient Info */}
          <div>
            <h4 className="font-semibold mb-2">Paciente</h4>
            <div className="text-sm">
              {appointment.contact ? (
                <>
                  <p className="font-medium">{appointment.contact.full_name}</p>
                  {appointment.contact.phone && <p className="text-muted-foreground">{appointment.contact.phone}</p>}
                  {appointment.contact.email && <p className="text-muted-foreground">{appointment.contact.email}</p>}
                </>
              ) : (
                <p className="text-muted-foreground italic">Contato não encontrado ou removido</p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h4 className="font-semibold mb-2">Data e Horário</h4>
            <p className="text-sm">
              {format(new Date(appointment.start_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')} ({appointment.duration_minutes} min)
            </p>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h4 className="font-semibold mb-2">Observações</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* Internal Notes */}
          {appointment.internal_notes && (
            <div>
              <h4 className="font-semibold mb-2">Notas Internas</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.internal_notes}</p>
            </div>
          )}

          {/* Financial Info */}
          {appointment.estimated_value && (
            <div>
              <h4 className="font-semibold mb-2">Informações Financeiras</h4>
              <div className="space-y-2 text-sm">
                <p>
                  Valor Estimado: <span className="font-medium">{formatCurrency(appointment.estimated_value)}</span>
                </p>
                {appointment.paid_in_advance !== undefined && (
                  <p>
                    Pagamento: <span className="font-medium">
                      {appointment.paid_in_advance ? 'Antecipado' : 'Na consulta'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onMarkCompleted && appointment.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={onMarkCompleted}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluído
              </Button>
            )}
            {onMarkNoShow && appointment.status !== 'no_show' && (
              <Button variant="outline" size="sm" onClick={onMarkNoShow}>
                <UserX className="h-4 w-4 mr-2" />
                Marcar como Falta
              </Button>
            )}
            {onCancel && appointment.status !== 'cancelled' && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Consulta
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
