import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import { EnhancedTooltip } from './EnhancedTooltip';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TicketMedioData {
  procedure: string;
  avgTicket: number;
  count: number;
}

interface TicketMedioChartProps {
  data?: TicketMedioData[];
}

const ITEMS_PER_PAGE = 10;

export function TicketMedioChart({ data = [] }: TicketMedioChartProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Traduzir nomes de procedimentos
  const serviceLabels: Record<string, string> = {
    'procedure': 'Procedimentos',
    'first_visit': 'Primeira Consulta',
    'return': 'Retorno',
    'gestao_trafego': 'Gestão de Tráfego',
    'branding_completo': 'Branding Completo',
    'desenvolvimento_web': 'Desenvolvimento Web',
    'social_media': 'Social Media',
    'consultoria_seo': 'Consultoria SEO',
    'branding_midia': 'Branding e Mídia',
    'automacao_ia': 'Automação IA'
  };

  const allChartData = (data || [])
    .map(item => ({
      name: serviceLabels[item.procedure] || item.procedure,
      value: item.avgTicket,
      count: item.count
    }))
    .sort((a, b) => b.value - a.value);

  const totalPages = Math.ceil(allChartData.length / ITEMS_PER_PAGE);
  const chartData = allChartData.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  if (allChartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <p className="text-lg">📊 Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 5 }}>
            <defs>
              {CHART_COLORS.gradients.map((gradient, index) => (
                <linearGradient key={index} id={`ticketGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              width={140}
              interval={0}
            />
            <EnhancedTooltip
              formatter={(value, name) => {
                const item = chartData.find(d => d.name === name);
                const count = item?.count || 0;
                return [`${formatCurrency(value)} (${count} contratos)`, 'Média'];
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              barSize={20}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#ticketGradient-${(index + currentPage * ITEMS_PER_PAGE) % CHART_COLORS.gradients.length})`}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatCurrency(value)}
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Exibindo {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, allChartData.length)} de {allChartData.length} procedimentos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
