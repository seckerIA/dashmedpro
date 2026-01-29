import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "./MetricCard";
import { MetricsCharts } from "./MetricsCharts";
import { MetricsTables } from "./MetricsTables";
import { MetricsFilters } from "./MetricsFilters";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { PeriodFilter } from "@/types/metrics";

export function MetricsDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>();

  const { metrics, isLoading } = useCommercialMetrics(period, customRange);

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="bg-gradient-card shadow-card border-border">
              <CardContent className="p-4 h-24 animate-pulse bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  const comparisons = metrics.comparisons;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <MetricsFilters
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Custo por Consulta */}
        <MetricCard
          title="Custo Médio por Consulta"
          value={metrics.financial.costPerAppointment.average}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
          comparison={comparisons.costs.change !== 0 ? {
            value: comparisons.costs.change,
            label: "vs período anterior",
          } : undefined}
        />

        {/* ROI */}
        <MetricCard
          title="ROI Geral"
          value={metrics.financial.roi.overall}
          icon="trending-up"
          format="percentage"
          isLoading={isLoading}
        />

        {/* Margem de Lucro */}
        <MetricCard
          title="Margem de Lucro Líquida"
          value={metrics.financial.profitMargin.net}
          icon="percent"
          format="percentage"
          isLoading={isLoading}
        />

        {/* Receita por Hora */}
        <MetricCard
          title="Receita por Hora"
          value={metrics.financial.revenuePerHour.average}
          icon="clock"
          format="currency"
          isLoading={isLoading}
        />

        {/* Ticket Médio */}
        <MetricCard
          title="Ticket Médio"
          value={metrics.financial.averageTicket.perAppointment}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
        />

        {/* LTV Médio */}
        <MetricCard
          title="LTV Médio (Paciente)"
          value={metrics.customer.ltv.average}
          icon="user-check"
          format="currency"
          isLoading={isLoading}
        />

        {/* CAC */}
        <MetricCard
          title="CAC (Custo de Aquisição)"
          value={metrics.customer.cac.average}
          icon="calculator"
          format="currency"
          isLoading={isLoading}
        />

        {/* Taxa de Conversão */}
        <MetricCard
          title="Taxa de Conversão Geral"
          value={metrics.operational.conversionRate.overall}
          icon="target"
          format="percentage"
          isLoading={isLoading}
        />

        {/* Taxa de Ocupação */}
        <MetricCard
          title="Taxa de Ocupação"
          value={metrics.operational.occupancyRate.overall}
          icon="zap"
          format="percentage"
          isLoading={isLoading}
        />

        {/* Receita Total */}
        <MetricCard
          title="Receita Total"
          value={comparisons.revenue.current}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
          comparison={comparisons.revenue.change !== 0 ? {
            value: comparisons.revenue.change,
            label: "vs período anterior",
          } : undefined}
        />

        {/* Lucro Total */}
        <MetricCard
          title="Lucro Total"
          value={comparisons.profit.current}
          icon="trending-up"
          format="currency"
          isLoading={isLoading}
          comparison={comparisons.profit.change !== 0 ? {
            value: comparisons.profit.change,
            label: "vs período anterior",
          } : undefined}
        />

        {/* Consultas Realizadas */}
        <MetricCard
          title="Consultas Realizadas"
          value={comparisons.appointments.current}
          icon="bar-chart"
          format="number"
          isLoading={isLoading}
          comparison={comparisons.appointments.change !== 0 ? {
            value: comparisons.appointments.change,
            label: "vs período anterior",
          } : undefined}
        />
      </div>

      {/* Gráficos */}
      <MetricsCharts metrics={metrics} isLoading={isLoading} />

      {/* Tabelas Detalhadas */}
      <MetricsTables metrics={metrics} isLoading={isLoading} />
    </div>
  );
}

