import { VisionHeroMetrics } from "./vision/VisionHeroMetrics";
import { VisionCard } from "./vision/VisionCard";
import { UnifiedChart } from "./UnifiedChart";
import { SmartAlerts } from "./SmartAlerts";
import { TodayTasksWidget } from "@/components/tasks/TodayTasksWidget";
import { UpcomingCallsWidget } from "@/components/calendar/UpcomingCallsWidget";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Filter, Search, Users, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PipelineFunnelCard } from "./PipelineFunnelCard";
import { formatCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface ViewModeProps {
    viewMode?: 'vision' | 'detailed' | 'daily' | 'general';
    onViewModeChange?: (mode: 'vision' | 'detailed' | 'daily' | 'general') => void;
}

export default function VisionDashboard({ viewMode, onViewModeChange }: ViewModeProps) {
    const { profile, isVendedor, isAdmin } = useUserProfile();
    const { data: dashboardMetrics } = useDashboardMetrics();
    const navigate = useNavigate();

    // Contextual greeting based on time and role
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = profile?.full_name?.split(' ')[0] || 'Bem-vindo';

    const getContextualSubtitle = () => {
        if (isVendedor) {
            const activeDeals = dashboardMetrics?.activeDeals || 0;
            if (activeDeals > 0) {
                return `Voce tem ${activeDeals} negociacao${activeDeals > 1 ? 'oes' : ''} ativa${activeDeals > 1 ? 's' : ''} no pipeline.`;
            }
            return 'Seu pipeline esta vazio. Hora de prospectar novos leads!';
        }
        if (isAdmin) {
            const totalContacts = dashboardMetrics?.totalContacts || 0;
            return `Visao geral da clinica. ${totalContacts} pacientes cadastrados.`;
        }
        return 'Aqui esta o relatorio geral da sua clinica hoje.';
    };

    if (!profile) {
        return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8 font-sans transition-colors duration-300">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {timeGreeting}, <span className="text-primary">{firstName}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-light tracking-wide">
                        {getContextualSubtitle()}
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground w-64 focus-visible:ring-primary rounded-xl transition-all hover:bg-muted/50"
                        />
                    </div>
                    {/* View Toggle */}
                    {onViewModeChange && (
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
                            <Button
                                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('daily')}
                                className={`text-xs h-8 px-3 rounded-lg whitespace-nowrap ${viewMode === 'daily' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Dia a Dia
                            </Button>
                            <Button
                                variant={viewMode === 'vision' || viewMode === 'general' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('vision')}
                                className={`text-xs h-8 px-3 rounded-lg whitespace-nowrap ${viewMode === 'vision' || viewMode === 'general' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Visão Geral
                            </Button>
                            <Button
                                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('detailed')}
                                className={`text-xs h-8 px-3 rounded-lg whitespace-nowrap ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Detalhada
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" size="icon" className="bg-card border-border text-foreground hover:bg-muted/50 rounded-xl shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 border-0 rounded-xl shrink-0" onClick={() => navigate('/calendar?openForm=true')}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Agendar</span>
                        <span className="sm:hidden">Novo</span>
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <VisionHeroMetrics />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

                {/* Left Column - Charts & Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    {isVendedor ? (
                        // Vendedor View
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <VisionCard title="Pipeline de Vendas" className="h-full">
                                    <PipelineFunnelCard
                                        dealsByStage={dashboardMetrics?.dealsByStage || {}}
                                        formatCurrency={formatCurrency}
                                    />
                                </VisionCard>

                                <VisionCard title="Acesso Rápido" className="h-full">
                                    <div className="grid grid-cols-2 gap-3 h-full items-center">
                                        <Button variant="outline" className="h-full py-4 flex flex-col items-center justify-center gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all" onClick={() => navigate('/comercial')}>
                                            <Users className="h-6 w-6 text-primary" />
                                            CRM
                                        </Button>
                                        <Button variant="outline" className="h-full py-4 flex flex-col items-center justify-center gap-2 border-border/50 hover:border-warning/50 hover:bg-warning/5 text-muted-foreground hover:text-warning transition-all" onClick={() => navigate('/tarefas')}>
                                            <Target className="h-6 w-6 text-warning" />
                                            Tarefas
                                        </Button>
                                    </div>
                                </VisionCard>
                            </div>


                        </>
                    ) : (
                        // Admin View
                        <>


                            <VisionCard title="Alertas Inteligentes">
                                <div className="space-y-4">
                                    <SmartAlerts maxVisible={5} />
                                </div>
                            </VisionCard>
                        </>
                    )}
                </div>

                {/* Right Column - Tasks & Calendar */}
                <div className="space-y-6">


                    <VisionCard title="Tarefas Prioritárias">
                        <TodayTasksWidget />
                    </VisionCard>
                </div>

            </div>
        </div>
    );
}
