import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCRM } from '@/hooks/useCRM';
import { useSalesCalls } from '@/hooks/useSalesCalls';
import { SalesCallInsert, SalesCallWithRelations } from '@/types/salesCalls';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface SalesCallFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCall?: SalesCallWithRelations | null;
  preSelectedContactId?: string;
  preSelectedDealId?: string;
}

interface FormData {
  contact_id: string;
  deal_id?: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes?: string;
}

export function SalesCallForm({
  open,
  onOpenChange,
  editCall,
  preSelectedContactId,
  preSelectedDealId
}: SalesCallFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { contacts } = useCRM();
  const { createCall, updateCall } = useSalesCalls();

  const [selectedContactId, setSelectedContactId] = useState<string>(
    preSelectedContactId || editCall?.contact_id || ''
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      contact_id: preSelectedContactId || editCall?.contact_id || '',
      deal_id: preSelectedDealId || editCall?.deal_id || '',
      title: editCall?.title || '',
      scheduled_date: editCall
        ? format(new Date(editCall.scheduled_at), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: editCall
        ? format(new Date(editCall.scheduled_at), 'HH:mm')
        : '09:00',
      duration_minutes: editCall?.duration_minutes || 30,
      notes: editCall?.notes || '',
    },
  });

  // Atualizar form quando editCall mudar
  useEffect(() => {
    if (editCall) {
      setValue('contact_id', editCall.contact_id);
      setValue('deal_id', editCall.deal_id || '');
      setValue('title', editCall.title);
      setValue('scheduled_date', format(new Date(editCall.scheduled_at), 'yyyy-MM-dd'));
      setValue('scheduled_time', format(new Date(editCall.scheduled_at), 'HH:mm'));
      setValue('duration_minutes', editCall.duration_minutes);
      setValue('notes', editCall.notes || '');
      setSelectedContactId(editCall.contact_id);
    } else if (preSelectedContactId) {
      setValue('contact_id', preSelectedContactId);
      setSelectedContactId(preSelectedContactId);
    }
  }, [editCall, preSelectedContactId, setValue]);

  // Obter deals do contato selecionado
  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const contactDeals = (selectedContact as any)?.deals ?? [];

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;

    try {
      // Combinar data e hora
      const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}`);

      if (editCall) {
        // Atualizar call existente
        await updateCall.mutateAsync({
          id: editCall.id,
          updates: {
            title: data.title,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: data.duration_minutes,
            notes: data.notes || null,
          },
        });

        toast({
          title: 'Call atualizada',
          description: 'A call foi atualizada com sucesso.',
        });
      } else {
        // Criar nova call
        const callData: SalesCallInsert = {
          user_id: user.id,
          contact_id: data.contact_id,
          deal_id: data.deal_id || null,
          title: data.title,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: data.duration_minutes,
          notes: data.notes || null,
        };

        await createCall.mutateAsync(callData);

        toast({
          title: 'Call agendada',
          description: 'A call foi agendada com sucesso.',
        });
      }

      handleClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar call',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedContactId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editCall ? 'Editar Call' : 'Agendar Nova Call'}
          </DialogTitle>
          <DialogDescription>
            {editCall
              ? 'Atualize as informações da call de vendas'
              : 'Preencha os dados para agendar uma call de vendas'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="contact_id">Cliente *</Label>
            <Select
              value={watch('contact_id')}
              onValueChange={(value) => {
                setValue('contact_id', value);
                setSelectedContactId(value);
                setValue('deal_id', ''); // Reset deal quando mudar cliente
              }}
              disabled={!!editCall}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex flex-col">
                      <span>{contact.full_name}</span>
                      {contact.company && (
                        <span className="text-xs text-muted-foreground">{contact.company}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contact_id && (
              <p className="text-sm text-destructive">Cliente é obrigatório</p>
            )}
          </div>

          {/* Deal (opcional) */}
          {contactDeals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="deal_id">Deal Relacionado (opcional)</Label>
              <Select
                value={watch('deal_id') || ''}
                onValueChange={(value) => setValue('deal_id', value || '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um deal (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {contactDeals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Call *</Label>
            <Input
              id="title"
              placeholder="Ex: Apresentação de proposta"
              {...register('title', { required: true })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">Título é obrigatório</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Data *</Label>
              <DatePicker
                date={watch('scheduled_date') ? new Date(watch('scheduled_date')! + 'T00:00:00') : undefined}
                setDate={(date) => setValue('scheduled_date', date ? format(date, 'yyyy-MM-dd') : '')}
              />
              {errors.scheduled_date && (
                <p className="text-sm text-destructive">Data é obrigatória</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Horário *</Label>
              <Input
                id="scheduled_time"
                type="time"
                {...register('scheduled_time', { required: true })}
              />
              {errors.scheduled_time && (
                <p className="text-sm text-destructive">Horário é obrigatório</p>
              )}
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duração</Label>
            <Select
              value={watch('duration_minutes').toString()}
              onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a call..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCall ? 'Atualizar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

