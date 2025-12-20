import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList } from "recharts";
import { formatCurrency } from "@/lib/currency";
import { getChartColor, getGradient, CHART_COLORS } from "@/lib/chart-colors";
import { EnhancedTooltip } from "@/components/charts/EnhancedTooltip";

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface RevenueChartProps {
  data: ChartData[];
  type?: "pie" | "line" | "bar" | "donut";
}

// Componente customizado para labels do gráfico de pizza
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Só mostrar label se for maior que 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
      className="drop-shadow-lg"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function RevenueChart({ data, type = "pie" }: RevenueChartProps) {
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">📊 Nenhum dado disponível</p>
      </div>
    );
  }

  if (type === "pie" || type === "donut") {
    const innerRadius = type === "donut" ? 60 : 0;
    
    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <defs>
              {CHART_COLORS.gradients.map((gradient, index) => (
                <linearGradient key={index} id={`revenueGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={110}
              innerRadius={innerRadius}
              paddingAngle={2}
              dataKey="value"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#revenueGradient-${index % CHART_COLORS.gradients.length})`}
                />
              ))}
            </Pie>
            <EnhancedTooltip 
              valueFormatter={(value) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legenda melhorada com valores formatados */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {data.map((entry, index) => {
            const percentage = totalValue > 0 ? ((Number(entry.value) / totalValue) * 100).toFixed(1) : '0.0';
            const gradient = getGradient(index);
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(Number(entry.value))} • {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <EnhancedTooltip 
            valueFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {CHART_COLORS.gradients.map((gradient, index) => (
              <linearGradient key={index} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <EnhancedTooltip 
            valueFormatter={(value) => formatCurrency(value)}
          />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#barGradient-${index % CHART_COLORS.gradients.length})`}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="top" 
              formatter={(value: number) => formatCurrency(value)}
              style={{ fontSize: '11px', fill: 'hsl(var(--muted-foreground))' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
