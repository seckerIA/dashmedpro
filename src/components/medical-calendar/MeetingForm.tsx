import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAvailability } from '@/hooks/useAvailability';
import {
  MeetingType,
  MeetingStatus,
  MEETING_TYPE_LABELS,
  MEETING_STATUS_LABELS,
  GeneralMeeting,
  DURATION_OPTIONS,
} from '@/types/generalMeetings';
import { generateTimeSlots } from '@/types/medicalAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, MapPin, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

const locale = ptBR || undefined;

const meetingSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  start_date: z.date({ required_error: 'Data é obrigatória' }),
  start_time: z.string().min(1, 'Horário é obrigatório'),
  duration_minutes: z.number().min(15).max(480),
  location: z.string().optional(),
  meeting_type: z.enum(['meeting', 'appointment', 'block', 'other']),
  is_busy: z.boolean().default(true),
  attendees: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  meeting?: GeneralMeeting | null;
  prefilledStart?: Date;
  prefilledEnd?: Date;
}

export function MeetingForm({
  open,
  onOpenChange,
  onSubmit,
  meeting,
  prefilledStart,
  prefilledEnd,
}: MeetingFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeesInput, setAttendeesInput] = useState<string>('');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(prefilledStart || new Date());

  // Passar a data selecionada para o hook carregar os dados do mês correto
  // Passar a data selecionada para o hook carregar os dados do mês correto
  const { checkAvailability, busySlots, isLoading: checkingAvailability } = useAvailability(selectedDate, selectedDate);

  const timeSlots = generateTimeSlots();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meeting_type: 'meeting',
      status: 'scheduled',
      duration_minutes: 30,
      is_busy: true,
      start_date: prefilledStart || new Date(),
      start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (meeting && open) {
      const startDate = parseISO(meeting.start_time);
      const attendeesStr = meeting.attendees?.join(', ') || '';
      setAttendeesInput(attendeesStr);
      setSelectedDate(startDate); // Sincronizar data selecionada
      reset({
        title: meeting.title,
        description: meeting.description || '',
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        duration_minutes: meeting.duration_minutes,
        location: meeting.location || '',
        meeting_type: meeting.meeting_type,
        is_busy: meeting.is_busy,
        attendees: attendeesStr,
        notes: meeting.notes || '',
        status: meeting.status,
      });
    } else if (!meeting && open) {
      const initialDate = prefilledStart || new Date();
      setAttendeesInput('');
      setSelectedDate(initialDate); // Sincronizar data selecionada
      reset({
        meeting_type: 'meeting',
        status: 'scheduled',
        duration_minutes: 30,
        is_busy: true,
        start_date: initialDate,
        start_time: prefilledStart ? format(prefilledStart, 'HH:mm') : '09:00',
        title: '',
        description: '',
        location: '',
        attendees: '',
        notes: '',
      });
    }
  }, [meeting, open, prefilledStart, reset]);

  const handleFormSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    setAvailabilityError(null);

    try {
      // Combine date and time
      const [hours, minutes] = data.start_time.split(':');
      const startDateTime = new Date(data.start_date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + data.duration_minutes * 60000);

      // Verificar disponibilidade
      // SEMPRE verifica conflitos com consultas médicas
      // Só verifica conflitos com outras reuniões se is_busy = true
      const availability = checkAvailability(
        startDateTime,
        endDateTime,
        meeting?.id
      );



      // Filtrar conflitos: sempre bloqueia para consultas, só bloqueia para reuniões se is_busy
      const relevantConflicts = availability.conflicts.filter((conflict) => {
        if (conflict.type === 'appointment') {
          // Sempre verifica conflitos com consultas médicas
          return true;
        }
        // Para reuniões, só verifica se is_busy está ativo
        return data.is_busy;
      });

      if (relevantConflicts.length > 0) {
        const conflictMessages = relevantConflicts.map((conflict) => {
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

      // Parse attendees
      const attendees = attendeesInput
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const submitData = {
        user_id: user?.id,
        title: data.title,
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: data.duration_minutes,
        location: data.location || null,
        meeting_type: data.meeting_type,
        is_busy: data.is_busy,
        attendees: attendees.length > 0 ? attendees : null,
        notes: data.notes || null,
        status: data.status,
      };

      await onSubmit(submitData);
      setAvailabilityError(null);
      setAttendeesInput('');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting meeting:', error);
      setAvailabilityError('Erro ao salvar reunião. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = watch('meeting_type');
  const isBusy = watch('is_busy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Editar Reunião' : 'Nova Reunião/Compromisso'}</DialogTitle>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Reunião com equipe, Compromisso pessoal..."
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Meeting Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_type">Tipo *</Label>
              <Select value={watch('meeting_type')} onValueChange={(value) => setValue('meeting_type', value as MeetingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as MeetingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEETING_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !watch('start_date') && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('start_date') ? (
                      format(watch('start_date'), 'PPP', locale ? { locale } : undefined)
                    ) : (
                      'Selecione'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('start_date')}
                    onSelect={(date) => {
                      if (date) {
                        setValue('start_date', date);
                        setSelectedDate(date);
                      }
                    }}
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
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.start_time && <p className="text-sm text-destructive">{errors.start_time.message}</p>}
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

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="w-4 h-4 inline mr-1" />
              Local
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Ex: Sala de reuniões, Online, Endereço..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada da reunião/compromisso..."
              rows={3}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">
              <Users className="w-4 h-4 inline mr-1" />
              Participantes
            </Label>
            <Input
              id="attendees"
              value={attendeesInput}
              onChange={(e) => {
                setAttendeesInput(e.target.value);
                setValue('attendees', e.target.value);
              }}
              placeholder="Separar por vírgula: João, Maria, Pedro..."
            />
            <p className="text-xs text-muted-foreground">Separe os nomes por vírgula</p>
          </div>

          {/* Is Busy */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_busy">Marcar como Indisponível</Label>
              <p className="text-sm text-muted-foreground">
                Quando marcado, você ficará indisponível para consultas médicas durante este período
              </p>
            </div>
            <Switch
              id="is_busy"
              checked={isBusy}
              onCheckedChange={(checked) => setValue('is_busy', checked)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notas privadas sobre esta reunião..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || checkingAvailability}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : checkingAvailability ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando agenda...
                </>
              ) : meeting ? (
                'Salvar Alterações'
              ) : (
                'Criar Reunião'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

