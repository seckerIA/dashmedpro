import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { CHART_COLORS } from '@/lib/chart-colors';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricFormat = 'currency' | 'number' | 'percentage' | 'duration';

interface SecretaryMetricBarChartProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  data: Array<{
    name: string;
    value: number;
  }>;
  format: MetricFormat;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const formatValue = (value: number, format: MetricFormat): string => {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (format === 'duration') {
    if (value <= 0) return '—';
    if (value < 60) return `${Math.round(value)}s`;
    if (value < 3600) return `${Math.round(value / 60)}min`;
    return `${(value / 3600).toFixed(1)}h`;
  }
  return value.toLocaleString('pt-BR');
};

const formatValueShort = (value: number, format: MetricFormat): string => {
  if (format === 'currency') {
    if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (value >= 1_000) return `R$${Math.round(value / 1_000)}k`;
    return `R$${Math.round(value)}`;
  }
  return formatValue(value, format);
};

const firstName = (name: string) => name.split(' ')[0] || name;

export function SecretaryMetricBarChart({
  title,
  subtitle,
  icon: Icon,
  data,
  format,
  isLoading,
  emptyMessage,
  className,
}: SecretaryMetricBarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const hasData = sorted.some((d) => d.value > 0);

  return (
    <Card className={cn('border-border/50 bg-gradient-to-br from-background to-muted/20', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          {title}
        </CardTitle>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="h-56 animate-pulse bg-muted/30 rounded-lg" />
        ) : !hasData ? (
          <div className="h-40 flex items-center justify-center text-center text-sm text-muted-foreground px-4">
            {emptyMessage || 'Sem dados no período.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40 + 40)}>
            <BarChart
              data={sorted.map((d) => ({ ...d, displayName: firstName(d.name) }))}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
              barCategoryGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                hide
                domain={[0, 'dataMax']}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatValue(value, format), title]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload as { name?: string } | undefined;
                  return item?.name || String(label);
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                {sorted.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                  />
                ))}
                {/* Label final do valor */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {hasData && !isLoading && (
          <div className="mt-2 space-y-1.5 px-1">
            {sorted.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS.primary[i % CHART_COLORS.primary.length] }}
                  />
                  <span className="truncate text-muted-foreground" title={d.name}>
                    {firstName(d.name)}
                  </span>
                </div>
                <span className="tabular-nums font-medium text-foreground">
                  {formatValueShort(d.value, format)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
