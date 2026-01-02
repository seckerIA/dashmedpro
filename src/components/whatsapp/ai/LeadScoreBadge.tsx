/**
 * LeadScoreBadge
 * Badge visual para mostrar status de qualificação do lead
 */

import { cn } from '@/lib/utils';
import {
  Circle,
  Snowflake,
  Sun,
  Flame,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LeadStatus } from '@/types/whatsappAI';
import { LEAD_STATUS_CONFIG } from '@/types/whatsappAI';

interface LeadScoreBadgeProps {
  status: LeadStatus;
  probability?: number;
  showLabel?: boolean;
  showProbability?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const iconMap = {
  circle: Circle,
  snowflake: Snowflake,
  sun: Sun,
  flame: Flame,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
};

const sizeClasses = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

export function LeadScoreBadge({
  status,
  probability,
  showLabel = true,
  showProbability = false,
  size = 'md',
  className,
  onClick,
}: LeadScoreBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Circle;
  const sizes = sizeClasses[size];

  const badge = (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        config.bgColor,
        config.color,
        `border ${config.borderColor}`,
        sizes.badge,
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      <IconComponent className={cn(sizes.icon, 'flex-shrink-0')} />
      {showLabel && <span>{config.label}</span>}
      {showProbability && probability !== undefined && (
        <span className="opacity-75">({probability}%)</span>
      )}
    </div>
  );

  if (!showLabel && !showProbability) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>
              {config.label}
              {probability !== undefined && ` - ${probability}% de conversão`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

/**
 * LeadScoreBadgeWithAI
 * Versão com indicador de que foi analisado pela IA
 */
interface LeadScoreBadgeWithAIProps extends LeadScoreBadgeProps {
  isAnalyzing?: boolean;
  lastAnalyzedAt?: string;
}

export function LeadScoreBadgeWithAI({
  isAnalyzing,
  lastAnalyzedAt,
  ...props
}: LeadScoreBadgeWithAIProps) {
  return (
    <div className="flex items-center gap-1">
      <LeadScoreBadge {...props} />
      {isAnalyzing && (
        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
      )}
    </div>
  );
}

/**
 * LeadScoreSelector
 * Componente para selecionar status manualmente
 */
interface LeadScoreSelectorProps {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}

export function LeadScoreSelector({
  value,
  onChange,
  disabled,
}: LeadScoreSelectorProps) {
  const statuses: LeadStatus[] = ['novo', 'frio', 'morno', 'quente', 'convertido', 'perdido'];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <LeadScoreBadge
          key={status}
          status={status}
          size="sm"
          className={cn(
            'cursor-pointer transition-all',
            value === status
              ? 'ring-2 ring-offset-2 ring-primary'
              : 'opacity-60 hover:opacity-100',
            disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => !disabled && onChange(status)}
        />
      ))}
    </div>
  );
}

export default LeadScoreBadge;
