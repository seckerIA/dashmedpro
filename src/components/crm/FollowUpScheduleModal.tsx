import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FollowUp } from '@/types/followUp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FollowUpScheduleModalProps {
  dealId: string;
  dealTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp?: FollowUp; // Follow-up existente para edição
}

export function FollowUpScheduleModal({ dealId, dealTitle, open, onOpenChange, followUp }: FollowUpScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const { user } = useAuth();
  const { createFollowUp, updateFollowUp, isCreating, isUpdating } = useFollowUps();
  const { toast } = useToast();

  const isEditing = !!followUp;
  const isLoading = isCreating || isUpdating;

  // Preencher campos quando em modo de edição
  useEffect(() => {
    if (followUp && open) {
      const scheduledDateTime = new Date(followUp.scheduled_date);
      setSelectedDate(scheduledDateTime);
      setScheduledTime(scheduledDateTime.toTimeString().slice(0, 5));
      setNotes(followUp.notes || '');
    } else if (!open) {
      // Limpar campos quando fechar o modal
      setSelectedDate(undefined);
      setScheduledTime('09:00');
      setNotes('');
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

    if (!selectedDate || !scheduledTime) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a data e o horário.',
      });
      return;
    }

    try {
      // Combinar data e hora em timestamp ISO
      const [hours, minutes] = scheduledTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isEditing && followUp) {
        // Editar follow-up existente
        await updateFollowUp({
          id: followUp.id,
          data: {
            scheduled_date: scheduledDateTime.toISOString(),
            notes: notes || null,
          } as any
        });

        toast({
          title: 'Follow-up atualizado!',
          description: `Follow-up remarcado para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${scheduledTime}`,
        });
      } else {
        // Criar novo follow-up
        await createFollowUp({
          deal_id: dealId,
          user_id: user!.id,
          type: 'call', // Campo obrigatório
          scheduled_date: scheduledDateTime.toISOString(),
          notes: notes || null,
        } as any);

        toast({
          title: 'Follow-up agendado!',
          description: `Follow-up marcado para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${scheduledTime}`,
        });
      }

      // Resetar formulário e fechar modal
      setSelectedDate(undefined);
      setScheduledTime('09:00');
      setNotes('');
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
      <DialogContent className="sm:max-w-[500px] z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {isEditing ? 'Editar Follow-up' : 'Agendar Follow-up'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {dealTitle}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Data *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Verificar interesse no serviço X, enviar proposta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
