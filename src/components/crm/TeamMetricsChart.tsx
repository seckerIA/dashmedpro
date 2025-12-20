import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TeamMetrics } from "@/hooks/useTeamMetrics";
import { formatCurrencyShort, formatCurrency } from "@/lib/currency";
import { EnhancedTooltip } from "@/components/charts/EnhancedTooltip";
import { getChartColor } from "@/lib/chart-colors";

interface TeamMetricsChartProps {
  teamMetrics: TeamMetrics[];
  isLoading?: boolean;
}

export function TeamMetricsChart({ teamMetrics, isLoading }: TeamMetricsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos Comparativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (teamMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos Comparativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível para visualização.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para gráficos
  const pipelineData = teamMetrics.map(tm => ({
    name: tm.userName.split(' ')[0], // Primeiro nome apenas
    pipeline: tm.totalPipeline,
    revenue: tm.totalRevenue,
  }));

  const conversionData = teamMetrics.map(tm => ({
    name: tm.userName.split(' ')[0],
    conversao: tm.conversionRate,
  }));

  const dealsData = teamMetrics.map(tm => ({
    name: tm.userName.split(' ')[0],
    ativos: tm.activeDeals,
    ganhos: tm.wonDeals,
    perdidos: tm.lostDeals,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pipeline e Receita */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline vs Receita por Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
              <Tooltip content={<EnhancedTooltip valueFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : String(value)} />} />
              <Legend />
              <Bar dataKey="pipeline" fill={getChartColor(0)} name="Pipeline" />
              <Bar dataKey="revenue" fill={getChartColor(1)} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Taxa de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão por Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<EnhancedTooltip valueFormatter={(value) => `${value.toFixed(2)}%`} />} />
              <Bar dataKey="conversao" fill={getChartColor(2)} name="Taxa de Conversão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Deals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Deals por Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<EnhancedTooltip />} />
              <Legend />
              <Bar dataKey="ativos" fill={getChartColor(0)} name="Ativos" />
              <Bar dataKey="ganhos" fill={getChartColor(1)} name="Ganhos" />
              <Bar dataKey="perdidos" fill={getChartColor(3)} name="Perdidos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

