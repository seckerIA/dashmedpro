/**
 * OnboardingProgress Component
 *
 * Displays a progress bar showing the current step in the onboarding wizard.
 * Features animated segments with primary/blue gradient.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS } from '@/types/onboarding';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  className,
}: OnboardingProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep - 1;

          return (
            <motion.div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                isCompleted || isCurrent
                  ? 'bg-gradient-to-r from-primary to-blue-500'
                  : 'bg-muted'
              )}
              initial={{ scaleX: 0.3, opacity: 0.5 }}
              animate={{
                scaleX: isCompleted || isCurrent ? 1 : 0.3,
                opacity: isCompleted || isCurrent ? 1 : 0.5,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: 'left' }}
            />
          );
        })}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Passo {currentStep} de {totalSteps}
        </span>
        <span className="text-muted-foreground">
          {ONBOARDING_STEPS[currentStep - 1]?.title}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version for mobile
 */
export function OnboardingProgressCompact({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}
