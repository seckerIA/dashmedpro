import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrendIndicator({ 
  value, 
  label, 
  showIcon = true,
  size = "md",
  className 
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const absValue = Math.abs(value);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showIcon && (
        <>
          {isPositive && (
            <ArrowUpRight className={cn(
              iconSizes[size],
              "text-green-600 dark:text-green-400"
            )} />
          )}
          {!isPositive && !isNeutral && (
            <ArrowDownRight className={cn(
              iconSizes[size],
              "text-red-600 dark:text-red-400"
            )} />
          )}
          {isNeutral && (
            <Minus className={cn(
              iconSizes[size],
              "text-muted-foreground"
            )} />
          )}
        </>
      )}
      <span className={cn(
        "font-semibold",
        sizeClasses[size],
        isPositive && "text-green-600 dark:text-green-400",
        !isPositive && !isNeutral && "text-red-600 dark:text-red-400",
        isNeutral && "text-muted-foreground"
      )}>
        {isPositive ? '+' : ''}{absValue.toFixed(1)}%
      </span>
      {label && (
        <span className={cn("text-muted-foreground", sizeClasses[size])}>
          {label}
        </span>
      )}
    </div>
  );
}


