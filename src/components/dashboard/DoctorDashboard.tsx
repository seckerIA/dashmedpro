import { useMemo } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { TodaysAgenda } from './doctor/TodaysAgenda';
import { DailyFinancials } from './doctor/DailyFinancials';
import { FutureOutlook } from './doctor/FutureOutlook';
import { SecretaryActivitiesV2 } from './doctor/SecretaryActivitiesV2';
import { NegotiationsWidget } from './doctor/NegotiationsWidget';
import { MedicalRecordSearch } from './doctor/MedicalRecordSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { startOfDay, endOfDay } from 'date-fns';

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Activity, BarChart2 } from "lucide-react";

interface DoctorDashboardProps {
    viewMode?: 'daily' | 'detailed' | 'general';
    onViewModeChange?: (mode: 'daily' | 'detailed' | 'general') => void;
}

export function DoctorDashboard({ viewMode, onViewModeChange }: DoctorDashboardProps) {
    const { profile } = useUserProfile();
    const { user } = useAuth();

    // Get today's appointments count for contextual greeting
    const today = useMemo(() => new Date(), []);
    const { appointments } = useMedicalAppointments({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        doctorIds: user?.id ? [user.id] : undefined
    });

    const appointmentsCount = appointments?.length || 0;
    const firstName = profile?.full_name?.split(' ')[0] || 'Doutor';

    // Contextual greeting based on time and schedule
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    const getContextualSubtitle = () => {
        if (appointmentsCount === 0) {
            return 'Sua agenda está livre hoje. Aproveite para organizar prontuários.';
        }
        if (appointmentsCount === 1) {
            return 'Você tem 1 consulta agendada para hoje.';
        }
        return `Você tem ${appointmentsCount} consultas agendadas para hoje.`;
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 font-sans transition-colors duration-300">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {timeGreeting}, Dr. <span className="text-primary">{firstName}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-light tracking-wide">
                        {getContextualSubtitle()}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {onViewModeChange && (
                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50">
                            <Button
                                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('daily')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'daily' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                                Dia a Dia
                            </Button>
                            <Button
                                variant={viewMode === 'general' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('general')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'general' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <BarChart2 className="w-3.5 h-3.5 mr-2" />
                                Visão Geral
                            </Button>
                            <Button
                                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('detailed')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Activity className="w-3.5 h-3.5 mr-2" />
                                Detalhada
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Left Column: Agenda (Main Focus) */}
                <div className="lg:col-span-8 flex flex-col space-y-6 h-full">
                    {/* Financials Overview - Top of feed */}
                    <div className="shrink-0">
                        <DailyFinancials />
                    </div>

                    {/* Today's Agenda - Primary focus card */}
                    <Card hierarchy="primary" className="min-h-[350px] overflow-hidden flex flex-col">
                        <ScrollArea className="h-full">
                            <div className="p-6">
                                <TodaysAgenda />
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Medical Record Search & History */}
                    <div className="flex-1 min-h-[300px]">
                        <MedicalRecordSearch />
                    </div>
                </div>

                {/* Right Column: Future & Quick Actions */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Future Outlook */}
                    <Card hierarchy="tertiary" className="p-4">
                        <FutureOutlook />
                    </Card>

                    {/* Live Negotiations Widget */}
                    <div className="h-[350px]">
                        <NegotiationsWidget />
                    </div>


                    {/* Secretary Activities */}
                    <Card hierarchy="tertiary" className="flex-1 min-h-[250px] overflow-hidden flex flex-col">
                        <SecretaryActivitiesV2 />
                    </Card>
                </div>
            </div>
        </div>
    );
}

