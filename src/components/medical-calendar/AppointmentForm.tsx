import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import {
  AppointmentType,
  AppointmentStatus,
  PaymentStatus,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DURATION_OPTIONS,
  generateTimeSlots,
  MedicalAppointment,
} from '@/types/medicalAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

// Ensure ptBR is available (defensive check)
const locale = ptBR || undefined;
import { cn } from '@/lib/utils';
import { useState } from 'react';

const appointmentSchema = z.object({
  contact_id: z.string().uuid({ message: 'Paciente é obrigatório' }),
  appointment_type: z.enum(['first_visit', 'return', 'procedure', 'urgent', 'follow_up', 'exam']),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  start_date: z.date({ required_error: 'Data é obrigatória' }),
  start_time: z.string().min(1, 'Horário é obrigatório'),
  duration_minutes: z.number().min(15).max(480),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  estimated_value: z.number().optional(),
  payment_status: z.enum(['pending', 'paid', 'partial', 'cancelled']),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  appointment?: MedicalAppointment | null;
  prefilledStart?: Date;
  prefilledEnd?: Date;
}

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  prefilledStart,
  prefilledEnd,
}: AppointmentFormProps) {
  const { user } = useAuth();
  const { contacts } = useCRM();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = generateTimeSlots();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_type: 'first_visit',
      status: 'scheduled',
      duration_minutes: 30,
      payment_status: 'pending',
      start_date: prefilledStart || new Date(),
      start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
    },
  });

  const handleFormSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.start_time.split(':');
      const startDateTime = new Date(data.start_date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const submitData = {
        user_id: user?.id,
        contact_id: data.contact_id,
        title: data.title,
        appointment_type: data.appointment_type,
        status: data.status,
        start_time: startDateTime.toISOString(),
        end_time: '', // Will be calculated by trigger
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        estimated_value: data.estimated_value || null,
        payment_status: data.payment_status,
      };

      await onSubmit(submitData);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedContactId = watch('contact_id');
  const selectedType = watch('appointment_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Consulta' : 'Nova Consulta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="contact_id">Paciente *</Label>
            <Select onValueChange={(value) => setValue('contact_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{contact.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.phone} {contact.email && `• ${contact.email}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contact_id && (
              <p className="text-sm text-destructive">{errors.contact_id.message}</p>
            )}
          </div>

          {/* Appointment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_type">Tipo de Consulta *</Label>
              <Select
                onValueChange={(value) => setValue('appointment_type', value as AppointmentType)}
                defaultValue="first_visit"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => setValue('status', value as AppointmentStatus)}
                defaultValue="scheduled"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Consulta de retorno - João Silva"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch('start_date') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('start_date') ? (() => {
                      try {
                        return format(watch('start_date'), 'PPP', locale ? { locale } : undefined);
                      } catch (e) {
                        // Fallback if ptBR is not available
                        return format(watch('start_date'), 'PPP');
                      }
                    })() : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('start_date')}
                    onSelect={(date) => date && setValue('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Horário *</Label>
              <Select
                onValueChange={(value) => setValue('start_time', value)}
                defaultValue="09:00"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração</Label>
              <Select
                onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
                defaultValue="30"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações da consulta..."
              rows={3}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes">Notas Internas</Label>
            <Textarea
              id="internal_notes"
              {...register('internal_notes')}
              placeholder="Notas privadas (não visíveis ao paciente)..."
              rows={2}
            />
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Valor Estimado (R$)</Label>
              <Input
                id="estimated_value"
                type="number"
                step="0.01"
                {...register('estimated_value', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Status de Pagamento</Label>
              <Select
                onValueChange={(value) => setValue('payment_status', value as PaymentStatus)}
                defaultValue="pending"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointment ? 'Salvar Alterações' : 'Agendar Consulta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
