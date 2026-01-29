
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

export function FutureOutlook() {
    const { user } = useAuth();
    const today = useMemo(() => new Date(), []);

    // Fetch appointments for the next 3 days
    const day1 = useMemo(() => addDays(today, 1), [today]);
    const day2 = useMemo(() => addDays(today, 2), [today]);
    const day3 = useMemo(() => addDays(today, 3), [today]);

    const { appointments: day1Appointments, isLoading: loading1 } = useMedicalAppointments({
        startDate: startOfDay(day1),
        endDate: endOfDay(day1),
        doctorIds: user?.id ? [user.id] : undefined
    });

    const { appointments: day2Appointments, isLoading: loading2 } = useMedicalAppointments({
        startDate: startOfDay(day2),
        endDate: endOfDay(day2),
        doctorIds: user?.id ? [user.id] : undefined
    });

    const { appointments: day3Appointments, isLoading: loading3 } = useMedicalAppointments({
        startDate: startOfDay(day3),
        endDate: endOfDay(day3),
        doctorIds: user?.id ? [user.id] : undefined
    });

    const isLoading = loading1 || loading2 || loading3;

    // Count appointments and procedures (procedures with longer duration)
    const countAppointments = (appointments: typeof day1Appointments) => {
        if (!appointments) return { appointments: 0, procedures: 0 };
        const total = appointments.length;
        // Consider appointments > 60 minutes as longer procedures
        const procedures = appointments.filter(apt =>
            apt.procedure && apt.procedure.duration_minutes && apt.procedure.duration_minutes > 60
        ).length;
        return { appointments: total, procedures };
    };

    const nextDays = useMemo(() => [
        { date: day1, ...countAppointments(day1Appointments) },
        { date: day2, ...countAppointments(day2Appointments) },
        { date: day3, ...countAppointments(day3Appointments) },
    ], [day1, day2, day3, day1Appointments, day2Appointments, day3Appointments]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Próximos Dias</h3>
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Carregando agenda...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Próximos Dias</h3>
            <div className="space-y-3">
                {nextDays.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-muted/50 w-10 h-10 rounded-lg flex flex-col items-center justify-center border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                    {format(day.date, 'EEE', { locale: ptBR })}
                                </span>
                                <span className="text-sm font-bold leading-none text-foreground">
                                    {format(day.date, 'dd')}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {day.appointments === 0
                                        ? 'Sem atendimentos'
                                        : day.appointments === 1
                                            ? '1 atendimento'
                                            : `${day.appointments} atendimentos`
                                    }
                                </p>
                                {day.procedures > 0 && (
                                    <p className="text-xs text-orange-500 font-medium flex items-center gap-1">
                                        {day.procedures} procedimento{day.procedures > 1 ? 's' : ''} longo{day.procedures > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        {day.appointments > 10 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10">
                                Cheio
                            </Badge>
                        )}
                        {day.appointments === 0 && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-muted">
                                Livre
                            </Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
