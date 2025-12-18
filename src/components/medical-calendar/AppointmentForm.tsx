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
import { useAvailability } from '@/hooks/useAvailability';
import { ContactForm } from '@/components/crm/ContactForm';
import { UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Ensure ptBR is available (defensive check)
const locale = ptBR || undefined;
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { formatCurrencyInput, parseCurrencyToNumber, formatCurrency } from '@/lib/currency';

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
  estimated_value: z.string().optional().transform((val) => val ? parseCurrencyToNumber(val) : undefined),
  payment_status: z.enum(['pending', 'paid', 'partial', 'cancelled']),
  paid_in_advance: z.boolean().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  appointment?: MedicalAppointment | null;
  prefilledStart?: Date;
  prefilledEnd?: Date;
  conversionData?: {
    contactId?: string;
    appointmentValue?: number;
    paidInAdvance?: boolean;
  } | null;
}

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  prefilledStart,
  prefilledEnd,
  conversionData,
}: AppointmentFormProps) {
  const { user } = useAuth();
  const { contacts } = useCRM();
  const { checkAvailability } = useAvailability();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedValueDisplay, setEstimatedValueDisplay] = useState<string>('');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [showNewContactForm, setShowNewContactForm] = useState(false);

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
    setAvailabilityError(null);

    try {
      // Combine date and time
      const [hours, minutes] = data.start_time.split(':');
      const startDateTime = new Date(data.start_date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + data.duration_minutes * 60000);

      // Check availability (exclude current appointment if editing)
      const availability = checkAvailability(
        startDateTime,
        endDateTime,
        appointment?.id
      );

      if (!availability.available) {
        const conflictMessages = availability.conflicts.map((conflict) => {
          const conflictType = conflict.type === 'appointment' ? 'Consulta médica' : 'Reunião';
          const conflictTime = format(parseISO(conflict.start_time), 'HH:mm', { locale: ptBR });
          return `${conflictType}: ${conflict.title} às ${conflictTime}`;
        });

        setAvailabilityError(
          `Horário indisponível! Conflito com: ${conflictMessages.join(', ')}`
        );
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        user_id: user?.id,
        contact_id: data.contact_id,
        title: data.title,
        appointment_type: data.appointment_type,
        status: data.status,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        estimated_value: data.estimated_value || null,
        payment_status: data.payment_status,
        paid_in_advance: data.paid_in_advance || false,
      };

      await onSubmit(submitData);
      setAvailabilityError(null);
      setEstimatedValueDisplay('');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setAvailabilityError('Erro ao salvar consulta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate form when editing or when conversion data is provided
  useEffect(() => {
    if (appointment && open) {
      const startDate = parseISO(appointment.start_time);
      const estimatedValueFormatted = appointment.estimated_value 
        ? formatCurrency(appointment.estimated_value) 
        : '';
      setEstimatedValueDisplay(estimatedValueFormatted);
      reset({
        contact_id: appointment.contact_id,
        appointment_type: appointment.appointment_type,
        title: appointment.title,
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        notes: appointment.notes || '',
        internal_notes: appointment.internal_notes || '',
        estimated_value: estimatedValueFormatted,
        payment_status: appointment.payment_status,
        paid_in_advance: appointment.paid_in_advance || false,
      });
    } else if (!appointment && open) {
      // Reset to defaults for new appointment
      const isConversion = conversionData && conversionData.contactId;
      const estimatedValueFormatted = isConversion && conversionData.appointmentValue
        ? formatCurrency(conversionData.appointmentValue)
        : '';
      
      setEstimatedValueDisplay(estimatedValueFormatted);
      reset({
        appointment_type: 'first_visit',
        status: 'scheduled',
        duration_minutes: 30,
        payment_status: isConversion && conversionData.paidInAdvance ? 'paid' : 'pending',
        start_date: prefilledStart || new Date(),
        start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
        title: '',
        contact_id: isConversion ? conversionData.contactId! : '',
        notes: '',
        internal_notes: '',
        estimated_value: estimatedValueFormatted,
        paid_in_advance: isConversion ? conversionData.paidInAdvance || false : false,
      });
    }
  }, [appointment, open, prefilledStart, reset, conversionData]);

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
          {/* Availability Error Alert */}
          {availabilityError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Horário Indisponível</AlertTitle>
              <AlertDescription>{availabilityError}</AlertDescription>
            </Alert>
          )}

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="contact_id">Paciente *</Label>
            <Select 
              value={watch('contact_id') || ''} 
              onValueChange={(value) => setValue('contact_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {contacts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum paciente cadastrado. Clique em "Cadastrar novo paciente" para adicionar.
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.full_name || contact.name || 'Sem nome'}</span>
                        <span className="text-xs text-muted-foreground">
                          {contact.phone} {contact.email && `• ${contact.email}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.contact_id && (
              <p className="text-sm text-destructive">{errors.contact_id.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewContactForm(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar novo paciente
            </Button>
          </div>

          {/* Appointment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_type">Tipo de Consulta *</Label>
              <Select
                value={watch('appointment_type')}
                onValueChange={(value) => setValue('appointment_type', value as AppointmentType)}
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
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as AppointmentStatus)}
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
                value={watch('start_time')}
                onValueChange={(value) => setValue('start_time', value)}
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
                value={watch('duration_minutes')?.toString()}
                onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
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
              <Label htmlFor="estimated_value">Valor Estimado</Label>
              <Input
                id="estimated_value"
                type="text"
                value={estimatedValueDisplay}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value);
                  setEstimatedValueDisplay(formatted);
                  setValue('estimated_value', formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Status de Pagamento</Label>
              <Select
                value={watch('payment_status')}
                onValueChange={(value) => setValue('payment_status', value as PaymentStatus)}
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

      {/* Contact Form Modal */}
      {showNewContactForm && (
        <ContactForm
          forceOpen={true}
          onContactCreated={async (contactId) => {
            // Invalidar e refetch a lista de contatos para garantir que o novo paciente apareça
            await queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            await queryClient.refetchQueries({ queryKey: ['crm-contacts', user?.id] });
            setValue('contact_id', contactId);
            setShowNewContactForm(false);
          }}
          onCancel={() => setShowNewContactForm(false)}
          onSuccess={async () => {
            // Invalidar e refetch a lista de contatos
            await queryClient.invalidateQueries({ queryKey: ['crm-contacts', user?.id] });
            await queryClient.refetchQueries({ queryKey: ['crm-contacts', user?.id] });
            setShowNewContactForm(false);
          }}
        />
      )}
    </Dialog>
  );
}
