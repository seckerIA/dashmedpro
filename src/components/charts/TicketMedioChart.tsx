import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';
import { formatCurrency } from '@/lib/currency';

interface TicketMedioData {
  procedure: string;
  avgTicket: number;
  count: number;
}

interface TicketMedioChartProps {
  data?: TicketMedioData[];
}

export function TicketMedioChart({ data = [] }: TicketMedioChartProps) {
  // Traduzir nomes de procedimentos
  const serviceLabels: Record<string, string> = {
    'procedure': 'Procedimentos',
    'first_visit': 'Primeira Consulta',
    'return': 'Retorno',
    'gestao_trafego': 'Gestão de Tráfego',
    'branding_completo': 'Branding Completo',
    'desenvolvimento_web': 'Desenvolvimento Web',
    'social_media': 'Social Media',
    'consultoria_seo': 'Consultoria SEO',
    'branding_midia': 'Branding e Mídia',
    'automacao_ia': 'Automação IA'
  };

  const chartData = (data || []).map(item => ({
    name: serviceLabels[item.procedure] || item.procedure,
    value: item.avgTicket,
    count: item.count
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 5 }}>
          <defs>
            {CHART_COLORS.gradients.map((gradient, index) => (
              <linearGradient key={index} id={`ticketGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={110}
          />
          <EnhancedTooltip
            valueFormatter={(value, name, props: any) => {
              const count = props?.payload?.count || 0;
              return `${formatCurrency(value)} (${count} contratos)`;
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#ticketGradient-${index % CHART_COLORS.gradients.length})`}
              />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: number) => formatCurrency(value)}
              style={{ fontSize: '11px', fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
