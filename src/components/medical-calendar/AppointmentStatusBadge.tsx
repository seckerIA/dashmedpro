import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { appointmentStatusColors } from '@/lib/design-tokens';
import { AppointmentStatus, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_ICONS } from '@/types/medicalAppointments';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Status descriptions for tooltips
const APPOINTMENT_STATUS_DESCRIPTIONS: Record<AppointmentStatus, string> = {
  agendado: 'Consulta agendada, aguardando confirmação do paciente',
  confirmado: 'Paciente confirmou presença na consulta',
  em_atendimento: 'Consulta em andamento',
  atendido: 'Consulta realizada com sucesso',
  cancelado: 'Consulta foi cancelada',
  nao_compareceu: 'Paciente não compareceu à consulta',
  remarcado: 'Consulta foi remarcada para outra data',
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function AppointmentStatusBadge({
  status,
  showIcon = false,
  showTooltip = true,
  size = 'default',
  className,
}: AppointmentStatusBadgeProps) {
  const colors = appointmentStatusColors[status];
  const Icon = APPOINTMENT_STATUS_ICONS[status];

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium transition-colors',
        size === 'sm' && 'text-[10px] h-5 px-1.5',
        size === 'default' && 'text-xs h-6 px-2',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{APPOINTMENT_STATUS_DESCRIPTIONS[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Get status description for external use
 */
export function getStatusDescription(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_DESCRIPTIONS[status] || '';
}
