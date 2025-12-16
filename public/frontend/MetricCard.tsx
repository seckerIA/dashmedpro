import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardVariant, designTokens } from '@/lib/design-tokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  variant: CardVariant;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  illustration?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  variant,
  icon: Icon,
  trend,
  illustration,
  className,
}: MetricCardProps) {
  const variantStyles = designTokens.cardVariants[variant];
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-2xl',
        variantStyles.bg,
        variantStyles.shadow,
        'group cursor-pointer',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className={cn(
            'text-sm font-medium mb-2',
            variant === 'yellow' ? 'text-gray-900' : 'text-white/90'
          )}>
            {title}
          </p>

          {/* Value */}
          <h3 className={cn(
            'text-3xl font-bold mb-3 transition-transform duration-300 group-hover:scale-105',
            variant === 'yellow' ? 'text-gray-900' : 'text-white'
          )}>
            {value}
          </h3>

          {/* Trend */}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg',
              variant === 'yellow' ? 'bg-white/20 text-gray-900' : 'bg-white/10 text-white'
            )}>
              <span className={cn(
                'font-semibold',
                isPositive ? 'text-green-300' : 'text-red-300'
              )}>
                {isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="opacity-80">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Icon or Illustration */}
        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            'p-3 rounded-xl transition-all duration-300',
            'group-hover:scale-110 group-hover:rotate-6',
            variant === 'yellow' ? 'bg-white/20' : 'bg-white/10'
          )}>
            <Icon className={cn(
              'h-6 w-6',
              variant === 'yellow' ? 'text-gray-900' : 'text-white'
            )} />
          </div>

          {illustration && (
            <img
              src={illustration}
              alt={title}
              className="h-24 w-24 object-contain opacity-90 transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </div>
      </div>

      {/* Animated shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </div>
  );
}

// Quick Action Card variant
interface QuickActionCardProps {
  title: string;
  description: string;
  variant: CardVariant;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  variant,
  icon: Icon,
  onClick,
  className,
}: QuickActionCardProps) {
  const variantStyles = designTokens.cardVariants[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl',
        'bg-card border border-border',
        'group',
        className
      )}
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-lg',
          variantStyles.bg,
          'transition-transform duration-300 group-hover:scale-110'
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
