import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { EventInput, EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { AppointmentEventCard } from './AppointmentEventCard';
import { Loader2 } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FullCalendarViewProps {
  appointments: MedicalAppointmentWithRelations[];
  view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  onEventClick: (appointment: MedicalAppointmentWithRelations) => void;
  onEventDrop: (appointmentId: string, newStart: Date, newEnd: Date) => void;
  onDateSelect: (start: Date, end: Date) => void;
  isLoading: boolean;
  currentDate?: Date;
}

export function FullCalendarView({
  appointments,
  view,
  onEventClick,
  onEventDrop,
  onDateSelect,
  isLoading,
  currentDate,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const isMobile = useIsMobile();

  // Transform appointments to FullCalendar events
  const transformToEvents = (appts: MedicalAppointmentWithRelations[]): EventInput[] => {
    return appts.map((appt) => ({
      id: appt.id,
      title: appt.title,
      start: appt.start_time,
      end: appt.end_time,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      classNames: ['custom-event-card'],
      extendedProps: {
        appointmentType: appt.appointment_type || 'first_visit',
        status: appt.status || 'scheduled',
        paymentStatus: appt.payment_status || 'pending',
        patientName: appt.contact?.full_name || 'Sem paciente',
        patientPhone: appt.contact?.phone,
        fullData: appt,
      },
    }));
  };

  const events = transformToEvents(appointments);

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = clickInfo.event.extendedProps.fullData as MedicalAppointmentWithRelations;
    onEventClick(appointment);
  };

  // Handle event drop (drag-and-drop)
  const handleEventDrop = (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const appointmentId = event.id;
    const newStart = event.start!;
    const newEnd = event.end!;

    onEventDrop(appointmentId, newStart, newEnd);
  };

  // Handle event resize
  const handleEventResize = (resizeInfo: any) => {
    const { event } = resizeInfo;
    const appointmentId = event.id;
    const newStart = event.start!;
    const newEnd = event.end!;

    onEventDrop(appointmentId, newStart, newEnd);
  };

  // Handle date selection (click to create)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo;
    onDateSelect(start, end);
  };

  // Update calendar view when props change
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && currentDate) {
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      // On mobile, use listWeek instead of timeGridWeek for better readability
      const effectiveView = isMobile && view === 'timeGridWeek' ? 'listWeek' : view;
      calendarApi.changeView(effectiveView);
    }
  }, [view, isMobile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] md:h-[600px] border border-border rounded-2xl bg-card">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl bg-card p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile && view === 'timeGridWeek' ? 'listWeek' : view}
        headerToolbar={false} // Using custom toolbar
        height="auto"
        locale={ptBrLocale}
        timeZone="America/Sao_Paulo"

        // Time slots configuration
        slotDuration="00:15:00" // 15-minute slots
        slotLabelInterval="01:00" // Hour labels
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}

        // Interaction
        editable={true} // Enable drag-and-drop
        selectable={true} // Enable click to create
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}

        // Events
        events={events}
        eventContent={(arg) => <AppointmentEventCard eventInfo={arg} />}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        select={handleDateSelect}

        // Styling
        nowIndicator={true}

        // View configurations
        views={{
          timeGridDay: {
            dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' },
          },
          timeGridWeek: {
            dayHeaderFormat: { weekday: 'short', day: 'numeric' },
          },
          dayGridMonth: {
            dayMaxEvents: 3,
          },
        }}
      />
    </div>
  );
}
