import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UserPlus } from "lucide-react";

interface SessionResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAtendimentoEncerrado: () => void;
  onContatoDecisor: () => void;
}

export function SessionResults({
  open,
  onOpenChange,
  onAtendimentoEncerrado,
  onContatoDecisor,
}: SessionResultsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl">Finalizar Atendimento</DialogTitle>
          <DialogDescription className="text-base">
            Como foi o resultado deste atendimento?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <Button
            onClick={onAtendimentoEncerrado}
            variant="outline"
            className="w-full h-auto py-6 flex flex-col gap-3 hover:bg-gray-50 transition-all duration-200 border-2"
          >
            <CheckCircle2 className="w-8 h-8 text-gray-600" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Atendimento Encerrado</p>
              <p className="text-xs text-muted-foreground font-normal">
                Cliente não interessado ou não é decisor
              </p>
            </div>
          </Button>

          <Button
            onClick={onContatoDecisor}
            className="w-full h-auto py-6 flex flex-col gap-3 bg-green-600 hover:bg-green-700 transition-all duration-200"
          >
            <UserPlus className="w-8 h-8 text-white" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Contato do Decisor Adquirido</p>
              <p className="text-xs text-green-100 font-normal">
                Consegui o contato da pessoa responsável
              </p>
            </div>
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Este atendimento será registrado em suas métricas diárias
        </div>
      </DialogContent>
    </Dialog>
  );
}





