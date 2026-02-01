import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateFormDialog({ open, onOpenChange }: TemplateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Template de Follow-Up</DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center text-muted-foreground">
          Formulário de template em desenvolvimento...
          <p className="text-sm mt-2">
            Use o botão "Criar Templates Padrão" para criar 3 templates pré-configurados
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
