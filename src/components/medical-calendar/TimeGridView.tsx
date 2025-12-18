import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, isSameDay, addMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MedicalAppointmentWithRelations, APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS } from '@/types/medicalAppointments';
import { GeneralMeeting, MEETING_TYPE_LABELS, MEETING_STATUS_LABELS } from '@/types/generalMeetings';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AppointmentCard } from './AppointmentCard';
import { MeetingCard } from './MeetingCard';
import { formatCurrency } from '@/lib/currency';

interface TimeGridViewProps {
  selectedDate: Date;
  appointments: MedicalAppointmentWithRelations[];
  meetings: GeneralMeeting[];
  onDateChange: (date: Date) => void;
  onAppointmentClick?: (appointment: MedicalAppointmentWithRelations) => void;
  onMeetingClick?: (meeting: GeneralMeeting) => void;
  onMeetingCancel?: (meeting: GeneralMeeting) => void;
  onMeetingDelete?: (meeting: GeneralMeeting) => void;
  onMeetingCompleted?: (meeting: GeneralMeeting) => void;
  onSlotClick?: (startTime: Date, endTime: Date) => void;
  onCreateAppointment?: () => void;
  onCreateMeeting?: () => void;
}

interface TimeSlot {
  hour: number;
  minute: number;
  time: Date;
}


export function TimeGridView({
  selectedDate,
  appointments,
  meetings,
  onDateChange,
  onAppointmentClick,
  onMeetingClick,
  onMeetingCancel,
  onMeetingDelete,
  onMeetingCompleted,
  onSlotClick,
  onCreateAppointment,
  onCreateMeeting,
}: TimeGridViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Gerar slots de 30 minutos das 07:00 às 20:00
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0);

    for (let hour = 7; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(baseDate);
        time.setHours(hour, minute, 0, 0);
        slots.push({ hour, minute, time });
      }
    }
    return slots;
  }, [selectedDate]);

  // Filtrar eventos do dia selecionado
  const dayEvents = useMemo(() => {
    const dayAppointments = appointments.filter((appt) => {
      try {
        return isSameDay(parseISO(appt.start_time), selectedDate);
      } catch {
        return false;
      }
    });

    const dayMeetings = meetings.filter((meeting) => {
      try {
        return isSameDay(parseISO(meeting.start_time), selectedDate);
      } catch {
        return false;
      }
    });

    return { appointments: dayAppointments, meetings: dayMeetings };
  }, [appointments, meetings, selectedDate]);

  // Calcular posições dos eventos (em pixels absolutos)
  const eventPositions = useMemo(() => {
    const positions: Array<{
      event: MedicalAppointmentWithRelations | GeneralMeeting;
      type: 'appointment' | 'meeting';
      start: Date;
      end: Date;
      topPx: number; // Posição em pixels do topo
      heightPx: number; // Altura em pixels
    }> = [];
    
    const dayStart = setHours(setMinutes(selectedDate, 0), 7);
    const dayEnd = setHours(setMinutes(selectedDate, 0), 20);
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
    const slotHeight = 60; // Altura de cada slot em pixels (minHeight)
    const totalHeight = timeSlots.length * slotHeight;

    // Processar consultas médicas
    dayEvents.appointments.forEach((appt) => {
      try {
        const start = parseISO(appt.start_time);
        const end = parseISO(appt.end_time);
        const startMinutes = (start.getTime() - dayStart.getTime()) / (1000 * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        positions.push({
          event: appt,
          type: 'appointment',
          start,
          end,
          topPx: (startMinutes / totalMinutes) * totalHeight,
          heightPx: (durationMinutes / totalMinutes) * totalHeight,
        });
      } catch {
        // Ignore invalid dates
      }
    });

    // Processar reuniões
    dayEvents.meetings.forEach((meeting) => {
      try {
        const start = parseISO(meeting.start_time);
        const end = parseISO(meeting.end_time);
        const startMinutes = (start.getTime() - dayStart.getTime()) / (1000 * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        positions.push({
          event: meeting,
          type: 'meeting',
          start,
          end,
          topPx: (startMinutes / totalMinutes) * totalHeight,
          heightPx: (durationMinutes / totalMinutes) * totalHeight,
        });
      } catch {
        // Ignore invalid dates
      }
    });

    // Ordenar por horário de início
    return positions.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [dayEvents, selectedDate, timeSlots]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleSlotClick = (slot: TimeSlot) => {
    const startTime = slot.time;
    const endTime = addMinutes(startTime, 30);
    setSelectedSlot({ start: startTime, end: endTime });
    onSlotClick?.(startTime, endTime);
  };

  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardContent className="p-6">
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{capitalizedDate}</h3>
              <Button variant="outline" size="sm" onClick={handleToday} className="h-7 text-xs mt-1">
                Hoje
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Botões de ação rápida */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateAppointment}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateMeeting}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Reunião
          </Button>
        </div>

        {/* Grid de horas */}
        <div className="relative border rounded-lg overflow-hidden">
          {/* Container relativo para slots e eventos */}
          <div className="relative" style={{ minHeight: `${timeSlots.length * 60}px` }}>
            {/* Linhas de hora (slots) */}
            {timeSlots.map((slot, index) => {
              const hasEvent = eventPositions.some(
                (pos) => {
                  const slotStart = slot.time.getTime();
                  const slotEnd = addMinutes(slot.time, 30).getTime();
                  return (
                    (pos.start.getTime() < slotEnd && pos.end.getTime() > slotStart)
                  );
                }
              );

              return (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className={cn(
                    'relative border-b border-border/50',
                    'hover:bg-accent/30 transition-colors cursor-pointer',
                    hasEvent && 'bg-primary/5'
                  )}
                  style={{ 
                    minHeight: '60px',
                    height: '60px',
                  }}
                  onClick={() => handleSlotClick(slot)}
                >
                  {/* Label da hora */}
                  <div className="absolute left-0 top-0 px-3 py-1 text-xs font-medium text-muted-foreground w-20 h-full flex items-center">
                    {format(slot.time, 'HH:mm')}
                  </div>
                </div>
              );
            })}

            {/* Container absoluto para eventos - renderizado uma vez sobre todos os slots */}
            <div className="absolute inset-0 ml-20 pr-4 pointer-events-none">
              {eventPositions.map((pos, idx) => {
                const isAppointment = pos.type === 'appointment';
                const event = pos.event as MedicalAppointmentWithRelations | GeneralMeeting;
                const appointment = isAppointment ? (event as MedicalAppointmentWithRelations) : null;
                const meeting = !isAppointment ? (event as GeneralMeeting) : null;

                // Calcular duração em minutos para determinar o layout
                const durationMinutes = (pos.end.getTime() - pos.start.getTime()) / (1000 * 60);
                const eventHeight = Math.max(pos.heightPx, 60);
                const isShortEvent = durationMinutes <= 30; // Eventos de 30 minutos ou menos
                const isVeryShortEvent = durationMinutes <= 15; // Eventos de 15 minutos ou menos

                return (
                  <div
                    key={`${pos.type}-${event.id}-${idx}`}
                    className={cn(
                      'absolute rounded-lg shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md pointer-events-auto',
                      'flex flex-col justify-center overflow-hidden',
                      isAppointment
                        ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100'
                        : 'bg-orange-500/10 border-orange-500 text-orange-900 dark:text-orange-100'
                    )}
                    style={{
                      top: `${pos.topPx}px`,
                      height: `${eventHeight}px`,
                      left: '0',
                      right: '0',
                      width: '100%',
                      padding: isVeryShortEvent ? '4px 6px' : isShortEvent ? '6px 8px' : '8px 10px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAppointment) {
                        onAppointmentClick?.(event as MedicalAppointmentWithRelations);
                      } else {
                        onMeetingClick?.(event as GeneralMeeting);
                      }
                    }}
                  >
                    {/* Primeira linha: Título e Horário lado a lado */}
                    <div className={cn(
                      'flex items-center justify-between gap-2 w-full mb-0.5',
                      isVeryShortEvent ? 'text-[10px]' : isShortEvent ? 'text-xs' : 'text-sm'
                    )}>
                      <div className="font-semibold truncate flex-1 min-w-0">
                        {isAppointment ? appointment?.title : meeting?.title}
                      </div>
                      <div className="font-medium opacity-90 whitespace-nowrap flex-shrink-0">
                        {format(pos.start, 'HH:mm')} - {format(pos.end, 'HH:mm')}
                      </div>
                    </div>

                    {/* Segunda linha: Detalhes lado a lado */}
                    {isAppointment && appointment ? (
                      <div className={cn(
                        'flex items-center gap-2 w-full flex-wrap',
                        isVeryShortEvent ? 'text-[9px]' : isShortEvent ? 'text-[10px]' : 'text-[10px]',
                        'opacity-85'
                      )}>
                        {/* Tipo de consulta */}
                        {appointment.appointment_type && (
                          <div className="truncate flex-shrink-0">
                            {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
                          </div>
                        )}
                        {/* Separador */}
                        {appointment.appointment_type && (appointment.contact?.full_name || appointment.status || appointment.estimated_value) && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Paciente */}
                        {appointment.contact?.full_name && (
                          <div className="truncate flex-1 min-w-0 font-medium">
                            👤 {appointment.contact.full_name}
                          </div>
                        )}
                        {/* Separador */}
                        {appointment.contact?.full_name && (appointment.status || appointment.estimated_value) && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Status */}
                        {appointment.status && (
                          <div className="truncate flex-shrink-0">
                            {APPOINTMENT_STATUS_LABELS[appointment.status]}
                          </div>
                        )}
                        {/* Separador */}
                        {appointment.status && appointment.estimated_value && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Valor estimado */}
                        {appointment.estimated_value && (
                          <div className="truncate flex-shrink-0 font-medium">
                            💰 {formatCurrency(appointment.estimated_value)}
                          </div>
                        )}
                        {/* Badge de pagamento antecipado */}
                        {appointment.paid_in_advance && (
                          <>
                            {appointment.estimated_value && (
                              <span className="opacity-50">•</span>
                            )}
                            <div className="truncate flex-shrink-0 text-green-500 font-semibold">
                              ✓ Pago
                            </div>
                          </>
                        )}
                      </div>
                    ) : meeting ? (
                      <div className={cn(
                        'flex items-center gap-2 w-full flex-wrap',
                        isVeryShortEvent ? 'text-[9px]' : isShortEvent ? 'text-[10px]' : 'text-[10px]',
                        'opacity-85'
                      )}>
                        {/* Tipo de reunião */}
                        {meeting.meeting_type && (
                          <div className="truncate flex-shrink-0">
                            {MEETING_TYPE_LABELS[meeting.meeting_type]}
                          </div>
                        )}
                        {/* Separador */}
                        {meeting.meeting_type && (meeting.location || meeting.attendees?.length || meeting.status || meeting.is_busy) && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Localização */}
                        {meeting.location && (
                          <div className="truncate flex-1 min-w-0">
                            📍 {meeting.location}
                          </div>
                        )}
                        {/* Separador */}
                        {meeting.location && (meeting.attendees?.length || meeting.status || meeting.is_busy) && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Participantes */}
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <div className="truncate flex-shrink-0">
                            👥 {meeting.attendees.length} {meeting.attendees.length === 1 ? 'participante' : 'participantes'}
                          </div>
                        )}
                        {/* Separador */}
                        {meeting.attendees?.length && (meeting.status || meeting.is_busy) && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Status */}
                        {meeting.status && (
                          <div className="truncate flex-shrink-0">
                            {MEETING_STATUS_LABELS[meeting.status]}
                          </div>
                        )}
                        {/* Separador */}
                        {meeting.status && meeting.is_busy && (
                          <span className="opacity-50">•</span>
                        )}
                        {/* Indisponível */}
                        {meeting.is_busy && (
                          <div className="truncate flex-shrink-0 font-medium text-orange-600 dark:text-orange-400">
                            ⏰ Indisponível
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista de eventos do dia (alternativa compacta) */}
        {(dayEvents.appointments.length > 0 || dayEvents.meetings.length > 0) && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Eventos do Dia</h4>
            <div className="space-y-2">
              {dayEvents.appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onEdit={() => onAppointmentClick?.(appt)}
                />
              ))}
              {dayEvents.meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={() => onMeetingClick?.(meeting)}
                  onCancel={() => onMeetingCancel?.(meeting)}
                  onDelete={() => onMeetingDelete?.(meeting)}
                  onMarkCompleted={() => onMeetingCompleted?.(meeting)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

