import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell, LabelList } from "recharts";
import { getGradient, CHART_COLORS } from "@/lib/chart-colors";
import { EnhancedTooltip } from "@/components/charts/EnhancedTooltip";

export function RevenueDistributionCard() {
  const { metrics, isLoading } = useCommercialMetrics();

  if (isLoading || !metrics?.revenueByProcedure || metrics.revenueByProcedure.length === 0) {
    return null;
  }

  const totalRevenue = metrics.revenueByProcedure.reduce(
    (sum, p) => sum + Number(p.value || 0), 
    0
  );

  if (totalRevenue === 0) return null;

  // Ordenar por valor
  const sortedProcedures = [...metrics.revenueByProcedure]
    .map(p => ({
      name: p.name,
      value: Number(p.value || 0),
      percentage: (Number(p.value || 0) / totalRevenue) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  const topProcedure = sortedProcedures[0];
  const concentration = topProcedure.percentage;

  // Alerta se concentração > 80%
  const hasAlert = concentration > 80;
  const severity = concentration > 90 ? "high" : "medium";

  return (
    <Card className={cn(
      "border-2",
      hasAlert && severity === "high" && "bg-red-500/10 border-red-500/30",
      hasAlert && severity === "medium" && "bg-yellow-500/10 border-yellow-500/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-lg",
              hasAlert && severity === "high" && "bg-red-500/20",
              hasAlert && severity === "medium" && "bg-yellow-500/20",
              !hasAlert && "bg-blue-500/20"
            )}>
              {hasAlert ? (
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  severity === "high" && "text-red-600 dark:text-red-400",
                  severity === "medium" && "text-yellow-600 dark:text-yellow-400"
                )} />
              ) : (
                <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                Distribuição de Receita
              </CardTitle>
              {hasAlert && (
                <Badge 
                  variant={severity === "high" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {severity === "high" ? "Alta Concentração" : "Atenção"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasAlert && (
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm font-semibold text-foreground mb-1">
              ⚠️ Receita Muito Concentrada
            </div>
            <div className="text-xs text-muted-foreground">
              {concentration.toFixed(1)}% da receita vem de apenas um procedimento ({topProcedure.name}).
              Considere diversificar sua oferta.
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sortedProcedures.slice(0, 5).map((procedure, index) => {
            const gradient = getGradient(index);
            const barWidth = (procedure.value / totalRevenue) * 100;

            return (
              <div key={procedure.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate flex-1 min-w-0">
                    {procedure.name}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {procedure.percentage.toFixed(1)}%
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {formatCurrency(procedure.value)}
                    </span>
                  </div>
                </div>
                <div className="relative h-6 bg-muted/50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{ 
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {sortedProcedures.length > 5 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            +{sortedProcedures.length - 5} outros procedimentos
          </div>
        )}

        {hasAlert && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Sugestões:</div>
            <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
              <li>Invista em marketing para outros procedimentos</li>
              <li>Ofereça pacotes combinados</li>
              <li>Desenvolva novos serviços complementares</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}







