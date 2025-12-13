import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
      <div className="h-48 w-full flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={safeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <Bar 
            dataKey="leads" 
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
