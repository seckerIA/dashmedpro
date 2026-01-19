import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface VisionMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  variant?: "purple" | "cyan" | "orange" | "green" | "blue" | "pink";
  className?: string;
}

export function VisionMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "blue",
  className,
}: VisionMetricCardProps) {

  // Mapping variants to our new CSS variables/classes
  const variants = {
    purple: {
      border: "border-l-4 border-l-sky-500", // Fallback to Blue
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      trendUp: "text-sky-600",
    },
    cyan: {
      border: "border-l-4 border-l-cyan-500",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      trendUp: "text-cyan-600",
    },
    orange: {
      border: "border-l-4 border-l-sky-500", // Fallback to Blue
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      trendUp: "text-sky-600",
    },
    green: {
      border: "border-l-4 border-l-emerald-500",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trendUp: "text-emerald-600",
    },
    blue: {
      border: "border-l-4 border-l-sky-500",
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      trendUp: "text-sky-600",
    },
    pink: {
      border: "border-l-4 border-l-sky-500", // Fallback to Blue
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      trendUp: "text-sky-600",
    },
  };

  const style = variants[variant] || variants.blue;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "bg-card text-card-foreground border border-border/50", // Cleaner base
        style.border,
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-xl transition-colors", style.iconBg)}>
            <Icon className={cn("w-6 h-6", style.iconColor)} />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
              trend.direction === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                trend.direction === "down" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "•"} {trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{value}</h2>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 font-normal">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
