import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
      <div className="h-48 w-full flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={safeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <Line 
            type="monotone" 
            dataKey="projected" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="closed" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
