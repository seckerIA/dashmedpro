import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CommercialMetrics } from "@/types/metrics";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

interface MetricsChartsProps {
  metrics: CommercialMetrics;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function MetricsCharts({ metrics, isLoading }: MetricsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-6 h-64 flex items-center justify-center">
              <div className="text-muted-foreground">Carregando gráfico...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Preparar dados para gráfico de tendência de custos
  const costTrendData = metrics.financial.costPerAppointment.individual
    .slice(-30) // Últimos 30 registros
    .map((item, index) => ({
      name: format(parseISO(item.appointmentDate), "dd/MM", { locale: ptBR }),
      custo: item.costs,
      receita: item.revenue,
      lucro: item.netProfit,
    }));

  // Preparar dados para gráfico de ROI por campanha
  const roiByCampaignData = metrics.marketing.campaignROI.map((campaign) => ({
    name: campaign.campaignName.length > 15 
      ? campaign.campaignName.substring(0, 15) + '...' 
      : campaign.campaignName,
    roi: campaign.roi,
    investimento: campaign.investment,
    receita: campaign.revenue,
  }));

  // Preparar dados para gráfico de margem de lucro
  const marginData = [
    {
      name: 'Margem Bruta',
      valor: metrics.financial.profitMargin.gross,
    },
    {
      name: 'Margem Líquida',
      valor: metrics.financial.profitMargin.net,
    },
  ];

  // Preparar dados para gráfico de receita por hora
  const revenueByHourData = metrics.financial.revenuePerHour.byHour
    .filter(h => h.revenue > 0 || h.appointments > 0)
    .map(h => ({
      hora: `${h.hour}h`,
      receita: h.revenue,
      consultas: h.appointments,
    }));

  // Preparar dados para funil de conversão
  const funnelData = metrics.operational.conversionRate.funnel;

  // Preparar dados para eficiência por procedimento
  const procedureEfficiencyData = metrics.operational.procedureEfficiency.map((p) => ({
    name: p.procedureType.length > 10 
      ? p.procedureType.substring(0, 10) + '...' 
      : p.procedureType,
    receitaPorMinuto: p.revenuePerMinute,
    receitaMedia: p.averageRevenue,
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Tendência de Custos */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Tendência de Custos e Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#10b981" 
                name="Receita"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="custo" 
                stroke="#ef4444" 
                name="Custo"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="lucro" 
                stroke="#3b82f6" 
                name="Lucro"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de ROI por Campanha */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>ROI por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiByCampaignData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="roi" fill="#3b82f6" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Margem de Lucro */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Margem de Lucro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6}
                name="Margem (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Receita por Hora */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Receita por Hora do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByHourData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#10b981" 
                name="Receita"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funil de Conversão */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={100} />
              <Tooltip 
                formatter={(value: number) => `${value}%`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="percentage" fill="#f59e0b" name="Taxa de Conversão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Eficiência por Procedimento */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Eficiência por Tipo de Procedimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={procedureEfficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="receitaPorMinuto" fill="#ec4899" name="Receita por Minuto" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

