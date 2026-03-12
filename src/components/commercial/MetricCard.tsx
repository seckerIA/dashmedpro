import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  BarChart3, 
  UserPlus, 
  Calendar, 
  Loader2,
  Percent,
  Clock,
  UserCheck,
  Calculator,
  Zap,
  LucideIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type IconType = 
  | "trending-up" 
  | "target" 
  | "dollar-sign" 
  | "bar-chart" 
  | "user-plus" 
  | "calendar"
  | "percent"
  | "clock"
  | "user-check"
  | "calculator"
  | "zap";

interface MetricCardProps {
  title: string;
  value: string | number | undefined | null;
  icon: IconType;
  format?: "currency" | "number" | "percentage";
  isLoading?: boolean;
  comparison?: {
    value: number;
    label: string;
  };
}

const iconMap: Record<IconType, LucideIcon> = {
  "trending-up": TrendingUp,
  "target": Target,
  "dollar-sign": DollarSign,
  "bar-chart": BarChart3,
  "user-plus": UserPlus,
  "calendar": Calendar,
  "percent": Percent,
  "clock": Clock,
  "user-check": UserCheck,
  "calculator": Calculator,
  "zap": Zap,
};

export function MetricCard({ title, value, icon, format = "number", isLoading, comparison }: MetricCardProps) {
  const Icon = iconMap[icon] || DollarSign;

  const formatValue = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return "-";
    if (typeof val === "string") return val;

    if (format === "currency") {
      return formatCurrency(val);
    }

    if (format === "percentage") {
      return `${typeof val === 'number' ? val.toFixed(2) : val}%`;
    }

    return val.toLocaleString("pt-BR");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20 hover:from-background hover:to-muted/30 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-5 flex items-center justify-between gap-4 relative z-10 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate tracking-wide">{title}</p>
            <motion.p
              className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate tabular-nums"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? (
                <span className="inline-block w-24 h-8 animate-pulse bg-muted rounded" />
              ) : formatValue(value)}
            </motion.p>
            {comparison && comparison.value !== 0 && (
              <p className={cn(
                "text-xs",
                comparison.value > 0 ? "text-green-500" : "text-red-500"
              )}>
                {comparison.value > 0 ? "+" : ""}{comparison.value.toFixed(1)}% {comparison.label}
              </p>
            )}
          </div>

          <motion.div
            className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Icon className="h-5 w-5 text-primary" />
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
