import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, BarChart3, UserPlus, Calendar, Loader2, TrendingDown, Percent, Clock, Calculator, UserCheck, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: "trending-up" | "target" | "dollar-sign" | "bar-chart" | "user-plus" | "calendar" | "percent" | "clock" | "calculator" | "user-check" | "zap";
  format?: "currency" | "number" | "percentage";
  isLoading?: boolean;
  comparison?: {
    value: number;
    label?: string;
  };
}

const iconMap = {
  "trending-up": TrendingUp,
  "target": Target,
  "dollar-sign": DollarSign,
  "bar-chart": BarChart3,
  "user-plus": UserPlus,
  "calendar": Calendar,
  "percent": Percent,
  "clock": Clock,
  "calculator": Calculator,
  "user-check": UserCheck,
  "zap": Zap,
};

export function MetricCard({ title, value, icon, format = "number", isLoading, comparison }: MetricCardProps) {
  const Icon = iconMap[icon];

  const formatValue = (val: string | number): string => {
    if (typeof val === "string") return val;
    
    if (format === "currency") {
      return formatCurrency(val);
    }
    
    if (format === "percentage") {
      return `${val.toFixed(1)}%`;
    }
    
    return val.toLocaleString("pt-BR");
  };

  const getTrendIcon = () => {
    if (!comparison || comparison.value === 0) return null;
    if (comparison.value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const getTrendColor = () => {
    if (!comparison || comparison.value === 0) return "text-muted-foreground";
    if (comparison.value > 0) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Icon className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
        <p className="text-2xl font-bold text-card-foreground mb-2">
          {isLoading ? "..." : formatValue(value)}
        </p>
        {comparison && (
          <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
            {getTrendIcon()}
            <span>
              {comparison.value > 0 ? '+' : ''}{comparison.value.toFixed(1)}%
              {comparison.label && ` ${comparison.label}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






