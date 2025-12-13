import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useToast } from '@/hooks/use-toast';

interface FollowUpCompletionModalProps {
  followUpId: string;
  dealTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowUpCompletionModal({ 
  followUpId, 
  dealTitle, 
  open, 
  onOpenChange 
}: FollowUpCompletionModalProps) {
  const [notes, setNotes] = useState('');
  const { updateFollowUp, isUpdating } = useFollowUps();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      await updateFollowUp({
        id: followUpId,
        data: {
          status: 'concluido',
          completed_notes: notes || undefined,
        },
      });

      toast({
        title: 'Follow-up concluído!',
        description: 'O follow-up foi marcado como concluído.',
      });

      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao completar follow-up:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível completar o follow-up.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Completar Follow-up
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {dealTitle}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Como foi o follow-up?</Label>
            <Textarea
              id="notes"
              placeholder="Descreva como foi o contato ou cole a conversa aqui..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? 'Salvando...' : 'Marcar como Concluído'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
