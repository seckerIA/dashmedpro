import { useUserProfile } from "@/hooks/useUserProfile";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics";
import { useSecretaryMetrics } from "@/hooks/useSecretaryMetrics";
import { formatCurrency } from "@/lib/currency";
import {
    TrendingUp,
    DollarSign,
    Users,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    Activity
} from "lucide-react";
import { VisionMetricCard } from "./VisionMetricCard";
import { Skeleton } from "@/components/ui/skeleton";

export function VisionHeroMetrics() {
    const { isSecretaria, isVendedor, isLoading: isLoadingProfile } = useUserProfile();
    const { data: dashboardMetrics, isLoading: isLoadingDashboard } = useDashboardMetrics();
    const { metrics: financialMetrics, isLoading: isLoadingFinancial } = useFinancialMetrics();
    const { data: enhancedMetrics, isLoading: isLoadingEnhanced } = useEnhancedDashboardMetrics();
    const { data: secretaryMetrics, isLoading: isLoadingSecretary } = useSecretaryMetrics();

    const isLoading = isLoadingProfile || isLoadingDashboard || isLoadingFinancial || isLoadingEnhanced || isLoadingSecretary;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    // Secretária
    if (isSecretaria && secretaryMetrics) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <VisionMetricCard
                    title="Agenda Hoje"
                    value={secretaryMetrics.todayAppointments || 0}
                    icon={Calendar}
                    variant="purple"
                    description={`${secretaryMetrics.confirmedToday || 0} confirmadas`}
                    trend={{ value: "Hoje", direction: "neutral" }}
                />
                <VisionMetricCard
                    title="Confirmações Pendentes"
                    value={secretaryMetrics.pendingConfirmation || 0}
                    icon={AlertCircle}
                    variant="orange"
                    description="Precisam de contato"
                />
                <VisionMetricCard
                    title="Taxa de Confirmação"
                    value={`${((secretaryMetrics.confirmedToday / (secretaryMetrics.todayAppointments || 1)) * 100).toFixed(0)}%`}
                    icon={CheckCircle2}
                    variant="green"
                    description="Performance diária"
                />
            </div>
        );
    }

    // Vendedor
    if (isVendedor && dashboardMetrics) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <VisionMetricCard
                    title="Pipeline Ativo"
                    value={dashboardMetrics.activeDeals || 0}
                    icon={Briefcase}
                    variant="blue"
                    description={formatCurrency(dashboardMetrics.totalPipelineValue || 0)}
                />
                <VisionMetricCard
                    title="Vendas Fechadas"
                    value={dashboardMetrics.wonDeals || 0}
                    icon={Target}
                    variant="green"
                    description={formatCurrency(dashboardMetrics.totalClosedValue || 0)}
                />
                <VisionMetricCard
                    title="Taxa de Conversão"
                    value={`${(dashboardMetrics.conversionRate || 0).toFixed(1)}%`}
                    icon={TrendingUp}
                    variant="cyan"
                    description="Média de conversão"
                />
            </div>
        );
    }

    // Admin/Dono (Default)
    const monthProfit = financialMetrics?.monthNetProfit || 0;
    const newPatients = enhancedMetrics?.appointmentsThisMonth || 0;
    const conversion = dashboardMetrics?.conversionRate || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <VisionMetricCard
                title="Lucro Líquido (Mês)"
                value={formatCurrency(monthProfit)}
                icon={DollarSign}
                variant="green"
                trend={{
                    value: `${Math.abs(financialMetrics?.netProfitMargin || 0).toFixed(1)}% margem`,
                    direction: (financialMetrics?.netProfitMargin || 0) >= 0 ? "up" : "down"
                }}
                description="Performance financeira"
            />

            <VisionMetricCard
                title="Novos Pacientes"
                value={newPatients}
                icon={Users}
                variant="blue"
                description={`${dashboardMetrics?.totalContacts || 0} total de leads`}
            />

            <VisionMetricCard
                title="Eficiência de Vendas"
                value={`${conversion.toFixed(1)}%`}
                icon={Activity}
                variant="blue"
                description="Taxa de conversão global"
            />
        </div>
    );
}
