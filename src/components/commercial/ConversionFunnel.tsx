import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/chart-colors";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface ConversionFunnelProps {
  data: FunnelStage[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  // Identificar gargalos (queda > 30% entre etapas)
  const bottlenecks = useMemo(() => {
    const bottlenecks: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const prevPercentage = data[i - 1].percentage;
      const currentPercentage = data[i].percentage;
      const drop = prevPercentage - currentPercentage;
      if (drop > 30) {
        bottlenecks.push(i);
      }
    }
    return bottlenecks;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">📊 Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {data.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          const isBottleneck = bottlenecks.includes(index);
          const gradient = CHART_COLORS.funnel[index % CHART_COLORS.funnel.length];
          const prevStage = index > 0 ? data[index - 1] : null;
          const conversionRate = prevStage 
            ? ((stage.count / prevStage.count) * 100).toFixed(1)
            : '100.0';
          const drop = prevStage 
            ? (prevStage.percentage - stage.percentage).toFixed(1)
            : '0.0';
          
          return (
            <Tooltip key={stage.stage}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "space-y-3 p-3 rounded-lg transition-all cursor-pointer",
                  isBottleneck && "bg-red-500/10 border border-red-500/30",
                  "hover:bg-muted/50"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm sm:text-base">
                        {stage.stage}
                      </span>
                      {isBottleneck && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">
                          {stage.count.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof stage.percentage === 'number' ? stage.percentage.toFixed(1) : stage.percentage}% do total
                        </div>
                      </div>
                      {prevStage && (
                        <div className="text-right min-w-[60px]">
                          <div className={cn(
                            "text-xs font-semibold flex items-center gap-1",
                            Number(drop) > 30 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                          )}>
                            {Number(drop) > 30 && <TrendingDown className="h-3 w-3" />}
                            {conversionRate}% conversão
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {drop}% queda
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative h-10 bg-muted/50 rounded-xl overflow-hidden border border-border/50">
                    <div
                      className={cn(
                        "h-full transition-all duration-700 ease-out rounded-xl relative",
                        "shadow-lg"
                      )}
                      style={{ 
                        width: `${widthPercentage}%`,
                        background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`
                      }}
                    />
                    {/* Indicador de gargalo */}
                    {isBottleneck && (
                      <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl animate-pulse" />
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <div className="space-y-2">
                  <div className="font-semibold">{stage.stage}</div>
                  <div className="text-sm space-y-1">
                    <div>Quantidade: <span className="font-bold">{stage.count.toLocaleString('pt-BR')}</span></div>
                    <div>Percentual: <span className="font-bold">{typeof stage.percentage === 'number' ? stage.percentage.toFixed(1) : stage.percentage}%</span></div>
                    {prevStage && (
                      <>
                        <div>Taxa de conversão: <span className="font-bold">{conversionRate}%</span></div>
                        <div>Queda em relação à etapa anterior: <span className="font-bold text-red-500">{drop}%</span></div>
                      </>
                    )}
                    {isBottleneck && (
                      <div className="mt-2 pt-2 border-t border-border text-red-500 font-semibold">
                        ⚠️ Gargalo identificado: Alta perda nesta etapa
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
