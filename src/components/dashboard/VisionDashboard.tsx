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
    viewMode?: 'vision' | 'detailed';
    onViewModeChange?: (mode: 'vision' | 'detailed') => void;
}

export default function VisionDashboard({ viewMode, onViewModeChange }: ViewModeProps) {
    const { profile, isVendedor } = useUserProfile();
    const { data: dashboardMetrics } = useDashboardMetrics();
    const navigate = useNavigate();

    if (!profile) {
        return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8 font-sans transition-colors duration-300">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Olá, <span className="text-primary">{profile.full_name?.split(' ')[0] || 'Bem-vindo'}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-light tracking-wide">
                        Aqui está o relatório geral da sua clínica hoje.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground w-64 focus-visible:ring-primary rounded-xl transition-all hover:bg-muted/50"
                        />
                    </div>
                    {/* View Toggle */}
                    {onViewModeChange && (
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50">
                            <Button
                                variant={viewMode === 'vision' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('vision')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'vision' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Visão Geral
                            </Button>
                            <Button
                                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('detailed')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Detalhada
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" size="icon" className="bg-card border-border text-foreground hover:bg-muted/50 rounded-xl">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 border-0 rounded-xl">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Agendar
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

                            <VisionCard title="Performance Combinada">
                                <UnifiedChart className="bg-transparent border-none shadow-none p-0 !pt-0" />
                            </VisionCard>
                        </>
                    ) : (
                        // Admin View
                        <>
                            <VisionCard title="Performance Analytics" action={
                                <div className="flex bg-muted/50 rounded-lg p-0.5">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-md bg-card shadow-sm text-foreground">Receita</Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-md text-muted-foreground hover:text-foreground">Pacientes</Button>
                                </div>
                            }>
                                <UnifiedChart className="bg-transparent border-none shadow-none p-0 !pt-0" />
                            </VisionCard>

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
                    <VisionCard title="Sua Agenda Hoje">
                        <UpcomingCallsWidget />
                    </VisionCard>

                    <VisionCard title="Tarefas Prioritárias">
                        <TodayTasksWidget />
                    </VisionCard>
                </div>

            </div>
        </div>
    );
}
