import { useState } from "react";
import { DetailedMetricsSection } from "./DetailedMetricsSection";
import { UnifiedChart } from "./UnifiedChart";
import { SmartAlerts } from "./SmartAlerts";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Filter, Check, Calendar, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useEnhancedDashboardMetrics } from "@/hooks/useEnhancedDashboardMetrics";

interface ViewModeProps {
    viewMode?: 'vision' | 'detailed';
    onViewModeChange?: (mode: 'vision' | 'detailed') => void;
}

export function DetailedDashboard({ viewMode, onViewModeChange }: ViewModeProps) {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [filterPeriod, setFilterPeriod] = useState("30");
    const [showFilters, setShowFilters] = useState(false);
    const { data: metrics } = useDashboardMetrics();
    const { data: enhancedMetrics } = useEnhancedDashboardMetrics();

    // Handler para compartilhar
    const handleShare = async () => {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            toast({
                title: "Link copiado!",
                description: "O link do dashboard foi copiado para a área de transferência.",
            });
        } catch (error) {
            toast({
                title: "Erro ao copiar",
                description: "Não foi possível copiar o link. Tente novamente.",
                variant: "destructive",
            });
        }
    };

    // Handler para exportar relatório
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Preparar dados para exportação
            const reportData = {
                geradoEm: new Date().toLocaleString('pt-BR'),
                periodo: `Últimos ${filterPeriod} dias`,
                metricas: {
                    receitaTotal: metrics?.totalClosedValue || 0,
                    totalConsultas: enhancedMetrics?.appointmentsThisMonth || 0,
                    consultasRealizadas: enhancedMetrics?.completedAppointmentsThisMonth || 0,
                    totalLeads: metrics?.totalContacts || 0,
                    leadsConvertidos: metrics?.wonDeals || 0,
                    taxaConversao: metrics?.conversionRate || 0,
                }
            };

            // Criar CSV
            const csvContent = [
                "Relatório do Dashboard - DashMed Pro",
                `Gerado em: ${reportData.geradoEm}`,
                `Período: ${reportData.periodo}`,
                "",
                "Métrica,Valor",
                `Receita Total,R$ ${reportData.metricas.receitaTotal.toLocaleString('pt-BR')}`,
                `Total de Consultas,${reportData.metricas.totalConsultas}`,
                `Consultas Realizadas,${reportData.metricas.consultasRealizadas}`,
                `Total de Leads,${reportData.metricas.totalLeads}`,
                `Leads Convertidos,${reportData.metricas.leadsConvertidos}`,
                `Taxa de Conversão,${reportData.metricas.taxaConversao.toFixed(1)}%`,
            ].join("\n");

            // Download do arquivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Relatório exportado!",
                description: "O arquivo CSV foi baixado com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro ao exportar",
                description: "Não foi possível gerar o relatório. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">

            {/* Analytical Header with Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Análise Detalhada</h2>
                    <p className="text-muted-foreground">Visão profunda de performance e tendências.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    {onViewModeChange && (
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg border border-border/50 mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('daily' as any)}
                                className="text-xs h-8 px-3 rounded-md text-muted-foreground hover:text-foreground"
                            >
                                Dia a Dia
                            </Button>
                            <Button
                                variant={viewMode === 'vision' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('vision')}
                                className={`text-xs h-8 px-3 rounded-md ${viewMode === 'vision' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Visão Geral
                            </Button>
                            <Button
                                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('detailed')}
                                className={`text-xs h-8 px-3 rounded-md ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Detalhada
                            </Button>
                        </div>
                    )}
                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Filter className="mr-2 h-4 w-4" /> Filtros
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="end">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Período</label>
                                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                                            <SelectItem value="15">Últimos 15 dias</SelectItem>
                                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                                            <SelectItem value="60">Últimos 60 dias</SelectItem>
                                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setShowFilters(false);
                                        toast({
                                            title: "Filtros aplicados",
                                            description: `Exibindo dados dos últimos ${filterPeriod} dias.`,
                                        });
                                    }}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Aplicar
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                    </Button>
                    <Button variant="default" size="sm" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Exportar Relatório
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Top Row: Business Health & Alerts (Critical Context) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Using detailed metrics section which already contains Health Score + Top 3 cards */}
                <div className="xl:col-span-3">
                    <AnimatedWrapper animationType="fadeIn" delay={0.1}>
                        {/* We will reuse DetailedMetricsSection but it might need some internal refactoring to not duplicate header if we want to be super clean, 
                    but for now it essentially wraps the top analytical cards */}
                        <DetailedMetricsSection />
                    </AnimatedWrapper>
                </div>
            </div>

            {/* Main Analytical Chart - Full Width for Depth */}
            <AnimatedWrapper animationType="slideUp" delay={0.2}>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">Tendências de Performance</h3>
                    <UnifiedChart />
                </div>
            </AnimatedWrapper>

            {/* Secondary Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedWrapper animationType="slideUp" delay={0.3}>
                    {/* This space is for future drilling down, e.g. "Marketing ROI" or "Team Performance" */}
                    <div className="bg-muted/10 rounded-xl p-6 border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center h-[300px]">
                        <p className="text-muted-foreground font-medium">Análise de Marketing (Em Breve)</p>
                        <p className="text-xs text-muted-foreground/60 max-w-xs mt-2">
                            Visualização detalhada de ROI por canal e custo de aquisição (CAC).
                        </p>
                    </div>
                </AnimatedWrapper>

                <AnimatedWrapper animationType="slideUp" delay={0.4}>
                    <div className="bg-muted/10 rounded-xl p-6 border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center h-[300px]">
                        <p className="text-muted-foreground font-medium">Performance da Equipe (Em Breve)</p>
                        <p className="text-xs text-muted-foreground/60 max-w-xs mt-2">
                            Rankings detalhados, metas individuais e conversão por atendente.
                        </p>
                    </div>
                </AnimatedWrapper>
            </div>

        </div>
    );
}

