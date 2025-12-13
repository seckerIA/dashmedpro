import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CRMDealWithContact } from "@/types/crm";
import { formatCurrency } from "@/lib/currency";
import { DollarSign, Trophy } from "lucide-react";

interface DealWonModalProps {
  open: boolean;
  deal: CRMDealWithContact | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DealWonModal({ open, deal, onConfirm, onCancel }: DealWonModalProps) {
  if (!deal) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/10 rounded-full">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                🎉 Parabéns! Negócio Fechado!
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-base space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-foreground">
                {deal.title}
              </p>
              {deal.contact && (
                <p className="text-sm text-muted-foreground">
                  Cliente: {deal.contact.full_name}
                </p>
              )}
              {deal.value && (
                <div className="flex items-center gap-2 mt-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-bold text-green-500">
                    {formatCurrency(deal.value)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Deseja registrar esta receita no financeiro?
              </p>
              <p className="text-sm">
                Você será redirecionado para a página de nova transação financeira com os dados deste negócio pré-preenchidos.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>
            Agora não
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Sim, registrar receita
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
