import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, BarChart3, UserPlus, Calendar, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
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

  const formatValue = (val: string | number): string => {
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
      <Card className="bg-gradient-card shadow-card border-border transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-4 flex items-center gap-4">
          <motion.div 
            className="p-3 rounded-full bg-primary/10"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Icon className="h-6 w-6 text-primary" />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <motion.p 
              className="text-2xl font-bold text-card-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? "..." : formatValue(value)}
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
