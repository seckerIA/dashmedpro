/**
 * HeroMetrics - Componente principal com 3 métricas essenciais por papel
 * 
 * Exibe as métricas mais importantes de forma clara e visual,
 * adaptadas ao papel do usuário (Admin/Dono, Secretária, Médico, Vendedor)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics";
import { useSecretaryMetrics } from "@/hooks/useSecretaryMetrics";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatCurrency } from "@/lib/currency";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    Users,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Activity,
    Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMetric {
    id: string;
    title: string;
    value: string | number;
    trend?: {
        direction: "up" | "down" | "stable";
        value: string;
        label: string;
    };
    status: "success" | "warning" | "danger" | "neutral";
    icon: React.ElementType;
    insight?: string;
}

interface HeroMetricsProps {
    className?: string;
}

export function HeroMetrics({ className }: HeroMetricsProps) {
    const { isSecretaria, isVendedor, isMedico, isLoading: isLoadingProfile } = useUserProfile();
    const { data: dashboardMetrics, isLoading: isLoadingDashboard } = useDashboardMetrics();
    const { metrics: financialMetrics, isLoading: isLoadingFinancial } = useFinancialMetrics();
    const { data: enhancedMetrics, isLoading: isLoadingEnhanced } = useEnhancedDashboardMetrics();
    const { data: secretaryMetrics, isLoading: isLoadingSecretary } = useSecretaryMetrics();

    const isLoading = isLoadingProfile || isLoadingDashboard || isLoadingFinancial || isLoadingEnhanced || isLoadingSecretary;

    // Definir métricas baseadas no papel do usuário
    const getMetricsForRole = (): HeroMetric[] => {
        // Secretária
        if (isSecretaria && secretaryMetrics) {
            const confirmationRate = secretaryMetrics.confirmedToday && secretaryMetrics.todayAppointments
                ? (secretaryMetrics.confirmedToday / secretaryMetrics.todayAppointments) * 100
                : 0;

            return [
                {
                    id: "agenda-today",
                    title: "Agenda Hoje",
                    value: secretaryMetrics.todayAppointments || 0,
                    status: secretaryMetrics.todayAppointments > 0 ? "success" : "neutral",
                    icon: Calendar,
                    trend: {
                        direction: "stable",
                        value: `${secretaryMetrics.confirmedToday || 0}`,
                        label: "confirmadas"
                    },
                    insight: secretaryMetrics.todayAppointments === 0
                        ? "Nenhuma consulta agendada para hoje"
                        : `${secretaryMetrics.todayAppointments} pacientes aguardam atendimento`
                },
                {
                    id: "pending",
                    title: "Aguardando Confirmação",
                    value: secretaryMetrics.pendingConfirmation || 0,
                    status: (secretaryMetrics.pendingConfirmation || 0) > 3 ? "warning" : "success",
                    icon: AlertCircle,
                    insight: (secretaryMetrics.pendingConfirmation || 0) > 0
                        ? "Pacientes precisam confirmar presença"
                        : "Todos os pacientes confirmaram! ✓"
                },
                {
                    id: "confirmation-rate",
                    title: "Taxa de Confirmação",
                    value: `${confirmationRate.toFixed(0)}%`,
                    status: confirmationRate >= 80 ? "success" : confirmationRate >= 60 ? "warning" : "danger",
                    icon: CheckCircle2,
                    insight: confirmationRate >= 80
                        ? "Excelente taxa de confirmação!"
                        : "Considere ligar para os pacientes pendentes"
                }
            ];
        }

        // Vendedor
        if (isVendedor && dashboardMetrics) {
            const conversionRate = dashboardMetrics.conversionRate || 0;
            return [
                {
                    id: "pipeline",
                    title: "Pipeline Ativo",
                    value: dashboardMetrics.activeDeals || 0,
                    status: (dashboardMetrics.activeDeals || 0) > 0 ? "success" : "warning",
                    icon: Briefcase,
                    trend: {
                        direction: "stable",
                        value: formatCurrency(dashboardMetrics.totalPipelineValue || 0),
                        label: "em negociação"
                    },
                    insight: `${dashboardMetrics.activeDeals || 0} oportunidades abertas`
                },
                {
                    id: "won-deals",
                    title: "Contratos Fechados",
                    value: dashboardMetrics.wonDeals || 0,
                    status: (dashboardMetrics.wonDeals || 0) > 0 ? "success" : "neutral",
                    icon: Target,
                    trend: {
                        direction: "up",
                        value: formatCurrency(dashboardMetrics.totalClosedValue || 0),
                        label: "valor total"
                    },
                    insight: (dashboardMetrics.wonDeals || 0) === 0
                        ? "Foco em fechar sua primeira venda!"
                        : `Parabéns! ${dashboardMetrics.wonDeals} contratos fechados`
                },
                {
                    id: "conversion",
                    title: "Taxa de Conversão",
                    value: `${conversionRate.toFixed(1)}%`,
                    status: conversionRate >= 20 ? "success" : conversionRate >= 10 ? "warning" : "danger",
                    icon: TrendingUp,
                    insight: conversionRate >= 20
                        ? "Sua conversão está acima da média!"
                        : "Revise seu processo de follow-up"
                }
            ];
        }

        // Admin/Dono/Médico (padrão)
        const monthProfit = financialMetrics?.monthNetProfit || 0;
        const profitTrend = financialMetrics?.netProfitMargin || 0;
        const newPatients = enhancedMetrics?.appointmentsThisMonth || 0;
        const conversionRate = dashboardMetrics?.conversionRate || 0;

        return [
            {
                id: "profit",
                title: "Lucro do Mês",
                value: formatCurrency(monthProfit),
                status: monthProfit > 0 ? "success" : monthProfit < 0 ? "danger" : "neutral",
                icon: DollarSign,
                trend: {
                    direction: profitTrend > 0 ? "up" : profitTrend < 0 ? "down" : "stable",
                    value: `${Math.abs(profitTrend).toFixed(1)}%`,
                    label: "margem líquida"
                },
                insight: monthProfit > 0
                    ? `Margem de ${profitTrend.toFixed(0)}% este mês`
                    : "Atenção: resultado negativo este mês"
            },
            {
                id: "patients",
                title: "Novos Pacientes",
                value: newPatients,
                status: newPatients > 10 ? "success" : newPatients > 0 ? "neutral" : "warning",
                icon: Users,
                trend: {
                    direction: newPatients > 5 ? "up" : "stable",
                    value: `${dashboardMetrics?.totalContacts || 0}`,
                    label: "total de contatos"
                },
                insight: newPatients > 0
                    ? `${newPatients} consultas agendadas este mês`
                    : "Considere ações de captação"
            },
            {
                id: "conversion",
                title: "Taxa de Conversão",
                value: `${conversionRate.toFixed(1)}%`,
                status: conversionRate >= 15 ? "success" : conversionRate >= 8 ? "warning" : "danger",
                icon: Target,
                trend: {
                    direction: conversionRate >= 15 ? "up" : "stable",
                    value: `${dashboardMetrics?.wonDeals || 0}`,
                    label: "negócios ganhos"
                },
                insight: conversionRate >= 15
                    ? "Excelente taxa de conversão!"
                    : "Há espaço para melhorar o funil"
            }
        ];
    };

    const metrics = getMetricsForRole();

    const getStatusColor = (status: HeroMetric["status"]) => {
        switch (status) {
            case "success": return "from-green-500/20 to-green-500/5 border-green-500/30";
            case "warning": return "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
            case "danger": return "from-red-500/20 to-red-500/5 border-red-500/30";
            default: return "from-primary/20 to-primary/5 border-primary/30";
        }
    };

    const getStatusIconColor = (status: HeroMetric["status"]) => {
        switch (status) {
            case "success": return "text-green-600 bg-green-500/20";
            case "warning": return "text-yellow-600 bg-yellow-500/20";
            case "danger": return "text-red-600 bg-red-500/20";
            default: return "text-primary bg-primary/20";
        }
    };

    const TrendIcon = ({ direction }: { direction: "up" | "down" | "stable" }) => {
        switch (direction) {
            case "up": return <TrendingUp className="h-3 w-3 text-green-600" />;
            case "down": return <TrendingDown className="h-3 w-3 text-red-600" />;
            default: return <Minus className="h-3 w-3 text-muted-foreground" />;
        }
    };

    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-card border-border">
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-10 w-32 mb-2" />
                            <Skeleton className="h-3 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
            {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                    <Card
                        key={metric.id}
                        className={cn(
                            "relative overflow-hidden bg-gradient-to-br border transition-all duration-300 hover:shadow-lg",
                            getStatusColor(metric.status)
                        )}
                    >
                        <CardContent className="p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={cn("p-2 rounded-lg", getStatusIconColor(metric.status))}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {metric.title}
                                    </span>
                                </div>
                                {metric.trend && (
                                    <Badge variant="outline" className="text-xs gap-1 bg-background/50">
                                        <TrendIcon direction={metric.trend.direction} />
                                        {metric.trend.value}
                                    </Badge>
                                )}
                            </div>

                            {/* Value */}
                            <div className="mb-3">
                                <p
                                    className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight truncate"
                                    title={typeof metric.value === 'string' ? metric.value : metric.value.toString()}
                                >
                                    {metric.value}
                                </p>
                                {metric.trend && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {metric.trend.label}
                                    </p>
                                )}
                            </div>

                            {/* Insight */}
                            {metric.insight && (
                                <div className="pt-3 border-t border-border/50">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        💡 {metric.insight}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export default HeroMetrics;
