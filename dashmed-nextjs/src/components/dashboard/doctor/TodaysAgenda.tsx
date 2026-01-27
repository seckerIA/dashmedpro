'use client';

import { useState } from 'react';
import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { AgendaCard } from './AgendaCard';
import { PatientQuickView } from './PatientQuickView';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronRight, Loader2 } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function TodaysAgenda() {
    const today = new Date();
    const [selectedAppointment, setSelectedAppointment] = useState<MedicalAppointmentWithRelations | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const { appointments, isLoading } = useMedicalAppointments({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        status: 'all' // We want to see everything for today
    });

    const handleCardClick = (appointment: MedicalAppointmentWithRelations) => {
        setSelectedAppointment(appointment);
        setIsQuickViewOpen(true);
    };

    const handleStartConsultation = (appointmentId: string) => {
        // Navigate to consultation page (placeholder for now, adjust route as needed)
        // router.push(`/consultation/${appointmentId}`);
        console.log('Start consultation for', appointmentId);
        setIsQuickViewOpen(false);
    };

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Agenda de Hoje
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="hidden sm:flex text-primary hover:text-primary/80" asChild>
                    <Link href="/agenda">
                        Ver agenda completa <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="px-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed rounded-lg bg-muted/20">
                        <p className="text-muted-foreground font-medium">Nenhum agendamento para hoje</p>
                        <p className="text-xs text-muted-foreground mt-1">Aproveite o dia livre!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((appointment) => (
                            <AgendaCard
                                key={appointment.id}
                                appointment={appointment}
                                onClick={handleCardClick}
                            />
                        ))}
                    </div>
                )}
            </CardContent>

            <PatientQuickView
                appointment={selectedAppointment}
                open={isQuickViewOpen}
                onOpenChange={setIsQuickViewOpen}
                onStartConsultation={handleStartConsultation}
            />
        </Card>
    );
}
