/**
 * DetailedMetricsSection - Visao completa de metricas do Dashboard
 *
 * Exibe todas as metricas disponiveis de forma organizada:
 * - Score de saude do negocio
 * - Cards principais (Financeiro, Pipeline, Pacientes)
 * - Graficos detalhados
 * - Secoes colapsaveis
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleSection } from "./CollapsibleSection";
import { PipelineFunnelCard } from "./PipelineFunnelCard";
import { CustomerTable } from "./CustomerTable";
import { ServicesChart } from "@/components/charts/ServicesChart";
import { ConversionChart } from "@/components/charts/ConversionChart";
import { ReceitaDespesasChart } from "@/components/charts/ReceitaDespesasChart";
import { TreatmentEvolutionChart } from "@/components/charts/TreatmentEvolutionChart";
import { TicketMedioChart } from "@/components/charts/TicketMedioChart";

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useBottleneckMetrics } from "@/hooks/useBottleneckMetrics";

import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Wallet,
  Heart
} from "lucide-react";

interface MetricItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "stable";
  icon?: React.ElementType;
}

const MetricItem = ({ label, value, subValue, trend, icon: Icon }: MetricItemProps) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-semibold text-foreground">{value}</span>
      {trend && (
        trend === "up" ? <TrendingUp className="h-3 w-3 text-green-500" /> :
        trend === "down" ? <TrendingDown className="h-3 w-3 text-red-500" /> : null
      )}
      {subValue && <span className="text-xs text-muted-foreground">({subValue})</span>}
    </div>
  </div>
);

export function DetailedMetricsSection() {
  const { data: dashboardMetrics, isLoading: isLoadingDashboard } = useDashboardMetrics();
  const { data: enhancedMetrics, isLoading: isLoadingEnhanced } = useEnhancedDashboardMetrics();
  const { metrics: financialMetrics, expensesByCategory, isLoading: isLoadingFinancial } = useFinancialMetrics();
  const { data: bottleneckData, isLoading: isLoadingBottleneck } = useBottleneckMetrics();

  const isLoading = isLoadingDashboard || isLoadingEnhanced || isLoadingFinancial || isLoadingBottleneck;

  // Calcular score de saude
  const healthScore = bottleneckData?.summary?.healthScore || 0;
  const criticalIssues = bottleneckData?.summary?.critical || 0;
  const attentionIssues = bottleneckData?.summary?.attention || 0;

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excelente", color: "text-green-600", bg: "bg-green-500" };
    if (score >= 60) return { label: "Bom", color: "text-blue-600", bg: "bg-blue-500" };
    if (score >= 40) return { label: "Atencao", color: "text-yellow-600", bg: "bg-yellow-500" };
    return { label: "Critico", color: "text-red-600", bg: "bg-red-500" };
  };

  const healthStatus = getHealthStatus(healthScore);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Health Score Card */}
      <Card className="bg-gradient-to-r from-card to-muted/20 border-border">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", healthStatus.bg + "/20")}>
                <Heart className={cn("h-6 w-6", healthStatus.color)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Saude do Negocio</h3>
                <p className="text-sm text-muted-foreground">
                  {criticalIssues > 0 && <span className="text-red-500">{criticalIssues} criticos </span>}
                  {attentionIssues > 0 && <span className="text-yellow-500">{attentionIssues} atencao</span>}
                  {criticalIssues === 0 && attentionIssues === 0 && "Sem problemas identificados"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex-1">
                <Progress value={healthScore} className="h-3" />
              </div>
              <div className="text-right">
                <span className={cn("text-2xl font-bold", healthStatus.color)}>{healthScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
                <Badge variant="outline" className={cn("ml-2", healthStatus.color)}>
                  {healthStatus.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Financeiro */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MetricItem
              label="Saldo Total"
              value={formatCurrency(financialMetrics?.totalBalance || 0)}
              icon={Wallet}
            />
            <MetricItem
              label="Lucro Liquido"
              value={formatCurrency(financialMetrics?.monthNetProfit || 0)}
              trend={(financialMetrics?.monthNetProfit || 0) > 0 ? "up" : "down"}
              icon={TrendingUp}
            />
            <MetricItem
              label="Margem"
              value={`${(financialMetrics?.netProfitMargin || 0).toFixed(1)}%`}
              icon={Target}
            />
            <MetricItem
              label="Receita Mes"
              value={formatCurrency(financialMetrics?.monthRevenue || 0)}
              icon={DollarSign}
            />
          </CardContent>
        </Card>

        {/* Card Pipeline */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MetricItem
              label="Deals Ativos"
              value={dashboardMetrics?.activeDeals || 0}
              icon={Briefcase}
            />
            <MetricItem
              label="Valor Pipeline"
              value={formatCurrency(dashboardMetrics?.totalPipelineValue || 0)}
              icon={DollarSign}
            />
            <MetricItem
              label="Taxa Conversao"
              value={`${(dashboardMetrics?.conversionRate || 0).toFixed(1)}%`}
              trend={(dashboardMetrics?.conversionRate || 0) >= 15 ? "up" : "down"}
              icon={Target}
            />
            <MetricItem
              label="Ticket Medio"
              value={formatCurrency(enhancedMetrics?.averageDealValue || 0)}
              icon={TrendingUp}
            />
          </CardContent>
        </Card>

        {/* Card Pacientes */}
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MetricItem
              label="Consultas Mes"
              value={enhancedMetrics?.appointmentsThisMonth || 0}
              icon={Calendar}
            />
            <MetricItem
              label="Em Tratamento"
              value={enhancedMetrics?.activeTreatments || 0}
              icon={Activity}
            />
            <MetricItem
              label="Taxa Conclusao"
              value={`${(enhancedMetrics?.appointmentCompletionRate || 0).toFixed(0)}%`}
              trend={(enhancedMetrics?.appointmentCompletionRate || 0) >= 80 ? "up" : "down"}
              icon={CheckCircle2}
            />
            <MetricItem
              label="Inadimplencia"
              value={`${(enhancedMetrics?.defaultRate || 0).toFixed(1)}%`}
              trend={(enhancedMetrics?.defaultRate || 0) <= 5 ? "up" : "down"}
              icon={AlertTriangle}
            />
          </CardContent>
        </Card>
      </div>

      {/* Metricas Adicionais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{dashboardMetrics?.wonDeals || 0}</p>
            <p className="text-xs text-muted-foreground">Deals Ganhos</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{dashboardMetrics?.lostDeals || 0}</p>
            <p className="text-xs text-muted-foreground">Deals Perdidos</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{dashboardMetrics?.totalContacts || 0}</p>
            <p className="text-xs text-muted-foreground">Total Contatos</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{(enhancedMetrics?.averagePipelineTime || 0).toFixed(0)}d</p>
            <p className="text-xs text-muted-foreground">Tempo Medio Pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Vendas */}
      <CollapsibleSection
        id="detailed-pipeline"
        title="Funil de Vendas"
        icon={BarChart3}
        badge={dashboardMetrics?.activeDeals || 0}
        defaultOpen={true}
      >
        <PipelineFunnelCard
          dealsByStage={dashboardMetrics?.dealsByStage || {}}
          formatCurrency={formatCurrency}
        />
      </CollapsibleSection>

      {/* Graficos Principais */}
      <CollapsibleSection
        id="detailed-charts"
        title="Graficos de Desempenho"
        icon={PieChart}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Receita vs Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedMetrics?.receitaDespesas && enhancedMetrics.receitaDespesas.length > 0 ? (
                <ReceitaDespesasChart data={enhancedMetrics.receitaDespesas} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados financeiros
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Evolucao de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedMetrics?.treatmentEvolution && enhancedMetrics.treatmentEvolution.length > 0 ? (
                <TreatmentEvolutionChart data={enhancedMetrics.treatmentEvolution} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados de evolucao
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Distribuicao por Procedimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardMetrics?.servicesInterest && dashboardMetrics.servicesInterest.length > 0 ? (
                <ServicesChart data={dashboardMetrics.servicesInterest} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados de procedimentos
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Conversao por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardMetrics?.conversionByStage && dashboardMetrics.conversionByStage.length > 0 ? (
                <ConversionChart data={dashboardMetrics.conversionByStage} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados de conversao
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Detalhes Financeiros */}
      <CollapsibleSection
        id="detailed-financial"
        title="Detalhes Financeiros"
        icon={Wallet}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Despesas por Categoria */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory && expensesByCategory.length > 0 ? (
                <div className="space-y-3">
                  {expensesByCategory.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(cat.value)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({cat.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  Sem despesas registradas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket por Procedimento */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ticket Medio por Procedimento</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedMetrics?.averageTicketByProcedure && enhancedMetrics.averageTicketByProcedure.length > 0 ? (
                <div className="space-y-3">
                  {enhancedMetrics.averageTicketByProcedure.slice(0, 5).map((proc, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[150px]">{proc.procedure}</span>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(proc.avgTicket)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({proc.count}x)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  Sem dados de procedimentos
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Mensal */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumo Financeiro do Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(financialMetrics?.monthRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Receitas</p>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(financialMetrics?.monthExpenses || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Despesas</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">
                    {formatCurrency(financialMetrics?.monthTotalCosts || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Custos</p>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <p className={cn(
                    "text-lg font-bold",
                    (financialMetrics?.monthNetProfit || 0) >= 0 ? "text-blue-600" : "text-red-600"
                  )}>
                    {formatCurrency(financialMetrics?.monthNetProfit || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Lucro Liquido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Ultimas Atualizacoes */}
      {dashboardMetrics?.recentDeals && dashboardMetrics.recentDeals.length > 0 && (
        <CollapsibleSection
          id="detailed-recent"
          title="Ultimas Atualizacoes"
          icon={Activity}
          badge={dashboardMetrics.recentDeals.length}
          defaultOpen={false}
        >
          <CustomerTable
            customers={dashboardMetrics.recentDeals.map(deal => ({
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
      )}
    </div>
  );
}

export default DetailedMetricsSection;
