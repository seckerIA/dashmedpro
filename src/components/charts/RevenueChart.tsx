import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency, formatCurrencyShort } from '@/lib/currency';
import { EnhancedTooltip } from './EnhancedTooltip';

interface RevenueChartProps {
  data?: Array<{ month: string; projected: number; closed: number }>;
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
  const safeData = (data || []).map((d) => ({
    month: d?.month ?? '',
    projected: Number.isFinite(Number((d as any).projected)) ? Number((d as any).projected) : 0,
    closed: Number.isFinite(Number((d as any).closed)) ? Number((d as any).closed) : 0,
  }));
  
  const maxY = Math.max(0, ...safeData.map(d => Math.max(d.projected, d.closed)));
  
  // Garantir que sempre há dados válidos
  if (safeData.length === 0 || maxY === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={safeData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
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
                tickFormatter={(value) => formatCurrencyShort(value)}
              />
          <EnhancedTooltip 
            valueFormatter={(value) => formatCurrency(value)}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="circle"
          />
          <Area 
            type="monotone" 
            dataKey="projected" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fill="url(#colorProjected)" 
            name="Projetado"
          />
          <Area 
            type="monotone" 
            dataKey="closed" 
            stroke="#6366f1" 
            strokeWidth={3}
            fill="url(#colorClosed)" 
            name="Fechado"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
