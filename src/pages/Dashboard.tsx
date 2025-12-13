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
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { useUserProfile } from "@/hooks/useUserProfile"
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
  Coins
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

const Dashboard = () => {
  const navigate = useNavigate();
  const { isVendedor } = useUserProfile();
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const { metrics: financialMetrics } = useFinancialMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
    <div className="min-h-screen space-y-6 bg-background">
      {/* Header Section - Nexus Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nexus CRM</h1>
            <p className="text-sm text-muted-foreground">Buscar por cliente, empresa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate('/financeiro/nova-transacao')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Top Metrics - Nexus Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold text-positive">{formatCurrency(financialMetrics?.totalBalance || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CreditCard className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">financeiro</span>
                </div>
              </div>
              <div className="p-3 bg-positive/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-positive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-chart-1">{formatCurrency(financialMetrics?.monthRevenue || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">entradas</span>
                </div>
              </div>
              <div className="p-3 bg-chart-1/10 rounded-xl">
                <ArrowUpRight className="w-5 h-5 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold text-negative">{formatCurrency(financialMetrics?.monthExpenses || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownLeft className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">saídas</span>
                </div>
              </div>
              <div className="p-3 bg-negative/10 rounded-xl">
                <ArrowDownLeft className="w-5 h-5 text-negative" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro do Mês</p>
                <p className="text-2xl font-bold text-info">{formatCurrency(financialMetrics?.monthNetProfit || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{financialMetrics?.netProfitMargin?.toFixed(1) || '0'}% margem</span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <Activity className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Fechado</p>
                <p className="text-2xl font-bold text-positive">{formatCurrency(metrics?.totalClosedValue || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{metrics?.wonDeals || 0} contratos</span>
                </div>
              </div>
              <div className="p-3 bg-positive/10 rounded-xl">
                <Target className="w-5 h-5 text-positive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor em Pipeline</p>
                <p className="text-2xl font-bold text-chart-1">{formatCurrency(metrics?.totalPipelineValue || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{metrics?.activeDeals || 0} ativos</span>
                </div>
              </div>
              <div className="p-3 bg-chart-1/10 rounded-xl">
                <PieChart className="w-5 h-5 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Contatos</p>
                <p className="text-2xl font-bold text-warning">{metrics?.totalContacts || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">cadastrados</span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <Users className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-info">{metrics?.conversionRate.toFixed(1) || '0.0'}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{metrics?.wonDeals || 0} ganhos</span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil Section */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Valores e Conversão do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Lead Novo</p>
              <p className="text-xl font-bold text-foreground">{metrics?.dealsByStage.lead_novo?.count || 0} negócios</p>
              <p className="text-sm text-positive">{formatCurrency(metrics?.dealsByStage.lead_novo?.value || 0)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Qualificado</p>
              <p className="text-xl font-bold text-foreground">{metrics?.dealsByStage.qualificado?.count || 0} negócios</p>
              <p className="text-sm text-positive">{formatCurrency(metrics?.dealsByStage.qualificado?.value || 0)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Apresentação</p>
              <p className="text-xl font-bold text-foreground">{metrics?.dealsByStage.apresentacao?.count || 0} negócios</p>
              <p className="text-sm text-positive">{formatCurrency(metrics?.dealsByStage.apresentacao?.value || 0)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cliente Fechado</p>
              <p className="text-xl font-bold text-foreground">{metrics?.dealsByStage.fechado_ganho?.count || 0} negócios</p>
              <p className="text-sm text-positive">{formatCurrency(metrics?.dealsByStage.fechado_ganho?.value || 0)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cliente Perdido</p>
              <p className="text-xl font-bold text-foreground">{metrics?.dealsByStage.fechado_perdido?.count || 0} negócios</p>
              <p className="text-sm text-negative">{formatCurrency(metrics?.dealsByStage.fechado_perdido?.value || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Leads Gerados no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsChart data={metrics?.monthlyLeads} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Faturamento Projetado vs. Fechado</CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
                <span className="text-muted-foreground">Faturamento Projetado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                <span className="text-muted-foreground">Faturamento Fechado</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={metrics?.monthlyRevenue} />
          </CardContent>
        </Card>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Serviços de Interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <ServicesChart data={metrics?.servicesInterest} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Taxa de Conversão por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionChart data={metrics?.conversionByStage} />
          </CardContent>
        </Card>
      </div>

      {/* Business Cards Section - Últimos Deals Atualizados */}
      {metrics && metrics.recentDeals && metrics.recentDeals.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Últimas Atualizações do Pipeline</CardTitle>
            <CardDescription>Os 5 deals mais recentes ou atualizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        {deal.value && (
                          <p className="text-lg font-bold text-positive">{formatCurrency(deal.value)}</p>
                        )}
                        {stageInfo && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${stageInfo.bgColor} ${stageInfo.textColor} border-primary/20`}
                          >
                            {stageInfo.label}
                          </Badge>
                        )}
                        {deal.contact?.service && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {deal.contact.service}
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

      {/* Agenda Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksWidget />
        <UpcomingCallsWidget />
      </div>
    </div>
  )
}

// Novo componente: Dashboard do Vendedor (sem dados financeiros sensíveis)
const VendedorDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando suas métricas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Desempenho</h1>
            <p className="text-sm text-muted-foreground">Acompanhe suas metas e resultados</p>
          </div>
        </div>
      </div>

      {/* Métricas do Vendedor - APENAS SUAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Meu Pipeline */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meu Pipeline</p>
                <p className="text-2xl font-bold text-chart-1">
                  {metrics?.activeDeals || 0} negócios
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">ativos</span>
                </div>
              </div>
              <div className="p-3 bg-chart-1/10 rounded-xl">
                <Target className="w-5 h-5 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Negócios Fechados */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negócios Fechados</p>
                <p className="text-2xl font-bold text-positive">{metrics?.wonDeals || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">este mês</span>
                </div>
              </div>
              <div className="p-3 bg-positive/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-positive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-info">{metrics?.conversionRate.toFixed(1) || '0.0'}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">desempenho</span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total de Contatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meus Contatos</p>
                <p className="text-2xl font-bold text-warning">{metrics?.totalContacts || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">cadastrados</span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-xl">
                <Users className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Novo */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lead Novo</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.dealsByStage.lead_novo?.count || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">negócios</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualificado */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualificado</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.dealsByStage.qualificado?.count || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">negócios</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apresentação */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Apresentação</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.dealsByStage.apresentacao?.count || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">negócios</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minhas Tarefas e Compromissos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksWidget />
        <UpcomingCallsWidget />
      </div>

      {/* Meus Leads Recentes */}
      {metrics && metrics.recentDeals && metrics.recentDeals.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Minhas Últimas Atualizações</CardTitle>
            <CardDescription>Seus 5 negócios mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        {deal.contact?.service && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {deal.contact.service}
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

      {/* Acesso rápido ao CRM */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/crm')}
              className="flex flex-col items-center justify-center p-6 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border transition-all hover:scale-105 hover:shadow-lg"
            >
              <div className="p-3 bg-blue-500/10 rounded-xl mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground">CRM</span>
            </button>
            <button
              onClick={() => navigate('/tarefas')}
              className="flex flex-col items-center justify-center p-6 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border transition-all hover:scale-105 hover:shadow-lg"
            >
              <div className="p-3 bg-purple-500/10 rounded-xl mb-3">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Tarefas</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex flex-col items-center justify-center p-6 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border transition-all hover:scale-105 hover:shadow-lg"
            >
              <div className="p-3 bg-orange-500/10 rounded-xl mb-3">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Calendário</span>
            </button>
            <button
              onClick={() => navigate('/comercial/guia-prospeccao')}
              className="flex flex-col items-center justify-center p-6 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border transition-all hover:scale-105 hover:shadow-lg"
            >
              <div className="p-3 bg-green-500/10 rounded-xl mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Prospecção</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard