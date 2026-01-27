
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CalendarX2 } from "lucide-react";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { AgendaCard } from "./AgendaCard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, endOfDay } from "date-fns";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function TodaysAgenda() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    const today = useMemo(() => new Date(), []);

    const {
        appointments,
        isLoading,
        updateAppointment
    } = useMedicalAppointments({
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        isSecretaria: false, // Explicitly false for doctor view, though default
        doctorIds: user?.id ? [user.id] : undefined
    });

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await updateAppointment.mutateAsync({ id, updates: { status: status as any } });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[100px] w-full rounded-xl" />
                <Skeleton className="h-[100px] w-full rounded-xl" />
                <Skeleton className="h-[100px] w-full rounded-xl" />
            </div>
        );
    }

    if (!appointments || appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-[300px] border border-dashed border-border/50 rounded-xl bg-muted/20">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <CalendarX2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Agenda Livre</h3>
                <p className="text-muted-foreground mb-4 max-w-[250px]">
                    Você não possui atendimentos agendados para hoje.
                </p>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate('/calendar?openForm=true')}
                >
                    <Plus className="w-4 h-4" />
                    Novo Agendamento
                </Button>
            </div>
        );
    }

    // Sort by time
    const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Atendimentos do Dia
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {appointments.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-3">
                {sortedAppointments.map((apt) => (
                    <AgendaCard
                        key={apt.id}
                        appointment={apt}
                        onStatusChange={handleStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}
