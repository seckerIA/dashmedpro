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

// Novos componentes simplificados
import { HeroMetrics } from "@/components/dashboard/HeroMetrics"
import { SmartAlerts } from "@/components/dashboard/SmartAlerts"
import { UnifiedChart } from "@/components/dashboard/UnifiedChart"
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection"
import { DetailedMetricsSection } from "@/components/dashboard/DetailedMetricsSection"

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
  const navigate = useNavigate();
  const { isVendedor, isSecretaria } = useUserProfile();
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const { data: enhancedMetrics } = useEnhancedDashboardMetrics();

  // Estado para alternar entre visão resumida e detalhada (default: detalhado)
  const [dashboardView, setDashboardView] = useState<DashboardView>(() => {
    const saved = localStorage.getItem('dashboard_view');
    // Se nao houver preferencia salva, usar 'detalhado' como padrao
    return (saved === 'resumo' ? 'resumo' : 'detalhado') as DashboardView;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando métricas do dashboard...</div>
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

  // Dashboard para Admin/Dono com tabs
  return (
    <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10">

      {/* Header com Tabs de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {dashboardView === 'resumo' ? 'Visão resumida' : 'Visão completa com todas as métricas'}
          </p>
        </div>

        {/* Tabs de Visualização */}
        <Tabs value={dashboardView} onValueChange={handleViewChange}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="resumo" className="gap-1.5 data-[state=active]:bg-background">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="detalhado" className="gap-1.5 data-[state=active]:bg-background">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Detalhado</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overdue Appointments Alert - mantido pois é crítico */}
      <OverdueAppointmentsAlert />

      {/* HERO: 3 Métricas Principais - sempre visível */}
      <AnimatedWrapper animationType="fadeIn" delay={0}>
        <HeroMetrics />
      </AnimatedWrapper>

      {/* Alertas Inteligentes - sempre visível */}
      <AnimatedWrapper animationType="slideUp" delay={0.1}>
        <SmartAlerts maxVisible={3} />
      </AnimatedWrapper>

      {/* Grid Principal: Gráfico Unificado + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico Unificado com Tabs */}
        <AnimatedWrapper animationType="slideUp" delay={0.15} className="lg:col-span-2">
          <UnifiedChart />
        </AnimatedWrapper>

        {/* Quick Actions */}
        <AnimatedWrapper animationType="slideUp" delay={0.2}>
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="Nova Consulta"
                description="Agendar"
                variant="red"
                icon={Calendar}
                onClick={() => navigate('/calendar')}
              />
              <QuickActionCard
                title="CRM"
                description="Leads"
                variant="cyan"
                icon={Users}
                onClick={() => navigate('/comercial')}
              />
              <QuickActionCard
                title="Financeiro"
                description="Transações"
                variant="green"
                icon={DollarSign}
                onClick={() => navigate('/financeiro')}
              />
              <QuickActionCard
                title="WhatsApp"
                description="Conversas"
                variant="yellow"
                icon={Activity}
                onClick={() => navigate('/whatsapp')}
              />
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Tarefas e Compromissos (Colapsável) */}
      <AnimatedWrapper animationType="slideUp" delay={0.25}>
        <CollapsibleSection
          id="dashboard-tasks"
          title="Tarefas e Agenda"
          icon={Target}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodayTasksWidget />
            <UpcomingCallsWidget />
          </div>
        </CollapsibleSection>
      </AnimatedWrapper>

      {/* Visao Detalhada - todas as metricas */}
      {dashboardView === 'detalhado' && (
        <AnimatedWrapper animationType="slideUp" delay={0.3}>
          <DetailedMetricsSection />
        </AnimatedWrapper>
      )}


      {/* Últimas Atualizações (Colapsável) */}
      {metrics?.recentDeals && metrics.recentDeals.length > 0 && (
        <AnimatedWrapper animationType="slideUp" delay={0.45}>
          <CollapsibleSection
            id="dashboard-recent-deals"
            title="Últimas Atualizações"
            icon={Activity}
            badge={metrics.recentDeals.length}
            defaultOpen={false}
          >
            <CustomerTable
              customers={metrics.recentDeals.map(deal => ({
                id: deal.id,
                customer: deal.contact?.full_name || 'Sem contato',
                date: new Date(deal.updated_at).toLocaleDateString('pt-BR'),
                invoicedAmount: formatCurrency(deal.value || 0),
                status: deal.stage === 'fechado_ganho' ? 'Paid' as const :
                  deal.stage === 'negociacao' ? 'Shipped' as const :
                    deal.stage === 'proposta' ? 'Delivered' as const :
                      'Pending' as const
              }))}
              title=""
            />
          </CollapsibleSection>
        </AnimatedWrapper>
      )}
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando suas métricas...</div>
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
