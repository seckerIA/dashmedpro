import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PIPELINE_STAGES } from "@/types/crm"
import { TodayTasksWidget } from "@/components/tasks/TodayTasksWidget"
import { UpcomingCallsWidget } from "@/components/calendar/UpcomingCallsWidget"
import { LeadsChart } from "@/components/charts/LeadsChart"
import { RevenueChart } from "@/components/charts/RevenueChart"
import { ServicesChart } from "@/components/charts/ServicesChart"
import { ConversionChart } from "@/components/charts/ConversionChart"
import { TicketMedioChart } from "@/components/charts/TicketMedioChart"
import { ReceitaDespesasChart } from "@/components/charts/ReceitaDespesasChart"
import { TreatmentEvolutionChart } from "@/components/charts/TreatmentEvolutionChart"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useBottleneckMetrics } from "@/hooks/useBottleneckMetrics"
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics"
import { MetricCard, QuickActionCard } from "@/components/dashboard/MetricCard"
import { PipelineFunnelCard } from "@/components/dashboard/PipelineFunnelCard"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { StatsPanel } from "@/components/dashboard/StatsPanel"
import { CustomerTable } from "@/components/dashboard/CustomerTable"
import { OverdueAppointmentsAlert } from "@/components/shared/OverdueAppointmentsAlert"
import { BottleneckCard } from "@/components/dashboard/BottleneckCard"
import { AttendanceMetricsCard } from "@/components/medical-calendar/AttendanceMetricsCard"
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper"
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard"
import { 
  Calculator, 
  TrendingUp, 
  PieChart, 
  Users, 
  Target, 
  BarChart3,
  DollarSign,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  CreditCard,
  Activity,
  Zap,
  Plus,
  Calendar,
  Gift,
  RefreshCw,
  Filter,
  Eye,
  Coins,
  AlertTriangle
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { formatCurrency } from "@/lib/currency"
import { getContactService } from "@/lib/crm"

const Dashboard = () => {
  const navigate = useNavigate();
  const { isVendedor, isSecretaria } = useUserProfile();
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const { data: enhancedMetrics } = useEnhancedDashboardMetrics();
  const { metrics: financialMetrics } = useFinancialMetrics();
  const { data: bottlenecks, isLoading: isLoadingBottlenecks } = useBottleneckMetrics();

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

  // Dashboard completo para Admin/Dono
  return (
    <div className="min-h-screen space-y-4 sm:space-y-6 lg:space-y-8 bg-background font-sans px-3 sm:px-4 lg:px-6">

      {/* Overdue Appointments Alert */}
      <OverdueAppointmentsAlert />

      {/* Gargalos Identificados */}
      {!isLoadingBottlenecks && bottlenecks && bottlenecks.length > 0 && (
        <AnimatedWrapper animationType="slideDown" delay={0.1}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Gargalos Identificados
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bottlenecks.slice(0, 6).map((bottleneck, index) => (
                <AnimatedWrapper key={bottleneck.id} animationType="slideUp" delay={0.15 + index * 0.05}>
                  <BottleneckCard bottleneck={bottleneck} />
                </AnimatedWrapper>
              ))}
            </div>
          </div>
        </AnimatedWrapper>
      )}

      {/* Top Metrics - Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in">
        <MetricCard
          title="Saldo Total"
          value={formatCurrency(financialMetrics?.totalBalance || 0)}
          variant="green"
          icon={DollarSign}
          trend={{
            value: financialMetrics?.profitMargin || 0,
            label: "margem bruta"
          }}
        />

        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(financialMetrics?.monthRevenue || 0)}
          variant="red"
          icon={ArrowUpRight}
          trend={{
            value: 0,
            label: "entradas"
          }}
        />

        <MetricCard
          title="Despesas do Mês"
          value={formatCurrency(financialMetrics?.monthExpenses || 0)}
          variant="cyan"
          icon={ArrowDownLeft}
          trend={{
            value: 0,
            label: "saídas"
          }}
        />

        <MetricCard
          title="Lucro do Mês"
          value={formatCurrency(financialMetrics?.monthNetProfit || 0)}
          variant="yellow"
          icon={Activity}
          trend={{
            value: financialMetrics?.netProfitMargin || 0,
            label: "margem líquida"
          }}
        />
      </div>

      {/* CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in animation-delay-200">
        <MetricCard
          title="Valor Total Fechado"
          value={formatCurrency(metrics?.totalClosedValue || 0)}
          variant="green"
          icon={Target}
          trend={{
            value: metrics?.wonDeals || 0,
            label: `${metrics?.wonDeals || 0} contratos ganhos`
          }}
        />

        <MetricCard
          title="Valor em Pipeline"
          value={formatCurrency(metrics?.totalPipelineValue || 0)}
          variant="red"
          icon={PieChart}
          trend={{
            value: metrics?.activeDeals || 0,
            label: `${metrics?.activeDeals || 0} negócios ativos`
          }}
        />

        <MetricCard
          title="Total de Contatos"
          value={metrics?.totalContacts || 0}
          variant="yellow"
          icon={Users}
          trend={{
            value: 0,
            label: "contatos cadastrados"
          }}
        />

        <MetricCard
          title="Taxa de Conversão"
          value={`${(metrics?.conversionRate ?? 0).toFixed(2)}%`}
          variant="cyan"
          icon={TrendingUp}
          trend={{
            value: metrics?.wonDeals || 0,
            label: `${metrics?.wonDeals || 0} negócios ganhos`
          }}
        />
      </div>

      {/* Enhanced Metrics - Novas métricas adicionais */}
      {enhancedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in animation-delay-300">
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(enhancedMetrics.averageDealValue || 0)}
            variant="purple"
            icon={Coins}
            trend={{
              value: 0,
              label: "valor médio por negócio"
            }}
          />

          <MetricCard
            title="Tempo Médio no Pipeline"
            value={`${Math.round(enhancedMetrics.averagePipelineTime || 0)} dias`}
            variant="cyan"
            icon={RefreshCw}
            trend={{
              value: 0,
              label: "da criação ao fechamento"
            }}
          />

          <MetricCard
            title="Pacientes em Tratamento"
            value={enhancedMetrics.activeTreatments || 0}
            variant="green"
            icon={Activity}
            trend={{
              value: 0,
              label: "em tratamento ativo"
            }}
          />

          <MetricCard
            title="Taxa de Inadimplência"
            value={`${(enhancedMetrics.defaultRate || 0).toFixed(1)}%`}
            variant="red"
            icon={AlertTriangle}
            trend={{
              value: 0,
              label: "negócios inadimplentes"
            }}
          />
        </div>
      )}

      {/* Consultas do Mês */}
      {enhancedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in animation-delay-400">
          <MetricCard
            title="Consultas Agendadas"
            value={enhancedMetrics.appointmentsThisMonth || 0}
            variant="cyan"
            icon={Calendar}
            trend={{
              value: 0,
              label: "neste mês"
            }}
          />

          <MetricCard
            title="Consultas Realizadas"
            value={enhancedMetrics.completedAppointmentsThisMonth || 0}
            variant="green"
            icon={Activity}
            trend={{
              value: enhancedMetrics.appointmentCompletionRate || 0,
              label: `${(enhancedMetrics.appointmentCompletionRate || 0).toFixed(1)}% de conclusão`
            }}
          />

          <MetricCard
            title="Follow-ups Pendentes"
            value={enhancedMetrics.pendingFollowUps || 0}
            variant="yellow"
            icon={Bell}
            trend={{
              value: 0,
              label: "ações necessárias"
            }}
          />
        </div>
      )}

      {/* Funil Section */}
      <PipelineFunnelCard
        dealsByStage={metrics?.dealsByStage || {}}
        formatCurrency={formatCurrency}
      />

      {/* Charts Section - Novo Layout com SalesChart + StatsPanel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* Coluna Esquerda (2/3 width) - Gráficos */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Novo: SalesChart */}
          <SalesChart
            data={metrics?.monthlyRevenue.map(m => ({
              name: m.month,
              current: m.closed / 1000, // k format
            })) || []}
            title="Receita Fechada - Últimos 12 Meses"
          />

          {/* Manter: LeadsChart */}
          <Card className="bg-card rounded-2xl border border-border">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Novos Leads por Mês</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Evolução de novos contatos cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <LeadsChart data={metrics?.monthlyLeads} />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita (1/3 width) - Novo: StatsPanel */}
        <div>
          <StatsPanel
            distributionData={
              metrics?.servicesInterest.slice(0, 4).map((s, i) => ({
                name: s.service,
                value: Math.round((s.count / (metrics.totalContacts || 1)) * 100),
                color: ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981'][i]
              })) || []
            }
          />
        </div>
      </div>

      {/* Novos Gráficos Financeiros e de Tratamento */}
      {enhancedMetrics && (
        <>
          {/* Receita vs Despesas + Evolução de Pacientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Receita vs Despesas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Comparativo mensal de receitas e despesas</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <ReceitaDespesasChart data={enhancedMetrics.receitaDespesas} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Evolução de Pacientes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Acompanhamento de pacientes em tratamento, agendados e inadimplentes</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <TreatmentEvolutionChart data={enhancedMetrics.treatmentEvolution} />
              </CardContent>
            </Card>
          </div>

          {/* Ticket Médio por Procedimento */}
          {enhancedMetrics.averageTicketByProcedure.length > 0 && (
            <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Ticket Médio por Procedimento</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Valor médio de fechamento por tipo de procedimento</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <TicketMedioChart data={enhancedMetrics.averageTicketByProcedure} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Distribuição de Pacientes por Procedimento</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Total de pacientes interessados em cada procedimento</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <ServicesChart data={metrics?.servicesInterest} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Conversão Entre Etapas do Funil</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Percentual de conversão de uma etapa para a próxima</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <ConversionChart data={metrics?.conversionByStage} />
          </CardContent>
        </Card>
      </div>

      {/* Últimos Deals - Novo: CustomerTable */}
      {metrics && metrics.recentDeals && metrics.recentDeals.length > 0 && (
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
          title="Últimas Atualizações do Pipeline"
        />
      )}

      {/* Agenda Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <TodayTasksWidget />
        <UpcomingCallsWidget />
      </div>

      {/* Métricas de Comparecimento */}
      <AnimatedWrapper animationType="slideUp" delay={0.3}>
        <AttendanceMetricsCard />
      </AnimatedWrapper>
    </div>
  )
}

// Novo componente: Dashboard do Vendedor (sem dados financeiros sensíveis)
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
    <div className="min-h-screen space-y-4 sm:space-y-6 lg:space-y-8 bg-background font-sans px-3 sm:px-4 lg:px-6">

      {/* Métricas Principais do Vendedor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in">
        <MetricCard
          title="Pipeline Ativo"
          value={`${metrics?.activeDeals || 0} negócios`}
          variant="red"
          icon={Target}
          trend={{
            value: formatCurrency(metrics?.totalPipelineValue || 0),
            label: "valor total em pipeline"
          }}
        />
        <MetricCard
          title="Contratos Fechados"
          value={metrics?.wonDeals || 0}
          variant="green"
          icon={TrendingUp}
          trend={{
            value: formatCurrency(metrics?.totalClosedValue || 0),
            label: "valor total fechado"
          }}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${(metrics?.conversionRate ?? 0).toFixed(1)}%`}
          variant="cyan"
          icon={BarChart3}
          trend={{ value: 0, label: "de leads para fechamento" }}
        />
      </div>

      {/* Métricas de Performance */}
      {enhancedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in animation-delay-100">
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(enhancedMetrics.averageDealValue || 0)}
            variant="purple"
            icon={Coins}
            trend={{ value: 0, label: "valor médio por negócio" }}
          />
          <MetricCard
            title="Tempo Médio no Pipeline"
            value={`${Math.round(enhancedMetrics.averagePipelineTime || 0)} dias`}
            variant="cyan"
            icon={RefreshCw}
            trend={{ value: 0, label: "da criação ao fechamento" }}
          />
          <MetricCard
            title="Follow-ups Pendentes"
            value={enhancedMetrics.pendingFollowUps || 0}
            variant="yellow"
            icon={Bell}
            trend={{ value: 0, label: "ações necessárias" }}
          />
        </div>
      )}

      {/* Pipeline por Etapa */}
      <PipelineFunnelCard
        dealsByStage={metrics?.dealsByStage || {}}
        formatCurrency={formatCurrency}
      />

      {/* Gráficos de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <Card className="bg-card rounded-2xl border border-border">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Meus Leads por Mês</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Evolução dos meus contatos cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <LeadsChart data={metrics?.monthlyLeads} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Conversão Entre Etapas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Minha taxa de conversão por etapa do funil</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <ConversionChart data={metrics?.conversionByStage} />
          </CardContent>
        </Card>
      </div>

      {/* Minhas Tarefas e Compromissos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <TodayTasksWidget />
        <UpcomingCallsWidget />
      </div>

      {/* Meus Leads Recentes */}
      {metrics && metrics.recentDeals && metrics.recentDeals.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground">Minhas Últimas Atualizações</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Seus 5 negócios mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {metrics.recentDeals.map((deal) => {
                const stageInfo = PIPELINE_STAGES.find(s => s.value === deal.stage);
                return (
                  <Card key={deal.id} className="bg-muted/20 border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground line-clamp-1">{deal.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {deal.contact?.full_name || 'Sem contato'}
                          </p>
                        </div>
                        {stageInfo && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${stageInfo.bgColor} ${stageInfo.textColor} border-primary/20`}
                          >
                            {stageInfo.label}
                          </Badge>
                        )}
                        {getContactService(deal.contact) && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {getContactService(deal.contact)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* NOVO - Acesso Rápido com QuickActionCard */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <QuickActionCard
            title="CRM"
            description="Gerenciar contatos"
            variant="red"
            icon={Users}
            onClick={() => navigate('/crm')}
          />
          <QuickActionCard
            title="Tarefas"
            description="Ver tarefas"
            variant="cyan"
            icon={Target}
            onClick={() => navigate('/tarefas')}
          />
          <QuickActionCard
            title="Calendário"
            description="Ver agenda"
            variant="yellow"
            icon={Calendar}
            onClick={() => navigate('/calendar')}
          />
          <QuickActionCard
            title="Prospecção"
            description="Guia completo"
            variant="green"
            icon={TrendingUp}
            onClick={() => navigate('/comercial/guia-prospeccao')}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard
