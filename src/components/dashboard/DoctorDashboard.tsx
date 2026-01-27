
import { useUserProfile } from '@/hooks/useUserProfile';
import { TodaysAgenda } from './doctor/TodaysAgenda';
import { DailyFinancials } from './doctor/DailyFinancials';
import { FutureOutlook } from './doctor/FutureOutlook';
import { SecretaryActivities } from './doctor/SecretaryActivities';
import { NegotiationsWidget } from './doctor/NegotiationsWidget';
import { MedicalRecordSearch } from './doctor/MedicalRecordSearch';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Activity, BarChart2 } from "lucide-react";

interface DoctorDashboardProps {
    viewMode?: 'daily' | 'detailed' | 'general';
    onViewModeChange?: (mode: 'daily' | 'detailed' | 'general') => void;
}

export function DoctorDashboard({ viewMode, onViewModeChange }: DoctorDashboardProps) {
    const { profile } = useUserProfile();

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 font-sans transition-colors duration-300">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {greeting}, Dr. <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Médico'}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-light tracking-wide">
                        Aqui está o resumo do seu dia hoje.
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
                                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onViewModeChange('detailed')}
                                className={`text-xs h-8 px-3 rounded-lg ${viewMode === 'detailed' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Activity className="w-3.5 h-3.5 mr-2" />
                                Detalhada
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

                    {/* Today's Agenda */}
                    <div className="min-h-[350px] bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                        <ScrollArea className="h-full">
                            <div className="p-6">
                                <TodaysAgenda />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Medical Record Search & History */}
                    <div className="flex-1 min-h-[300px]">
                        <MedicalRecordSearch />
                    </div>
                </div>

                {/* Right Column: Future & Quick Actions */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Future Outlook */}
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                        <FutureOutlook />
                    </div>

                    {/* Live Negotiations Widget */}
                    <div className="h-[350px]">
                        <NegotiationsWidget />
                    </div>

                    {/* Secretary Activities */}
                    <div className="flex-1 min-h-[250px] bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                        <SecretaryActivities />
                    </div>
                </div>
            </div>
        </div>
    );
}
