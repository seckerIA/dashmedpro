import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PIPELINE_STAGES } from "@/types/crm"
import { TodayTasksWidget } from "@/components/tasks/TodayTasksWidget"
import { UpcomingCallsWidget } from "@/components/calendar/UpcomingCallsWidget"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics"
import { QuickActionCard } from "@/components/dashboard/MetricCard"
import { PipelineFunnelCard } from "@/components/dashboard/PipelineFunnelCard"
import { CustomerTable } from "@/components/dashboard/CustomerTable"
import { OverdueAppointmentsAlert } from "@/components/shared/OverdueAppointmentsAlert"
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper"
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard"

import { SummaryDashboard } from "@/components/dashboard/SummaryDashboard"
import { DetailedDashboard } from "@/components/dashboard/DetailedDashboard"
import { DetailedMetricsSection } from "@/components/dashboard/DetailedMetricsSection"
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection"
import { HeroMetrics } from "@/components/dashboard/HeroMetrics"
import { SmartAlerts } from "@/components/dashboard/SmartAlerts"
import { UnifiedChart } from "@/components/dashboard/UnifiedChart"
import { DashboardSkeleton } from "@/components/ui/LoadingSkeletons"

import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  Activity,
  BarChart3,
  LayoutDashboard,
  Eye
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatCurrency } from "@/lib/currency"
import { getContactService } from "@/lib/crm"

type DashboardView = "resumo" | "detalhado"

const Dashboard = () => {
  const { isVendedor, isSecretaria } = useUserProfile();
  const { isLoading, error } = useDashboardMetrics();

  // Estado para alternar entre visão resumida e detalhada (default: resumida para agilidade)
  const [dashboardView, setDashboardView] = useState<DashboardView>(() => {
    const saved = localStorage.getItem('dashboard_view');
    // Default to 'resumo' if not set, as it is cleaner for first impression
    return (saved === 'detalhado' ? 'detalhado' : 'resumo') as DashboardView;
  });

  const handleViewChange = (view: string) => {
    setDashboardView(view as DashboardView);
    localStorage.setItem('dashboard_view', view);
  };

  // Se for secretária, mostrar dashboard específico da secretária
  if (isSecretaria) {
    return <SecretaryDashboard />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10 pt-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-destructive">
          Erro ao carregar métricas: {error.message}
        </div>
      </div>
    );
  }

  // Se for vendedor, mostrar dashboard simplificado
  if (isVendedor) {
    return <VendedorDashboard />;
  }

  // Dashboard para Admin/Dono com modo de visualização distinto
  return (
    <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10">

      {/* Header com Tabs de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          {/* Título pode ser renderizado dentro dos componentes filhos se precisar ser diferente, 
             mas manter aqui ajuda na consistência da UI ao trocar de tab */}
        </div>

        {/* Tabs de Visualização - Design Pill flutuante */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 sm:relative sm:bottom-auto sm:left-auto sm:translate-x-0 sm:z-0">
          <Tabs value={dashboardView} onValueChange={handleViewChange} className="bg-background/80 backdrop-blur-md p-1 rounded-full shadow-lg border sm:bg-muted/50 sm:shadow-none sm:border-none sm:backdrop-blur-none">
            <TabsList className="bg-transparent h-9">
              <TabsTrigger
                value="resumo"
                className="rounded-full px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="detalhado"
                className="rounded-full px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Eye className="h-3.5 w-3.5 mr-2" />
                Detalhado
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Renderização Condicional Limpa - Sem mistura de lógica */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {dashboardView === 'resumo' ? (
          <SummaryDashboard />
        ) : (
          <DetailedDashboard />
        )}
      </div>

    </div>
  )
}

// Dashboard do Vendedor (simplificado)
const VendedorDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { data: enhancedMetrics } = useEnhancedDashboardMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10 pt-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10">

      {/* HERO: 3 Métricas Principais */}
      <AnimatedWrapper animationType="fadeIn" delay={0}>
        <HeroMetrics />
      </AnimatedWrapper>

      {/* Alertas */}
      <AnimatedWrapper animationType="slideUp" delay={0.1}>
        <SmartAlerts maxVisible={3} />
      </AnimatedWrapper>

      {/* Gráfico + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AnimatedWrapper animationType="slideUp" delay={0.15} className="lg:col-span-2">
          <UnifiedChart />
        </AnimatedWrapper>

        <AnimatedWrapper animationType="slideUp" delay={0.2}>
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="CRM"
                description="Contatos"
                variant="red"
                icon={Users}
                onClick={() => navigate('/comercial')}
              />
              <QuickActionCard
                title="Tarefas"
                description="Pendentes"
                variant="cyan"
                icon={Target}
                onClick={() => navigate('/tarefas')}
              />
              <QuickActionCard
                title="Calendário"
                description="Agenda"
                variant="yellow"
                icon={Calendar}
                onClick={() => navigate('/calendar')}
              />
              <QuickActionCard
                title="Prospecção"
                description="Guia"
                variant="green"
                icon={TrendingUp}
                onClick={() => navigate('/comercial/guia-prospeccao')}
              />
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Tarefas */}
      <AnimatedWrapper animationType="slideUp" delay={0.25}>
        <CollapsibleSection
          id="vendedor-tasks"
          title="Minhas Tarefas"
          icon={Target}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodayTasksWidget />
            <UpcomingCallsWidget />
          </div>
        </CollapsibleSection>
      </AnimatedWrapper>

      {/* Pipeline */}
      <AnimatedWrapper animationType="slideUp" delay={0.3}>
        <CollapsibleSection
          id="vendedor-pipeline"
          title="Meu Pipeline"
          icon={BarChart3}
          badge={metrics?.activeDeals || 0}
          defaultOpen={false}
        >
          <PipelineFunnelCard
            dealsByStage={metrics?.dealsByStage || {}}
            formatCurrency={formatCurrency}
          />
        </CollapsibleSection>
      </AnimatedWrapper>

      {/* Leads Recentes */}
      {metrics?.recentDeals && metrics.recentDeals.length > 0 && (
        <AnimatedWrapper animationType="slideUp" delay={0.35}>
          <CollapsibleSection
            id="vendedor-recent"
            title="Minhas Últimas Atualizações"
            icon={Activity}
            badge={metrics.recentDeals.length}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {metrics.recentDeals.map((deal) => {
                const stageInfo = PIPELINE_STAGES.find(s => s.value === deal.stage);
                return (
                  <Card key={deal.id} className="bg-muted/20 border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{deal.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {deal.contact?.full_name || 'Sem contato'}
                        </p>
                        {stageInfo && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${stageInfo.bgColor} ${stageInfo.textColor}`}
                          >
                            {stageInfo.label}
                          </Badge>
                        )}
                        {getContactService(deal.contact) && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {getContactService(deal.contact)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CollapsibleSection>
        </AnimatedWrapper>
      )}
    </div>
  );
};

export default Dashboard
