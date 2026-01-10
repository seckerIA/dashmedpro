/**
 * SmartAlerts - Alertas inteligentes colapsáveis
 * 
 * Exibe máximo 3 alertas prioritários com base nos gargalos identificados.
 * Substitui os múltiplos cards de gargalos por uma interface limpa.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useBottleneckMetrics, Bottleneck } from "@/hooks/useBottleneckMetrics";
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ArrowRight,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SmartAlertsProps {
    className?: string;
    maxVisible?: number;
}

export function SmartAlerts({ className, maxVisible = 3 }: SmartAlertsProps) {
    const navigate = useNavigate();
    const { data, isLoading } = useBottleneckMetrics();
    const [isOpen, setIsOpen] = useState(false);

    const bottlenecks = data?.bottlenecks || [];
    const summary = data?.summary || { critical: 0, attention: 0, minor: 0, healthScore: 100 };

    const visibleAlerts = bottlenecks.slice(0, maxVisible);
    const hiddenAlerts = bottlenecks.slice(maxVisible);
    const hasMore = hiddenAlerts.length > 0;

    const getSeverityConfig = (severity: Bottleneck["severity"]) => {
        switch (severity) {
            case "high":
                return {
                    icon: XCircle,
                    color: "text-red-600",
                    bgColor: "bg-red-500/10",
                    borderColor: "border-red-500/30",
                    label: "Crítico"
                };
            case "medium":
                return {
                    icon: AlertCircle,
                    color: "text-yellow-600",
                    bgColor: "bg-yellow-500/10",
                    borderColor: "border-yellow-500/30",
                    label: "Atenção"
                };
            default:
                return {
                    icon: Bell,
                    color: "text-blue-600",
                    bgColor: "bg-blue-500/10",
                    borderColor: "border-blue-500/30",
                    label: "Info"
                };
        }
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    if (isLoading) {
        return (
            <Card className={cn("bg-card border-border", className)}>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Se não há alertas, mostrar estado positivo
    if (bottlenecks.length === 0) {
        return (
            <Card className={cn("bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30", className)}>
                <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/20">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-green-700 dark:text-green-400">
                                Tudo certo! ✓
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Nenhum problema identificado no momento
                            </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            Score: {summary.healthScore}/100
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("bg-card border-border", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <CardTitle className="text-base">Ações Recomendadas</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {bottlenecks.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getHealthScoreColor(summary.healthScore))}>
                            Score: {summary.healthScore}/100
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    {/* Alertas Visíveis */}
                    <div className="space-y-2">
                        {visibleAlerts.map((alert, index) => {
                            const config = getSeverityConfig(alert.severity);
                            const Icon = config.icon;

                            return (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                        config.bgColor,
                                        config.borderColor,
                                        "hover:shadow-sm cursor-pointer"
                                    )}
                                    onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                                >
                                    <div className={cn("p-1.5 rounded-md", config.bgColor)}>
                                        <Icon className={cn("h-4 w-4", config.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={cn("font-medium text-sm", config.color)}>
                                                {alert.title}
                                            </p>
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                {alert.currentValue}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {alert.suggestion}
                                        </p>
                                    </div>
                                    {alert.actionUrl && (
                                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Alertas Ocultos */}
                    {hasMore && (
                        <>
                            <CollapsibleContent className="space-y-2 mt-2">
                                {hiddenAlerts.map((alert) => {
                                    const config = getSeverityConfig(alert.severity);
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={alert.id}
                                            className={cn(
                                                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                                config.bgColor,
                                                config.borderColor,
                                                "hover:shadow-sm cursor-pointer"
                                            )}
                                            onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                                        >
                                            <div className={cn("p-1.5 rounded-md", config.bgColor)}>
                                                <Icon className={cn("h-4 w-4", config.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className={cn("font-medium text-sm", config.color)}>
                                                        {alert.title}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                        {alert.currentValue}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {alert.suggestion}
                                                </p>
                                            </div>
                                            {alert.actionUrl && (
                                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                    );
                                })}
                            </CollapsibleContent>

                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-3 text-muted-foreground hover:text-foreground"
                                >
                                    {isOpen ? (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-1" />
                                            Mostrar menos
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-4 w-4 mr-1" />
                                            Ver mais {hiddenAlerts.length} alertas
                                        </>
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </>
                    )}
                </Collapsible>
            </CardContent>
        </Card>
    );
}

export default SmartAlerts;
