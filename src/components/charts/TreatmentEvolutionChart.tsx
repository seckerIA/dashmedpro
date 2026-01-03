import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { designTokens } from '@/lib/design-tokens';

interface TreatmentEvolutionData {
  month: string;
  emTratamento: number;
  inadimplentes: number;
  agendados: number;
}

interface TreatmentEvolutionChartProps {
  data?: TreatmentEvolutionData[];
}

export function TreatmentEvolutionChart({ data = [] }: TreatmentEvolutionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="tratamentoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="inadimplenteGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="agendadoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
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
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                    <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-semibold text-foreground">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Area
            type="monotone"
            dataKey="emTratamento"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#tratamentoGradient)"
            name="Em Tratamento"
          />
          <Area
            type="monotone"
            dataKey="agendados"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#agendadoGradient)"
            name="Agendados"
          />
          <Area
            type="monotone"
            dataKey="inadimplentes"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#inadimplenteGradient)"
            name="Inadimplentes"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
