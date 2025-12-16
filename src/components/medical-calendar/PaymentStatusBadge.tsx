import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { paymentStatusColors } from '@/lib/design-tokens';
import { PaymentStatus, PAYMENT_STATUS_LABELS } from '@/types/medicalAppointments';
import { DollarSign } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  showIcon?: boolean;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  showIcon = false,
  className,
}: PaymentStatusBadgeProps) {
  const colors = paymentStatusColors[status];

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
      {showIcon && <DollarSign className="h-3 w-3" />}
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
