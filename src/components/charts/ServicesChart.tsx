import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';

interface ServicesChartProps {
  data?: Array<{ service: string; count: number }>;
}

export function ServicesChart({ data = [] }: ServicesChartProps) {
  // Traduzir nomes
  const serviceLabels: Record<string, string> = {
    'procedure': 'Procedimentos',
    'first_visit': 'Primeira Consulta',
    'return': 'Retorno'
  };

  const rawData = (data || []).map((item) => ({
    name: serviceLabels[item.service] || item.service,
    value: Number.isFinite(Number(item.count)) ? Number(item.count) : 0,
  })).filter(item => item.value > 0);

  // Ordenar e agrupar (Top 5 + Outros)
  const sortedData = [...rawData].sort((a, b) => b.value - a.value);
  const top5 = sortedData.slice(0, 5);
  const others = sortedData.slice(5);

  const chartData = [...top5];
  if (others.length > 0) {
    chartData.push({
      name: 'Outros',
      value: others.reduce((sum, item) => sum + item.value, 0)
    });
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {CHART_COLORS.gradients.map((gradient, index) => (
              <linearGradient key={index} id={`serviceGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            label={({ name, percent }) => {
              if (percent < 0.1) return '';
              return `${(percent * 100).toFixed(0)}%`;
            }}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#serviceGradient-${index % CHART_COLORS.gradients.length})`}
              />
            ))}
          </Pie>
          <EnhancedTooltip
            valueFormatter={(value) => `${value.toLocaleString('pt-BR')} registros`}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            layout="horizontal"
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '11px',
            }}
            formatter={(value, entry: any) => {
              const item = chartData.find(d => d.name === value);
              const percentage = total > 0 && item ? ((item.value / total) * 100).toFixed(1) : '0.0';
              return (
                <span className="text-foreground/80">
                  {value} ({percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
