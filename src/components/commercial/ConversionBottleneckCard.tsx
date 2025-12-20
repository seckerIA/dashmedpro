import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { cn } from "@/lib/utils";

export function ConversionBottleneckCard() {
  const { metrics, isLoading } = useCommercialMetrics();

  if (isLoading || !metrics?.funnelData || metrics.funnelData.length < 2) {
    return null;
  }

  // Identificar etapa com maior perda
  let maxDrop = 0;
  let bottleneckStage = "";
  let bottleneckIndex = -1;

  for (let i = 1; i < metrics.funnelData.length; i++) {
    const prevStage = metrics.funnelData[i - 1];
    const currentStage = metrics.funnelData[i];
    const drop = prevStage.percentage - currentStage.percentage;

    if (drop > maxDrop) {
      maxDrop = drop;
      bottleneckStage = currentStage.stage;
      bottleneckIndex = i;
    }
  }

  // Se não há gargalo significativo (>30% de queda), não mostrar
  if (maxDrop < 30) {
    return null;
  }

  const bottleneck = metrics.funnelData[bottleneckIndex];
  const prevStage = metrics.funnelData[bottleneckIndex - 1];
  const conversionRate = prevStage.count > 0 
    ? ((bottleneck.count / prevStage.count) * 100).toFixed(1)
    : "0.0";

  const severity = maxDrop > 50 ? "high" : maxDrop > 40 ? "medium" : "low";

  return (
    <Card className={cn(
      "border-2",
      severity === "high" && "bg-red-500/10 border-red-500/30",
      severity === "medium" && "bg-yellow-500/10 border-yellow-500/30",
      severity === "low" && "bg-blue-500/10 border-blue-500/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            severity === "high" && "bg-red-500/20",
            severity === "medium" && "bg-yellow-500/20",
            severity === "low" && "bg-blue-500/20"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5",
              severity === "high" && "text-red-600 dark:text-red-400",
              severity === "medium" && "text-yellow-600 dark:text-yellow-400",
              severity === "low" && "text-blue-600 dark:text-blue-400"
            )} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-foreground mb-1">
              Gargalo no Funil de Conversão
            </CardTitle>
            <Badge 
              variant={severity === "high" ? "destructive" : severity === "medium" ? "default" : "secondary"}
              className="text-xs"
            >
              {severity === "high" ? "Crítico" : severity === "medium" ? "Atenção" : "Moderado"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Etapa com maior perda:</span>
            <span className="font-bold text-foreground">{bottleneckStage}</span>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Etapa Anterior</div>
              <div className="font-semibold text-foreground">
                {prevStage.count.toLocaleString('pt-BR')} ({prevStage.percentage.toFixed(1)}%)
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-right">
              <div className="text-xs text-muted-foreground mb-1">Etapa Atual</div>
              <div className="font-semibold text-foreground">
                {bottleneck.count.toLocaleString('pt-BR')} ({bottleneck.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Taxa de conversão:</span>
            <span className={cn(
              "font-bold",
              Number(conversionRate) < 50 ? "text-red-600 dark:text-red-400" : "text-foreground"
            )}>
              {conversionRate}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Queda:</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {maxDrop.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Sugestões:</div>
          <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
            <li>Revise o processo de qualificação nesta etapa</li>
            <li>Melhore o acompanhamento e follow-up</li>
            <li>Considere ajustar a proposta ou abordagem</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

