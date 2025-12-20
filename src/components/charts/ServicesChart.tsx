import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { getGradient, CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';

interface ServicesChartProps {
  data?: Array<{ service: string; count: number }>;
}

export function ServicesChart({ data = [] }: ServicesChartProps) {
  const chartData = (data || []).map((item, index) => ({
    name: (item as any).service,
    value: Number.isFinite(Number((item as any).count)) ? Number((item as any).count) : 0,
  })).filter(item => item.value > 0); // Filtrar valores zero
  
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Garantir que sempre há dados válidos
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
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={3}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            label={({ name, percent }) => {
              // Só mostrar label se for maior que 5%
              if (percent < 0.05) return '';
              return `${name}: ${(percent * 100).toFixed(1)}%`;
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
            valueFormatter={(value) => `${value.toLocaleString('pt-BR')} consultas`}
          />
          <Legend 
            verticalAlign="bottom" 
            height={60}
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
            }}
            iconType="circle"
            formatter={(value, entry: any) => {
              const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : '0.0';
              return `${value} (${entry.payload.value.toLocaleString('pt-BR')} - ${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
