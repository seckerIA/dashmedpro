import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/commercial/MetricCard";
import { ConsolidatedTeamMetrics } from "@/hooks/useTeamMetrics";
import { formatCurrency } from "@/lib/currency";
import { useUserProfile } from "@/hooks/useUserProfile";

interface TeamOverviewDashboardProps {
  metrics: ConsolidatedTeamMetrics;
  isLoading?: boolean;
}

export function TeamOverviewDashboard({ metrics, isLoading }: TeamOverviewDashboardProps) {
  const { isSecretaria } = useUserProfile();

  return (
    <div className="space-y-6">
      {/* Funil: Leads → Agendados → Receita → Conversão */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Leads (Mês)"
          value={metrics.totalLeads}
          icon="user-plus"
          format="number"
          isLoading={isLoading}
        />
        <MetricCard
          title="Agendados"
          value={metrics.totalAppointmentsScheduled}
          icon="calendar"
          format="number"
          isLoading={isLoading}
        />
        {!isSecretaria && (
          <MetricCard
            title="Receita (Mês)"
            value={metrics.totalRevenue}
            icon="dollar-sign"
            format="currency"
            isLoading={isLoading}
          />
        )}
        <MetricCard
          title="Conversão"
          value={metrics.averageConversionRate}
          icon="target"
          format="percentage"
          isLoading={isLoading}
        />
      </div>

      {/* Resumo por Equipe */}
      {metrics.teamMetrics.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo por Equipe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.teamMetrics.map((tm) => (
                  <Card key={tm.userId} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg">{tm.userName}</h4>
                          {tm.userRole && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              tm.userRole === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                              tm.userRole === 'dono' ? 'bg-amber-500/20 text-amber-400' :
                              tm.userRole === 'medico' ? 'bg-emerald-500/20 text-emerald-400' :
                              tm.userRole === 'secretaria' ? 'bg-blue-500/20 text-blue-400' :
                              tm.userRole === 'vendedor' ? 'bg-cyan-500/20 text-cyan-400' :
                              tm.userRole === 'gestor_trafego' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {tm.userRole === 'admin' ? 'Admin' :
                               tm.userRole === 'dono' ? 'Proprietário' :
                               tm.userRole === 'medico' ? 'Médico' :
                               tm.userRole === 'secretaria' ? 'Secretária' :
                               tm.userRole === 'vendedor' ? 'Vendedor' :
                               tm.userRole === 'gestor_trafego' ? 'Gestor de Tráfego' :
                               tm.userRole}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Leads</p>
                            <p className="font-semibold">{tm.totalLeads}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Agendados</p>
                            <p className="font-semibold">{tm.appointmentsScheduled}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversão</p>
                            <p className="font-semibold">{tm.conversionRate.toFixed(1)}%</p>
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
