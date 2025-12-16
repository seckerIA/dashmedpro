import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { appointmentStatusColors } from '@/lib/design-tokens';
import { AppointmentStatus, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_ICONS } from '@/types/medicalAppointments';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  showIcon?: boolean;
  className?: string;
}

export function AppointmentStatusBadge({
  status,
  showIcon = false,
  className,
}: AppointmentStatusBadgeProps) {
  const colors = appointmentStatusColors[status];
  const Icon = APPOINTMENT_STATUS_ICONS[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
