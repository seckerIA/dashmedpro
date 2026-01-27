'use client';

import { useMedicalAppointments } from '@/hooks/useMedicalAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Users } from 'lucide-react';
import { startOfDay, addDays, format, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FutureOutlook() {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);

    // Fetch Tomorrow
    const { appointments: tomorrowAppts, isLoading: loadingTomorrow } = useMedicalAppointments({
        startDate: startOfDay(tomorrow),
        endDate: endOfDay(tomorrow),
        status: 'all'
    });

    // Fetch Day After
    const { appointments: dayAfterAppts, isLoading: loadingDayAfter } = useMedicalAppointments({
        startDate: startOfDay(dayAfter),
        endDate: endOfDay(dayAfter),
        status: 'all'
    });

    // Determine "High Traffic" if > 5 appointments (arbitrary threshold for visual cue)
    const getOccupancyLabel = (count: number) => {
        if (count === 0) return 'Livre';
        if (count < 4) return 'Tranquilo';
        if (count < 8) return 'Moderado';
        return 'Cheio';
    };

    const getOccupancyColor = (count: number) => {
        if (count === 0) return 'text-muted-foreground';
        if (count < 4) return 'text-green-600';
        if (count < 8) return 'text-amber-600';
        return 'text-red-600';
    };

    if (loadingTomorrow || loadingDayAfter) {
        return <div className="h-full bg-muted/20 animate-pulse rounded-lg"></div>;
    }

    return (
        <Card className="h-full border-none shadow-none bg-muted/10">
            <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Próximos Dias
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    {/* Tomorrow */}
                    <div className="bg-background rounded-lg p-3 border shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                            Amanhã
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                            {format(tomorrow, 'dd MMM', { locale: ptBR })}
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold">{tomorrowAppts.length}</span>
                            <span className={`text-[10px] font-medium ${getOccupancyColor(tomorrowAppts.length)}`}>
                                {getOccupancyLabel(tomorrowAppts.length)}
                            </span>
                        </div>
                    </div>

                    {/* Day After */}
                    <div className="bg-background rounded-lg p-3 border shadow-sm">
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                            {format(dayAfter, 'EEEE', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                            {format(dayAfter, 'dd MMM', { locale: ptBR })}
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold">{dayAfterAppts.length}</span>
                            <span className={`text-[10px] font-medium ${getOccupancyColor(dayAfterAppts.length)}`}>
                                {getOccupancyLabel(dayAfterAppts.length)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-background rounded border">
                        <Users className="w-3 h-3" />
                        <span>Total de <strong>{tomorrowAppts.length + dayAfterAppts.length}</strong> pacientes nos próximos 2 dias.</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
