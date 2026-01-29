import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface ReceitaDespesasData {
  month: string;
  receita: number;
  despesas: number;
}

interface ReceitaDespesasChartProps {
  data?: ReceitaDespesasData[];
}

export function ReceitaDespesasChart({ data = [] }: ReceitaDespesasChartProps) {
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
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
            tickFormatter={(value) => {
              if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
              return formatCurrency(value);
            }}
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
                          {formatCurrency(entry.value)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border mt-2 pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Saldo:</span>
                        <span className={`font-bold ${(Number(payload[0]?.value) || 0) - (Number(payload[1]?.value) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency((Number(payload[0]?.value) || 0) - (Number(payload[1]?.value) || 0))}
                        </span>
                      </div>
                    </div>
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
          <Bar dataKey="receita" fill="url(#receitaGradient)" radius={[8, 8, 0, 0]} name="Receita" />
          <Bar dataKey="despesas" fill="url(#despesasGradient)" radius={[8, 8, 0, 0]} name="Despesas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
