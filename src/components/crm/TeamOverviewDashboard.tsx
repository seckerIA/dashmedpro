import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/commercial/MetricCard";
import { ConsolidatedTeamMetrics } from "@/hooks/useTeamMetrics";
import { formatCurrency } from "@/lib/currency";

interface TeamOverviewDashboardProps {
  metrics: ConsolidatedTeamMetrics;
  isLoading?: boolean;
}

export function TeamOverviewDashboard({ metrics, isLoading }: TeamOverviewDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pipeline Total"
          value={metrics.totalPipeline}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
        />
        <MetricCard
          title="Receita Total"
          value={metrics.totalRevenue}
          icon="trending-up"
          format="currency"
          isLoading={isLoading}
        />
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
                        <h4 className="font-semibold text-lg">{teamMetric.userName}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Pipeline</p>
                            <p className="font-semibold">{formatCurrency(teamMetric.totalPipeline)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Receita</p>
                            <p className="font-semibold">{formatCurrency(teamMetric.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversão</p>
                            <p className="font-semibold">{teamMetric.conversionRate.toFixed(2)}%</p>
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







