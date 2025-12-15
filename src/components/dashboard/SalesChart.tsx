import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { designTokens } from '@/lib/design-tokens';

interface SalesChartProps {
  data: Array<{
    name: string;
    current: number;
    previous?: number;
  }>;
  title?: string;
  className?: string;
}

export function SalesChart({ data, title, className }: SalesChartProps) {
  return (
    <div className={`bg-card rounded-2xl p-6 border border-border ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-6 text-foreground">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {/* Gradiente Purple → Cyan */}
            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={designTokens.chartColors.primary} stopOpacity={0.8} />
              <stop offset="50%" stopColor={designTokens.chartColors.secondary} stopOpacity={0.4} />
              <stop offset="95%" stopColor={designTokens.chartColors.secondary} stopOpacity={0.1} />
            </linearGradient>

            {/* Gradiente para linha anterior (se houver) */}
            <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.2}
            vertical={false}
          />

          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}k`}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                    <p className="text-sm font-medium text-foreground mb-2">
                      {payload[0].payload.name}
                    </p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-semibold text-foreground">
                          ${entry.value}k
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Linha anterior (se existir) */}
          {data.some(d => d.previous !== undefined) && (
            <Area
              type="monotone"
              dataKey="previous"
              stroke="hsl(262, 83%, 58%)"
              strokeWidth={2}
              fill="url(#colorPrevious)"
              opacity={0.5}
              name="Anterior"
            />
          )}

          {/* Linha atual */}
          <Area
            type="monotone"
            dataKey="current"
            stroke={designTokens.chartColors.secondary}
            strokeWidth={3}
            fill="url(#colorCurrent)"
            name="Atual"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente de gráfico de barras
interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface WeeklySalesChartProps {
  data: BarChartData[];
  title?: string;
  className?: string;
}

export function WeeklySalesChart({ data, title, className }: WeeklySalesChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`bg-card rounded-2xl p-6 border border-border ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-6 text-foreground">{title}</h3>
      )}

      <div className="flex items-end justify-between gap-3 h-64">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          const colors = [
            'bg-gradient-to-t from-purple-500 to-purple-400',
            'bg-gradient-to-t from-pink-500 to-pink-400',
            'bg-gradient-to-t from-yellow-500 to-yellow-400',
            'bg-gradient-to-t from-green-500 to-green-400',
            'bg-gradient-to-t from-cyan-500 to-cyan-400',
            'bg-gradient-to-t from-blue-500 to-blue-400',
            'bg-gradient-to-t from-gray-500 to-gray-400',
          ];

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center h-48 group">
                {/* Barra */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer ${colors[index % colors.length]}`}
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip value */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-semibold shadow-xl whitespace-nowrap">
                      ${item.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Label */}
              <span className="text-xs text-muted-foreground font-medium">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
