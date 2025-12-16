import { EventContentArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appointmentColors } from '@/lib/design-tokens';
import { AppointmentType, AppointmentStatus, APPOINTMENT_STATUS_ICONS } from '@/types/medicalAppointments';
import { useTheme } from 'next-themes';

interface AppointmentEventCardProps {
  eventInfo: EventContentArg;
}

export function AppointmentEventCard({ eventInfo }: AppointmentEventCardProps) {
  const { theme } = useTheme();
  const { event } = eventInfo;

  const appointmentType = event.extendedProps.appointmentType as AppointmentType;
  const status = event.extendedProps.status as AppointmentStatus;
  const patientName = event.extendedProps.patientName as string;

  // Get colors based on theme with fallback
  const isDark = theme === 'dark';
  const typeColors = (appointmentType && appointmentType in appointmentColors) 
    ? appointmentColors[appointmentType] 
    : appointmentColors.first_visit;
  
  // Defensive: ensure typeColors has the expected structure
  const themeKey = isDark ? 'dark' : 'light';
  const colors = typeColors?.[themeKey] || typeColors?.light || appointmentColors.first_visit.light;

  // Get status icon with fallback
  const validStatus = (status && status in APPOINTMENT_STATUS_ICONS) ? status : 'scheduled';
  const StatusIcon = APPOINTMENT_STATUS_ICONS[validStatus];

  return (
    <div
      className={cn(
        'w-full h-full px-2 py-1 rounded-r-md flex flex-col overflow-hidden leading-tight',
        'transition-all duration-200 hover:brightness-95 cursor-pointer',
        colors.bg,
        colors.border,
        'border-l-4'
      )}
    >
      {/* Header: Time and Status Icon */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <Clock className={cn('w-3 h-3', colors.icon)} />
          <span className={cn('text-[10px] font-bold', colors.text)}>
            {event.start ? format(event.start, 'HH:mm') : ''}
          </span>
        </div>
        {StatusIcon && <StatusIcon className={cn('w-3 h-3', colors.icon)} />}
      </div>

      {/* Patient Name */}
      <div className={cn('font-bold text-xs truncate', colors.text)}>
        {patientName || 'Sem paciente'}
      </div>
    </div>
  );
}
