import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stethoscope, UserCheck } from 'lucide-react';

interface TreatmentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (isInTreatment: boolean) => void;
  patientName?: string;
}

export function TreatmentConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  patientName,
}: TreatmentConfirmationModalProps) {
  const handleConfirm = (isInTreatment: boolean) => {
    onConfirm(isInTreatment);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Status de Tratamento
          </DialogTitle>
          <DialogDescription>
            {patientName 
              ? `O paciente ${patientName} está em tratamento ativo?`
              : 'O paciente está em tratamento ativo?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Esta informação ajudará a organizar o paciente no pipeline corretamente.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleConfirm(false)}
            className="w-full sm:w-auto"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Não, apenas consulta
          </Button>
          <Button
            type="button"
            onClick={() => handleConfirm(true)}
            className="w-full sm:w-auto"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Sim, está em tratamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
