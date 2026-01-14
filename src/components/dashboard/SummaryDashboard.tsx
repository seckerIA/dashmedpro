import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroMetrics } from "./HeroMetrics";
import { SmartAlerts } from "./SmartAlerts";
import { QuickActionCard } from "./MetricCard";
import { TodayTasksWidget } from "@/components/tasks/TodayTasksWidget";
import { UpcomingCallsWidget } from "@/components/calendar/UpcomingCallsWidget";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import {
    Users,
    Target,
    Calendar as CalendarIcon,
    TrendingUp,
    ArrowRight,
    Activity,
    DollarSign
} from "lucide-react";

export function SummaryDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Welcome / Header Section - Clean & Personal */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
                    <p className="text-muted-foreground">O que precisa da sua atenção hoje.</p>
                </div>
            </div>

            {/* Primary KPI Row - The most critical numbers */}
            <AnimatedWrapper animationType="fadeIn" delay={0}>
                <HeroMetrics className="grid-cols-1 md:grid-cols-3 gap-6" />
            </AnimatedWrapper>

            {/* Main Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                {/* Left Column: Alerts & Actions (Operational Focus) */}
                <div className="space-y-6 lg:col-span-2">

                    {/* Critical Alerts first */}
                    <AnimatedWrapper animationType="slideUp" delay={0.1}>
                        {/* Simplified SmartAlerts for Summary View - Only show top 3 critical */}
                        <SmartAlerts maxVisible={3} />
                    </AnimatedWrapper>

                    {/* Quick Actions Grid */}
                    <AnimatedWrapper animationType="slideUp" delay={0.2}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <QuickActionCard
                                title="Nova Consulta"
                                description="Agendar"
                                variant="red"
                                icon={CalendarIcon}
                                onClick={() => navigate('/calendar?openForm=true')}
                            />
                            <QuickActionCard
                                title="CRM"
                                description="Leads"
                                variant="cyan"
                                icon={Users}
                                onClick={() => navigate('/comercial')}
                            />
                            <QuickActionCard
                                title="Financeiro"
                                description="Ver"
                                variant="green"
                                icon={DollarSign}
                                onClick={() => navigate('/financeiro')}
                            />
                            <QuickActionCard
                                title="WhatsApp"
                                description="Conversas"
                                variant="yellow"
                                icon={Activity}
                                onClick={() => navigate('/whatsapp')}
                            />
                        </div>
                    </AnimatedWrapper>

                    {/* Today's Tasks - Expanded for Clarity */}
                    <AnimatedWrapper animationType="slideUp" delay={0.3}>
                        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Foco do Dia
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/tarefas')}>
                                    Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <TodayTasksWidget />
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                </div>

                {/* Right Column: Agenda & Schedule (Time Focus) */}
                <div className="space-y-6">
                    <AnimatedWrapper animationType="slideUp" delay={0.25}>
                        <Card className="h-full border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    Sua Agenda
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <UpcomingCallsWidget />
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                </div>
            </div>
        </div>
    );
}
