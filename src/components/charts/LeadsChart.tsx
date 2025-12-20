import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
import { getGradient, CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';

interface LeadsChartProps {
  data?: Array<{ month: string; leads: number }>;
}

export function LeadsChart({ data = [] }: LeadsChartProps) {
  const safeData = (data || []).map((d) => ({
    month: (d as any)?.month ?? '',
    leads: Number.isFinite(Number((d as any).leads)) ? Number((d as any).leads) : 0,
  }));
  
  const maxLeads = Math.max(0, ...safeData.map(d => d.leads));
  
  // Garantir que sempre há dados válidos
  if (safeData.length === 0 || maxLeads === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={safeData} margin={{ top: 25, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {CHART_COLORS.gradients.map((gradient, index) => (
              <linearGradient key={index} id={`leadsGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value.toLocaleString('pt-BR');
            }}
          />
          <EnhancedTooltip 
            valueFormatter={(value) => `${value.toLocaleString('pt-BR')} leads`}
          />
          <Bar 
            dataKey="leads" 
            radius={[8, 8, 0, 0]}
          >
            {safeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#leadsGradient-${index % CHART_COLORS.gradients.length})`}
              />
            ))}
            <LabelList 
              dataKey="leads" 
              position="top" 
              formatter={(value: number) => value.toLocaleString('pt-BR')}
              style={{ fontSize: '11px', fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
