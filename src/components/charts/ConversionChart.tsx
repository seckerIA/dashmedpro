import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
import { getGradient, CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';

interface ConversionChartProps {
  data?: Array<{ stage: string; conversion: number }>;
}

const stageNames: Record<string, string> = {
  'lead_novo': 'Lead Novo',
  'qualificado': 'Qualificado',
  'apresentacao': 'Apresentação',
  'proposta': 'Proposta',
  'negociacao': 'Negociação'
};

export function ConversionChart({ data = [] }: ConversionChartProps) {
  const chartData = (data || []).map(item => {
    const conv = Number((item as any).conversion);
    return {
      name: stageNames[(item as any).stage] || (item as any).stage,
      value: Number.isFinite(conv) ? conv / 100 : 0,
    };
  });
  
  // Garantir que sempre há dados válidos
  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
          <defs>
            {CHART_COLORS.funnel.map((gradient, index) => (
              <linearGradient key={index} id={`convGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis 
            type="number" 
            domain={[0, 1]} 
            hide 
            allowDataOverflow={false} 
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={90}
          />
          <EnhancedTooltip 
            valueFormatter={(value) => `${(value * 100).toFixed(1)}%`}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#convGradient-${index % CHART_COLORS.funnel.length})`}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              style={{ fontSize: '11px', fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
