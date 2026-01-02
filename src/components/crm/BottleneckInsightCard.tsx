
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, ArrowRight } from "lucide-react";
import { BottleneckMetric } from "@/hooks/useTeamMetrics";
import { cn } from "@/lib/utils";

interface BottleneckInsightCardProps {
    bottleneck?: BottleneckMetric;
    isLoading?: boolean;
}

export function BottleneckInsightCard({ bottleneck, isLoading }: BottleneckInsightCardProps) {
    if (isLoading) return null;
    if (!bottleneck) return null;

    const isCritical = bottleneck.isCritical; // Drop > 50%

    return (
        <Card className={cn(
            "border-l-4 shadow-sm",
            isCritical
                ? "bg-red-950/20 border-l-red-500 border-y-red-900/20 border-r-red-900/20"
                : "bg-orange-950/20 border-l-orange-500 border-y-orange-900/20 border-r-orange-900/20"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-full", isCritical ? "bg-red-500/10" : "bg-orange-500/10")}>
                            <AlertTriangle className={cn("h-5 w-5", isCritical ? "text-red-500" : "text-orange-500")} />
                        </div>
                        <CardTitle className="text-base font-semibold">Gargalo no Funil de Conversão</CardTitle>
                    </div>
                    {isCritical && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/20">
                            Crítico
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground">Etapa com maior perda:</span>
                        <span className="font-bold text-foreground">{bottleneck.stage}</span>
                    </div>

                    {/* Visualização de Fluxo */}
                    <div className="bg-background/40 p-4 rounded-lg flex items-center justify-between border border-border/50">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Etapa Anterior</p>
                            <p className="text-lg font-bold">{bottleneck.previousStageCount} <span className="text-xs font-normal text-muted-foreground">(100.0%)</span></p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Etapa Atual</p>
                            <p className="text-lg font-bold">{bottleneck.currentStageCount} <span className="text-xs font-normal text-muted-foreground">({(100 - bottleneck.dropOffRate).toFixed(1)}%)</span></p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Taxa de conversão:</span>
                            <span className="font-mono font-medium">{(100 - bottleneck.dropOffRate).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Queda:</span>
                            <span className={cn("font-bold font-mono", isCritical ? "text-red-500" : "text-orange-500")}>
                                {bottleneck.dropOffRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/30">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Sugestões:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            <li>Revise o processo de qualificação nesta etapa</li>
                            <li>Melhore o acompanhamento e follow-up</li>
                            <li>Considere ajustar a proposta ou abordagem</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
