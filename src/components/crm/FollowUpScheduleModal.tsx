import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock } from 'lucide-react';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FollowUp } from '@/types/followUp';

interface FollowUpScheduleModalProps {
  dealId: string;
  dealTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp?: FollowUp; // Follow-up existente para edição
}

export function FollowUpScheduleModal({ dealId, dealTitle, open, onOpenChange, followUp }: FollowUpScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  
  const { user } = useAuth();
  const { createFollowUp, updateFollowUp, isCreating, isUpdating } = useFollowUps();
  const { toast } = useToast();
  
  const isEditing = !!followUp;
  const isLoading = isCreating || isUpdating;

  // Preencher campos quando em modo de edição
  useEffect(() => {
    if (followUp && open) {
      setScheduledDate(followUp.scheduled_date);
      setScheduledTime(followUp.scheduled_time);
      setDescription(followUp.description || '');
    } else if (!open) {
      // Limpar campos quando fechar o modal
      setScheduledDate('');
      setScheduledTime('');
      setDescription('');
    }
  }, [followUp, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && !isEditing) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para agendar um follow-up.',
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a data e o horário.',
      });
      return;
    }

    try {
      if (isEditing && followUp) {
        // Editar follow-up existente
        await updateFollowUp({
          id: followUp.id,
          data: {
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            description: description || undefined,
          }
        });

        toast({
          title: 'Follow-up atualizado!',
          description: `Follow-up remarcado para ${new Date(scheduledDate).toLocaleDateString('pt-BR')} às ${scheduledTime}`,
        });
      } else {
        // Criar novo follow-up
        await createFollowUp({
          deal_id: dealId,
          user_id: user!.id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          description: description || undefined,
        });

        toast({
          title: 'Follow-up agendado!',
          description: `Follow-up marcado para ${new Date(scheduledDate).toLocaleDateString('pt-BR')} às ${scheduledTime}`,
        });
      }

      // Resetar formulário e fechar modal
      setScheduledDate('');
      setScheduledTime('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'agendar'} follow-up:`, error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Não foi possível ${isEditing ? 'atualizar' : 'agendar'} o follow-up. Tente novamente.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isEditing ? 'Editar Follow-up' : 'Agendar Follow-up'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {dealTitle}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário *
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Verificar interesse no serviço X, enviar proposta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditing ? 'Atualizando...' : 'Agendando...') 
                : (isEditing ? 'Atualizar Follow-up' : 'Agendar Follow-up')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
