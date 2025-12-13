import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
      <div className="h-48 w-full flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <XAxis type="number" domain={[0, 1]} hide allowDataOverflow={false} />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={70}
          />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--chart-1))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
