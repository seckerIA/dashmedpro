import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "./MetricCard";
import { ConversionFunnel } from "./ConversionFunnel";
import { RevenueChart } from "./RevenueChart";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";

export function CommercialDashboard() {
  const navigate = useNavigate();
  const { metrics, isLoading } = useCommercialMetrics();
  
  // Handle navigation with query params
  const handleNewLead = () => {
    navigate("/comercial?tab=leads&action=new");
  };
  

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleNewLead}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
        <Button
          onClick={() => navigate("/calendar")}
          variant="outline"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Consulta
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Leads do Mês"
          value={metrics?.totalLeads || 0}
          icon="trending-up"
          isLoading={isLoading}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics?.conversionRate || 0}%`}
          icon="target"
          isLoading={isLoading}
        />
        <MetricCard
          title="Receita Total"
          value={metrics?.totalRevenue || 0}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
        />
        <MetricCard
          title="Receita Média"
          value={metrics?.averageRevenue || 0}
          icon="bar-chart"
          format="currency"
          isLoading={isLoading}
        />
        <MetricCard
          title="Pacientes Novos"
          value={metrics?.newPatients || 0}
          icon="user-plus"
          isLoading={isLoading}
        />
        <MetricCard
          title="Procedimentos"
          value={metrics?.scheduledProcedures || 0}
          icon="calendar"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
            <ConversionFunnel data={metrics?.funnelData || []} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Receita por Procedimento</h3>
            <RevenueChart data={metrics?.revenueByProcedure || []} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendência de Leads</h3>
            <RevenueChart data={metrics?.leadsTrend || []} type="line" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comparativo Mensal</h3>
            <RevenueChart data={metrics?.monthlyComparison || []} type="bar" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

