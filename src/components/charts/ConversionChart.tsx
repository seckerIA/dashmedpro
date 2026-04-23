import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
import { EnhancedTooltip } from './EnhancedTooltip';

interface ConversionChartProps {
  data?: Array<{ stage: string; conversion: number }>;
}

const stageNames: Record<string, string> = {
  'lead_novo': 'Lead Novo',
  'em_contato': 'Em Contato',
  'agendado': 'Agendado',
  'avaliacao': 'Avaliação',
  'em_tratamento': 'Em Tratamento',
};

const FUNNEL_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export function ConversionChart({ data = [] }: ConversionChartProps) {
  // Processar dados - LIMITANDO A 100% para evitar valores impossíveis
  const chartData = (data || []).map((item, index) => {
    const conv = Number(item.conversion);
    // Limitar entre 0 e 100, arredondar para 1 casa decimal
    const limitedValue = Number.isFinite(conv) ? Math.min(Math.max(conv, 0), 100) : 0;
    return {
      name: stageNames[item.stage] || item.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.round(limitedValue * 10) / 10, // 1 casa decimal
      fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    };
  });

  // Fallback se não houver dados
  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados de conversão disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 50, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={100}
          />
          <EnhancedTooltip
            valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            maxBarSize={35}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
              />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: number) => `${value.toFixed(1)}%`}
              style={{ fontSize: '11px', fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
