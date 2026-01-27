/**
 * UnifiedChart - Gráfico único com sistema de tabs
 * 
 * Substitui múltiplos gráficos por um único componente com tabs selecionáveis.
 * Inclui insight automático baseado nos dados exibidos.
 */

'use client'

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Users, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartType = "receita" | "pacientes" | "conversao";
type PeriodType = "7d" | "30d" | "90d" | "12m";

interface UnifiedChartProps {
    className?: string;
}

const CHART_TABS: { id: ChartType; label: string; icon: React.ElementType }[] = [
    { id: "receita", label: "Receita", icon: DollarSign },
    { id: "pacientes", label: "Pacientes", icon: Users },
    { id: "conversao", label: "Conversão", icon: Target },
];

const PERIOD_OPTIONS: { id: PeriodType; label: string }[] = [
    { id: "7d", label: "7 dias" },
    { id: "30d", label: "30 dias" },
    { id: "90d", label: "90 dias" },
    { id: "12m", label: "12 meses" },
];

export function UnifiedChart({ className }: UnifiedChartProps) {
    const [activeChart, setActiveChart] = useState<ChartType>("receita");
    const [period, setPeriod] = useState<PeriodType>("30d");

    const { data: dashboardMetrics, isLoading } = useDashboardMetrics();

    // Preparar dados baseados no tipo de gráfico selecionado
    const chartData = useMemo(() => {
        if (!dashboardMetrics) return [];

        // Filtrar dados baseado no período
        const getFilteredData = (data: any[], periodType: PeriodType) => {
            switch (periodType) {
                case "7d":
                    return data.slice(-7);
                case "30d":
                    return data.slice(-30);
                case "90d":
                    return data.slice(-90);
                case "12m":
                default:
                    return data;
            }
        };

        switch (activeChart) {
            case "receita":
                return getFilteredData(
                    dashboardMetrics.monthlyRevenue?.map(item => ({
                        name: item.month,
                        value: item.closed / 1000, // Em milhares
                        projected: item.projected / 1000,
                    })) || [],
                    period
                );
            case "pacientes":
                return getFilteredData(
                    dashboardMetrics.monthlyLeads?.map(item => ({
                        name: item.month,
                        value: item.leads,
                    })) || [],
                    period
                );
            case "conversao":
                // Para conversão por etapa, não aplicar filtro de período
                // pois são etapas do funil, não dados temporais
                const conversionData = dashboardMetrics.conversionByStage?.map(item => {
                    // Formatar nome do estágio para exibição
                    const stageName = item.stage
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                    return {
                        name: stageName,
                        value: item.conversion || 0,
                    };
                }) || [];

                // Se não houver dados, criar dados placeholder
                if (conversionData.length === 0) {
                    return [
                        { name: "Lead Novo", value: 100 },
                        { name: "Qualificado", value: 75 },
                        { name: "Apresentação", value: 50 },
                        { name: "Proposta", value: 30 },
                        { name: "Fechado-ganho", value: 20 },
                    ];
                }

                return conversionData;
            default:
                return [];
        }
    }, [activeChart, period, dashboardMetrics]);

    // Gerar insight baseado nos dados
    const insight = useMemo(() => {
        if (!dashboardMetrics) return null;

        switch (activeChart) {
            case "receita": {
                const data = dashboardMetrics.monthlyRevenue || [];
                if (data.length < 2) return "Continue registrando transações para ver tendências";

                const current = data[data.length - 1]?.closed || 0;
                const previous = data[data.length - 2]?.closed || 0;
                const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

                if (change > 10) {
                    return `📈 Receita cresceu ${change.toFixed(0)}% este mês. Excelente!`;
                } else if (change < -10) {
                    return `📉 Receita caiu ${Math.abs(change).toFixed(0)}%. Revise as estratégias.`;
                }
                return `📊 Receita estável. Total fechado: ${formatCurrency(current)}`;
            }
            case "pacientes": {
                const data = dashboardMetrics.monthlyLeads || [];
                const total = data.reduce((sum, item) => sum + item.leads, 0);
                const average = total / Math.max(data.length, 1);

                return `👥 Média de ${average.toFixed(0)} novos pacientes por mês`;
            }
            case "conversao": {
                const rate = dashboardMetrics.conversionRate || 0;
                if (rate >= 20) {
                    return `🎯 Taxa de ${rate.toFixed(1)}% está acima da média do mercado!`;
                } else if (rate >= 10) {
                    return `🎯 Taxa de ${rate.toFixed(1)}%. Há espaço para otimização.`;
                }
                return `⚠️ Taxa de ${rate.toFixed(1)}% precisa de atenção. Revise o funil.`;
            }
            default:
                return null;
        }
    }, [activeChart, dashboardMetrics]);

    const getChartColor = () => {
        switch (activeChart) {
            case "receita": return "#10b981"; // emerald-500
            case "pacientes": return "#0ea5e9"; // sky-500
            case "conversao": return "#8b5cf6"; // purple-500
            default: return "#3b82f6"; // blue-500
        }
    };

    const formatYAxis = (value: number) => {
        switch (activeChart) {
            case "receita": return `${value}k`;
            case "pacientes": return value.toString();
            case "conversao": return `${value}%`;
            default: return value.toString();
        }
    };

    const formatTooltip = (value: number) => {
        switch (activeChart) {
            case "receita": return formatCurrency(value * 1000);
            case "pacientes": return `${value} pacientes`;
            case "conversao": return `${value.toFixed(1)}%`;
            default: return value.toString();
        }
    };

    if (isLoading) {
        return (
            <Card className={cn("bg-card border-border", className)}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-8 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("bg-card border-border", className)}>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Tabs de Tipo de Gráfico */}
                    <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as ChartType)}>
                        <TabsList className="bg-muted/50">
                            {CHART_TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="gap-1.5 data-[state=active]:bg-background"
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>

                    {/* Seletor de Período */}
                    <div className="flex gap-1">
                        {PERIOD_OPTIONS.map(opt => (
                            <Button
                                key={opt.id}
                                variant={period === opt.id ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPeriod(opt.id)}
                                className="text-xs px-2"
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Gráfico */}
                <div className="h-[280px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        {activeChart === "conversao" ? (
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatYAxis}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: number) => [formatTooltip(value), 'Conversão']}
                                />
                                <Bar
                                    dataKey="value"
                                    fill={getChartColor()}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        ) : (
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id={`gradient-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={getChartColor()} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatYAxis}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: number) => [formatTooltip(value), CHART_TABS.find(t => t.id === activeChart)?.label]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={getChartColor()}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${activeChart})`}
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Insight */}
                {insight && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            💡 {insight}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default UnifiedChart;
