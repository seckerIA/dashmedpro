import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CardVariant } from '@/lib/design-tokens';

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
  onClick?: () => void;
}

// Simplified to 2 alternating neutral color schemes
const getVariantColors = (variant: CardVariant) => {
  // Alternate between 2 color schemes based on variant
  // Group 1: green, red -> Scheme 1 (slate)
  // Group 2: cyan, yellow -> Scheme 2 (zinc)
  const isGroup1 = variant === 'green' || variant === 'red';
  
  if (isGroup1) {
    // Scheme 1 - Slate tones
    return {
      gradient: 'from-slate-50/30 via-slate-50/15 to-slate-50/30 dark:from-slate-900/20 dark:via-slate-900/10 dark:to-slate-900/20',
      iconColor: 'text-slate-600 dark:text-slate-400',
      borderAccent: 'from-slate-400/30 to-slate-500/30 dark:from-slate-600/30 dark:to-slate-500/30',
    };
  } else {
    // Scheme 2 - Zinc tones
    return {
      gradient: 'from-zinc-50/30 via-zinc-50/15 to-zinc-50/30 dark:from-zinc-900/20 dark:via-zinc-900/10 dark:to-zinc-900/20',
      iconColor: 'text-zinc-600 dark:text-zinc-400',
      borderAccent: 'from-zinc-400/30 to-zinc-500/30 dark:from-zinc-600/30 dark:to-zinc-500/30',
    };
  }
};

export function MetricCard({
  title,
  value,
  variant,
  icon: Icon,
  trend,
  illustration,
  className,
  onClick,
}: MetricCardProps) {
  const isPositive = trend && trend.value >= 0;
  const colors = getVariantColors(variant);

  const Component = onClick ? motion.button : motion.div;
  const componentProps = onClick ? {
    onClick,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...componentProps}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br text-card-foreground shadow-lg p-3 sm:p-4 lg:p-5 backdrop-blur-sm',
        'hover:shadow-xl transition-all duration-300',
        onClick && 'cursor-pointer',
        colors.gradient,
        className
      )}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <div className={cn(
            'p-2 rounded-lg bg-background/50 backdrop-blur-sm',
            'transition-transform duration-300 hover:scale-110'
          )}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', colors.iconColor)} />
          </div>
        </div>

        {/* Value */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 text-foreground">
          {value}
        </h3>

        {/* Trend */}
        {trend && (
          <div className="mt-auto">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                'font-medium',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(2)}%
              </span>
              <span className="text-muted-foreground/80">{trend.label}</span>
            </div>
          </div>
        )}

        {illustration && (
          <div className="mt-4 opacity-60">
            <img
              src={illustration}
              alt={title}
              className="h-16 w-16 object-contain"
            />
          </div>
        )}
      </div>

      {/* Subtle border accent */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
        colors.borderAccent
      )} />
    </Component>
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
  const colors = getVariantColors(variant);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br text-card-foreground shadow-lg p-3 sm:p-4 lg:p-5 backdrop-blur-sm',
        'hover:shadow-xl transition-all duration-300',
        'text-left',
        colors.gradient,
        className
      )}
    >
      <div className="relative z-10 flex items-start gap-2 sm:gap-3 lg:gap-4">
        <div className={cn(
          'p-2 sm:p-3 rounded-lg bg-background/50 backdrop-blur-sm',
          'transition-transform duration-300 hover:scale-110'
        )}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', colors.iconColor)} />
        </div>

        <div className="flex-1">
          <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Subtle border accent */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
        colors.borderAccent
      )} />
    </motion.button>
  );
}
