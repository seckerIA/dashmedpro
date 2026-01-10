import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/commercial/MetricCard";
import { ConsolidatedTeamMetrics } from "@/hooks/useTeamMetrics";
import { formatCurrency } from "@/lib/currency";
import { useUserProfile } from "@/hooks/useUserProfile";
import { BottleneckInsightCard } from "./BottleneckInsightCard";
import { RevenueConcentrationCard } from "./RevenueConcentrationCard";

interface TeamOverviewDashboardProps {
  metrics: ConsolidatedTeamMetrics;
  isLoading?: boolean;
}

export function TeamOverviewDashboard({ metrics, isLoading }: TeamOverviewDashboardProps) {
  const { isSecretaria } = useUserProfile();

  const showInsights = (metrics.globalBottleneck || metrics.globalConcentration) && !isLoading && !isSecretaria;

  return (
    <div className="space-y-6">
      {/* Seção de Insights Avançados */}
      {showInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {metrics.globalBottleneck && (
            <BottleneckInsightCard bottleneck={metrics.globalBottleneck} isLoading={isLoading} />
          )}
          {metrics.globalConcentration && (
            <RevenueConcentrationCard concentration={metrics.globalConcentration} isLoading={isLoading} />
          )}
        </div>
      )}

      {/* Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Total - oculto para secretária */}
        {!isSecretaria && (
          <MetricCard
            title="Pipeline Total"
            value={metrics.totalPipeline}
            icon="dollar-sign"
            format="currency"
            isLoading={isLoading}
          />
        )}
        {/* Receita Total - oculto para secretária */}
        {!isSecretaria && (
          <MetricCard
            title="Receita Total"
            value={metrics.totalRevenue}
            icon="trending-up"
            format="currency"
            isLoading={isLoading}
          />
        )}
        <MetricCard
          title="Taxa de Conversão Média"
          value={metrics.averageConversionRate}
          icon="target"
          format="percentage"
          isLoading={isLoading}
        />
        <MetricCard
          title="Contratos Ativos"
          value={metrics.totalActiveDeals}
          icon="bar-chart"
          format="number"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total de Contatos"
          value={metrics.totalContacts}
          icon="user-plus"
          format="number"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon="trending-up"
          format="number"
          isLoading={isLoading}
        />
        <MetricCard
          title="Deals Ganhos"
          value={metrics.totalWonDeals}
          icon="target"
          format="number"
          isLoading={isLoading}
        />
        <MetricCard
          title="Deals Perdidos"
          value={metrics.totalLostDeals}
          icon="bar-chart"
          format="number"
          isLoading={isLoading}
        />
      </div>

      {/* Resumo por Equipe */}
      {metrics.teamMetrics.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo por Equipe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.teamMetrics.map((teamMetric) => (
                  <Card key={teamMetric.userId} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg">{teamMetric.userName}</h4>
                          {teamMetric.userRole && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${teamMetric.userRole === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                              teamMetric.userRole === 'dono' ? 'bg-amber-500/20 text-amber-400' :
                                teamMetric.userRole === 'medico' ? 'bg-emerald-500/20 text-emerald-400' :
                                  teamMetric.userRole === 'secretaria' ? 'bg-blue-500/20 text-blue-400' :
                                    teamMetric.userRole === 'vendedor' ? 'bg-cyan-500/20 text-cyan-400' :
                                      teamMetric.userRole === 'gestor_trafego' ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-muted text-muted-foreground'
                              }`}>
                              {teamMetric.userRole === 'admin' ? 'Admin' :
                                teamMetric.userRole === 'dono' ? 'Proprietário' :
                                  teamMetric.userRole === 'medico' ? 'Médico' :
                                    teamMetric.userRole === 'secretaria' ? 'Secretária' :
                                      teamMetric.userRole === 'vendedor' ? 'Vendedor' :
                                        teamMetric.userRole === 'gestor_trafego' ? 'Gestor de Tráfego' :
                                          teamMetric.userRole}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {/* Pipeline - oculto para secretária */}
                          {!isSecretaria && (
                            <div>
                              <p className="text-muted-foreground">Pipeline</p>
                              <p className="font-semibold">{formatCurrency(teamMetric.totalPipeline)}</p>
                            </div>
                          )}
                          {/* Receita - oculto para secretária */}
                          {!isSecretaria && (
                            <div>
                              <p className="text-muted-foreground">Receita</p>
                              <p className="font-semibold">{formatCurrency(teamMetric.totalRevenue)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Conversão</p>
                            <p className="font-semibold">{teamMetric.conversionRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ativos</p>
                            <p className="font-semibold">{teamMetric.activeDeals}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}







