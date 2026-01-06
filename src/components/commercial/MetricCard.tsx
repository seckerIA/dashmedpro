import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, BarChart3, UserPlus, Calendar, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number | undefined | null;
  icon: "trending-up" | "target" | "dollar-sign" | "bar-chart" | "user-plus" | "calendar";
  format?: "currency" | "number" | "percentage";
  isLoading?: boolean;
}

const iconMap = {
  "trending-up": TrendingUp,
  "target": Target,
  "dollar-sign": DollarSign,
  "bar-chart": BarChart3,
  "user-plus": UserPlus,
  "calendar": Calendar,
};

export function MetricCard({ title, value, icon, format = "number", isLoading }: MetricCardProps) {
  const Icon = iconMap[icon];

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
        <CardContent className="p-5 flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground truncate tracking-wide">{title}</p>
            <motion.p
              className="text-2xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? (
                <span className="inline-block w-24 h-8 animate-pulse bg-muted rounded" />
              ) : formatValue(value)}
            </motion.p>
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
