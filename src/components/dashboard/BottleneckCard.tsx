import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

export interface Bottleneck {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  metric: string;
  currentValue: number | string;
  threshold: number | string;
  suggestion?: string;
  impact?: string;
}

interface BottleneckCardProps {
  bottleneck: Bottleneck;
  onActionClick?: () => void;
}

const severityConfig = {
  high: {
    color: "destructive",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: AlertTriangle,
  },
  medium: {
    color: "default",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: AlertCircle,
  },
  low: {
    color: "secondary",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: TrendingDown,
  },
};

export function BottleneckCard({ bottleneck, onActionClick }: BottleneckCardProps) {
  const config = severityConfig[bottleneck.severity];
  const Icon = config.icon;

  const formatValue = (value: number | string): string => {
    if (typeof value === "string") return value;
    if (value > 1000) return formatCurrency(value);
    return value.toLocaleString("pt-BR");
  };

  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-lg",
      config.bgColor,
      config.borderColor
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-lg",
              bottleneck.severity === "high" && "bg-red-500/20",
              bottleneck.severity === "medium" && "bg-yellow-500/20",
              bottleneck.severity === "low" && "bg-blue-500/20"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                bottleneck.severity === "high" && "text-red-600 dark:text-red-400",
                bottleneck.severity === "medium" && "text-yellow-600 dark:text-yellow-400",
                bottleneck.severity === "low" && "text-blue-600 dark:text-blue-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                {bottleneck.title}
              </CardTitle>
              <Badge 
                variant={config.color as any}
                className="text-xs"
              >
                {bottleneck.severity === "high" ? "Alto" : 
                 bottleneck.severity === "medium" ? "Médio" : "Baixo"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor Atual:</span>
            <span className="font-bold text-foreground">
              {formatValue(bottleneck.currentValue)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta/Threshold:</span>
            <span className="font-semibold text-muted-foreground">
              {formatValue(bottleneck.threshold)}
            </span>
          </div>
        </div>

        {bottleneck.impact && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Impacto:</p>
            <p className="text-sm text-foreground">{bottleneck.impact}</p>
          </div>
        )}

        {bottleneck.suggestion && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Sugestão:</p>
                <p className="text-sm text-foreground">{bottleneck.suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}







