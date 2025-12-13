import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface ServicesChartProps {
  data?: Array<{ service: string; count: number }>;
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))'
];

export function ServicesChart({ data = [] }: ServicesChartProps) {
  const chartData = (data || []).map((item, index) => ({
    name: (item as any).service,
    value: Number.isFinite(Number((item as any).count)) ? Number((item as any).count) : 0,
    color: chartColors[index % chartColors.length]
  })).filter(item => item.value > 0); // Filtrar valores zero
  
  // Garantir que sempre há dados válidos
  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
