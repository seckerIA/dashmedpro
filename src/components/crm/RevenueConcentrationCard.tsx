
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { ConcentrationMetric } from "@/hooks/useTeamMetrics";
import { cn } from "@/lib/utils";

interface RevenueConcentrationCardProps {
    concentration?: ConcentrationMetric;
    isLoading?: boolean;
}

export function RevenueConcentrationCard({ concentration, isLoading }: RevenueConcentrationCardProps) {
    if (isLoading) return null;
    if (!concentration || concentration.totalRevenue === 0) return null;

    // Se não for alto risco, mostramos uma versão mais "positiva" ou nem mostramos
    // O usuário pediu "análise de gargalos", então talvez só mostre se for relevante (> 50%?)
    if (concentration.topSourcePercentage < 50) return null;

    const isCritical = concentration.isHighRisk; // > 80%

    return (
        <Card className={cn(
            "border-l-4 shadow-sm",
            isCritical
                ? "bg-red-950/20 border-l-red-500 border-y-red-900/20 border-r-red-900/20"
                : "bg-yellow-950/20 border-l-yellow-500 border-y-yellow-900/20 border-r-yellow-900/20"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-full", isCritical ? "bg-red-500/10" : "bg-yellow-500/10")}>
                            <AlertTriangle className={cn("h-5 w-5", isCritical ? "text-red-500" : "text-yellow-500")} />
                        </div>
                        <CardTitle className="text-base font-semibold">Distribuição de Receita</CardTitle>
                    </div>
                    {isCritical && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/20">
                            Alta Concentração
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-background/40 p-3 rounded-lg border border-border/50">
                        <h4 className={cn("font-medium mb-1 flex items-center gap-2", isCritical ? "text-red-400" : "text-yellow-400")}>
                            {isCritical ? "⚠️ Receita Muito Concentrada" : "⚠️ Atenção à Diversificação"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">{concentration.topSourcePercentage.toFixed(1)}%</span> da receita vem de apenas uma fonte principal (<strong>{concentration.topSource}</strong>).
                            Considere diversificar sua oferta.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>{concentration.topSource}</span>
                            <div className="flex gap-2">
                                <span>{concentration.topSourcePercentage.toFixed(1)}%</span>
                                <span className="text-muted-foreground">({formatCurrency(concentration.topSourceValue)})</span>
                            </div>
                        </div>
                        <Progress
                            value={concentration.topSourcePercentage}
                            className={cn("h-2.5", isCritical ? "[&>div]:bg-red-500/80" : "[&>div]:bg-yellow-500/80")}
                        />
                    </div>

                    <div className="pt-2 border-t border-border/30">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Sugestões:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>Invista em marketing para outros procedimentos</li>
                            <li>Ofereça pacotes combinados para aumentar mix de produtos</li>
                            <li>Desenvolva novos serviços complementares</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
