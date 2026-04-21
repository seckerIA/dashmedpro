import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  RefreshCw,

  BarChart3,
  Settings,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ExternalLink,
  Building2,
  MessageSquare,
  MoreHorizontal,
  UserCheck,
  Repeat,
} from "lucide-react";
import { useMarketingDashboard } from "@/hooks/useMarketingDashboard";
import { useSyncAdCampaigns } from "@/hooks/useAdCampaignsSync";
import { useAdPlatformConnections } from "@/hooks/useAdPlatformConnections";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { DateRange } from "react-day-picker";

export function MarketingDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: dashboardData, isLoading } = useMarketingDashboard({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });
  const { data: connections } = useAdPlatformConnections();
  const syncCampaigns = useSyncAdCampaigns();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSyncAll = async () => {
    if (!connections || connections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma conexão',
        description: 'Configure pelo menos uma conexão antes de sincronizar.',
      });
      return;
    }

    try {
      // Filter: only active ad accounts — category 'other' AND valid ad account prefix
      const activeConnections = connections.filter(c =>
        c.is_active &&
        c.account_category === 'other' &&
        !c.account_id.startsWith('bm_') &&
        !c.account_id.startsWith('waba_') &&
        !c.account_id.startsWith('page_') &&
        c.account_id !== 'meta_oauth'
      );
      for (const connection of activeConnections) {
        await syncCampaigns.mutateAsync(connection.id);
      }
      toast({
        title: 'Sincronização iniciada',
        description: `Sincronizando ${activeConnections.length} conexão(ões)...`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao sincronizar campanhas.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  // Dados para comparativo de plataformas
  const platformComparisonData = [
    { name: 'Google Ads', gasto: dashboardData.googleAdsSpend, receita: dashboardData.googleAdsRevenue },
    { name: 'Meta Ads', gasto: dashboardData.metaAdsSpend, receita: dashboardData.metaAdsRevenue },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_roas':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'no_conversions':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'budget_limit':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'low_roas' || type === 'no_conversions' ? 'destructive' : 'default';
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-border/50">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Visão Geral de Performance
          </h2>
          <p className="text-sm text-muted-foreground">Analise os KPIs de marketing no período selecionado</p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(
                "justify-start text-left font-normal w-[240px]",
                !dateRange && "text-muted-foreground"
              )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/y")} -{" "}
                      {format(dateRange.to, "dd/MM/y")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/y")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex border-b border-border">
                <div className="flex flex-col gap-2 p-3 border-r border-border min-w-[140px] bg-muted/10">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">Período</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Este mês
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 1)),
                      to: endOfMonth(subMonths(new Date(), 1))
                    })}
                  >
                    Mês passado
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 3)),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Últimos 3 meses
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfYear(new Date()),
                      to: endOfYear(new Date())
                    })}
                  >
                    Este ano
                  </Button>
                </div>
                <div className="p-0">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="p-3"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleSyncAll()}
            disabled={syncCampaigns.isPending}
          >
            <RefreshCw className={cn("h-4 w-4", syncCampaigns.isPending && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais — 6 KPIs alinhados com benchmark 2026 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Gasto Total */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto no Período</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalSpend)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.googleAdsSpend + dashboardData.metaAdsSpend > 0
                ? `${((dashboardData.metaAdsSpend / (dashboardData.googleAdsSpend + dashboardData.metaAdsSpend)) * 100).toFixed(0)}% Meta`
                : 'Sem dados'}
            </p>
          </CardContent>
        </Card>

        {/* 2. Leads Gerados */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">do período</p>
          </CardContent>
        </Card>

        {/* 3. CPL — Custo por Lead (★ KPI #1 para clínica) */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPL</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.cpl > 0 ? formatCurrency(dashboardData.cpl) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.cpl > 0 && dashboardData.cpl <= 15 ? (
                <span className="text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Ótimo
                </span>
              ) : dashboardData.cpl > 15 && dashboardData.cpl <= 30 ? (
                <span className="text-yellow-500 flex items-center gap-1">Bom</span>
              ) : dashboardData.cpl > 30 ? (
                <span className="text-orange-500 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  Revisar
                </span>
              ) : (
                'Custo por Lead'
              )}
            </p>
          </CardContent>
        </Card>

        {/* 4. Conv. Lead → Paciente */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conv. Paciente</CardTitle>
            <Repeat className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.leadToPatientRate > 0
                ? `${dashboardData.leadToPatientRate.toFixed(1)}%`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.newPatients > 0
                ? `${dashboardData.newPatients} novos pacientes`
                : 'Lead → Paciente'}
            </p>
          </CardContent>
        </Card>

        {/* 5. CAC — Custo por Paciente */}
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
            <UserCheck className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.cac > 0 ? formatCurrency(dashboardData.cac) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Custo por paciente</p>
          </CardContent>
        </Card>

        {/* 6. ROAS */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.averageROAS > 0 ? `${dashboardData.averageROAS.toFixed(2)}x` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.averageROAS >= 3 ? (
                <span className="text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Excelente
                </span>
              ) : dashboardData.averageROAS >= 2 ? (
                <span className="text-yellow-500 flex items-center gap-1">Bom</span>
              ) : dashboardData.averageROAS > 0 ? (
                <span className="text-orange-500 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  Atenção
                </span>
              ) : (
                'Receita / Gasto'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status de Integrações e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fonte dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.activeAccountsList.length > 0 ? (
              <>
                <div className="space-y-1.5">
                  {dashboardData.activeAccountsList.map((account) => {
                    const icon = account.category === 'bm'
                      ? <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      : account.category === 'waba'
                      ? <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                      : <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />;
                    return (
                      <div key={account.id} className="flex items-center gap-2 text-sm">
                        {icon}
                        <span className="truncate flex-1">{account.name}</span>
                        {account.lastSync && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {format(new Date(account.lastSync), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {dashboardData.lastSyncTime && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>Última sync</span>
                    <span>{format(new Date(dashboardData.lastSyncTime), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nenhuma conta ativa para análise
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/marketing?tab=integrations')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Selecionar Contas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleSyncAll}
                disabled={syncCampaigns.isPending || !dashboardData.hasConnections}
              >
                {syncCampaigns.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Todas as Campanhas
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/marketing?tab=reports')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evolução da Performance</CardTitle>
            <CardDescription>Evolução do investimento e retorno</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="gasto" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Gasto"
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Receita"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Comparativo Google Ads vs Meta Ads</CardTitle>
            <CardDescription>Gasto e receita por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="gasto" fill="#ef4444" name="Gasto" />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Campanhas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 Campanhas por ROAS</CardTitle>
            <CardDescription>Melhores campanhas em retorno sobre investimento</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.topCampaignsByROAS.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.topCampaignsByROAS.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/marketing?tab=campaigns&campaign=${campaign.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Gasto: {formatCurrency(campaign.spend)} • Receita: {formatCurrency(campaign.revenue)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="ml-2">
                      {campaign.roas.toFixed(2)}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma campanha com ROAS disponível
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 Campanhas por Conversões</CardTitle>
            <CardDescription>Campanhas com maior número de conversões</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.topCampaignsByConversions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.topCampaignsByConversions.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/marketing?tab=campaigns&campaign=${campaign.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.conversions} conversões • Receita: {formatCurrency(campaign.revenue)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {campaign.conversions}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma campanha com conversões
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Recomendações */}
      {dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas e Recomendações
            </CardTitle>
            <CardDescription>Ações que podem melhorar o desempenho das suas campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.alerts.map((alert, index) => (
                <Alert key={index} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="text-sm">{alert.message}</AlertTitle>
                      {alert.campaignId && (
                        <AlertDescription className="mt-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => navigate(`/marketing?tab=campaigns&campaign=${alert.campaignId}`)}
                          >
                            Ver campanha <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </AlertDescription>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há conexões */}
      {!dashboardData.hasConnections && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configure suas integrações</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte suas contas do Google Ads e Meta Ads para começar a acompanhar suas campanhas
            </p>
            <Button onClick={() => navigate('/marketing?tab=integrations')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Primeira Integração
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

