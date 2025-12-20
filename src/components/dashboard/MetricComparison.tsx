import { Card, CardContent } from "@/components/ui/card";
import { TrendIndicator } from "@/components/shared/TrendIndicator";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MetricComparisonProps {
  title: string;
  current: number;
  previous: number;
  format?: "currency" | "number" | "percentage";
  className?: string;
}

export function MetricComparison({ 
  title, 
  current, 
  previous, 
  format = "number",
  className 
}: MetricComparisonProps) {
  const change = previous !== 0 
    ? ((current - previous) / previous) * 100 
    : current > 0 ? 100 : 0;

  const formatValue = (value: number): string => {
    if (format === "currency") {
      return formatCurrency(value);
    }
    if (format === "percentage") {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <Card className={cn("bg-gradient-card shadow-card border-border", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatValue(current)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Período atual
              </div>
            </div>
            
            <TrendIndicator 
              value={change}
              size="sm"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Período anterior:</span>
              <span className="font-semibold text-foreground">
                {formatValue(previous)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


