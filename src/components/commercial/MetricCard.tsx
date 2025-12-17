import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, BarChart3, UserPlus, Calendar, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

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
      return `${val}%`;
    }
    
    return val.toLocaleString("pt-BR");
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Icon className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">
            {isLoading ? "..." : formatValue(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

