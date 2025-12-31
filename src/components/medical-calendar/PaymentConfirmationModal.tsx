import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: MedicalAppointmentWithRelations | null;
  onConfirm: (paid: boolean) => void;
  isProcessing?: boolean;
}

export function PaymentConfirmationModal({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  isProcessing = false,
}: PaymentConfirmationModalProps) {
  if (!appointment) return null;

  const estimatedValue = appointment.estimated_value || 0;
  const hasValue = estimatedValue > 0;
  const paymentStatus = appointment.payment_status;
  const alreadyPaid = paymentStatus === 'paid' || paymentStatus === 'partial';
  const sinalPaid = appointment.sinal_paid === true;

  const handleConfirmPaid = () => {
    onConfirm(true);
  };

  const handleConfirmNotPaid = () => {
    onConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Confirmação de Pagamento
          </DialogTitle>
          <DialogDescription>
            O paciente compareceu à consulta. Por favor, confirme se o pagamento foi realizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do paciente */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Paciente</p>
            <p className="font-medium">{appointment.contact?.full_name || 'Sem nome'}</p>
          </div>

          {/* Valor da consulta */}
          {hasValue && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor da Consulta</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(estimatedValue)}</p>
            </div>
          )}

          {/* Status atual de pagamento */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status Atual de Pagamento</p>
            <PaymentStatusBadge status={paymentStatus} showIcon />
            {sinalPaid && appointment.sinal_amount && (
              <p className="text-xs text-muted-foreground mt-1">
                Sinal pago: {formatCurrency(appointment.sinal_amount)}
              </p>
            )}
          </div>

          {/* Alert se já está pago */}
          {alreadyPaid && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Pagamento já confirmado
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  A transação financeira será criada automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Alert se não tem valor */}
          {!hasValue && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Consulta sem valor definido
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Nenhuma transação financeira será criada.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          {hasValue && !alreadyPaid && (
            <>
              <Button
                variant="outline"
                onClick={handleConfirmNotPaid}
                disabled={isProcessing}
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Não Pagou
              </Button>
              <Button
                onClick={handleConfirmPaid}
                disabled={isProcessing}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pagou
              </Button>
            </>
          )}
          {(!hasValue || alreadyPaid) && (
            <Button
              onClick={() => onConfirm(alreadyPaid)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
