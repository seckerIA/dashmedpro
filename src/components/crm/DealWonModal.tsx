import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CRMDealWithContact } from "@/types/crm";
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { DollarSign, Trophy, Calendar } from "lucide-react";

interface DealWonModalProps {
  open: boolean;
  deal: CRMDealWithContact | null;
  onConfirm: (data: { appointmentValue: number; paymentTiming: 'advance' | 'at_appointment' }) => void;
  onCancel: () => void;
}

export function DealWonModal({ open, deal, onConfirm, onCancel }: DealWonModalProps) {
  const [appointmentValue, setAppointmentValue] = useState<string>(
    deal?.value ? formatCurrency(deal.value) : ''
  );
  const [paymentTiming, setPaymentTiming] = useState<'advance' | 'at_appointment'>('at_appointment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const value = parseCurrencyToNumber(appointmentValue);
      if (!value || value <= 0) {
        alert('Por favor, informe um valor válido para a consulta');
        setIsSubmitting(false);
        return;
      }

      onConfirm({
        appointmentValue: value,
        paymentTiming: paymentTiming
      });
    } catch (error) {
      console.error('Erro ao processar conversão:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/10 rounded-full">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                🎉 Parabéns! Negócio Fechado!
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            Configure a primeira consulta do cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info do Deal */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-foreground">
              {deal.title}
            </p>
            {deal.contact?.full_name && (
              <p className="text-sm text-muted-foreground">
                Cliente: {deal.contact.full_name}
              </p>
            )}
            {deal.value && (
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-lg font-bold text-green-500">
                  Valor do negócio: {formatCurrency(deal.value)}
                </span>
              </div>
            )}
          </div>

          {/* Valor da Consulta */}
          <div className="space-y-2">
            <Label htmlFor="appointmentValue">Valor da Primeira Consulta *</Label>
            <Input
              id="appointmentValue"
              type="text"
              value={appointmentValue}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setAppointmentValue(formatted);
              }}
              placeholder="R$ 0,00"
            />
            <p className="text-xs text-muted-foreground">
              Valor que será cobrado na primeira consulta
            </p>
          </div>

          {/* Timing do Pagamento */}
          <div className="space-y-3">
            <Label>Quando será feito o pagamento? *</Label>
            <RadioGroup
              value={paymentTiming}
              onValueChange={(value) => setPaymentTiming(value as 'advance' | 'at_appointment')}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="advance" id="advance" />
                <Label htmlFor="advance" className="flex-1 cursor-pointer font-normal">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span>Pagamento Antecipado</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente já pagou antes da consulta
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="at_appointment" id="at_appointment" />
                <Label htmlFor="at_appointment" className="flex-1 cursor-pointer font-normal">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Pagamento no Final da Consulta</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente pagará após a consulta ser realizada
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isSubmitting ? 'Processando...' : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Consulta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
