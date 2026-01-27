
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FutureOutlook() {
    // Mock data for now
    const nextDays = [
        { date: addDays(new Date(), 1), appointments: 12, surgeries: 1 },
        { date: addDays(new Date(), 2), appointments: 8, surgeries: 0 },
        { date: addDays(new Date(), 3), appointments: 15, surgeries: 2 },
    ];

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
                                    {day.appointments} atendimentos
                                </p>
                                {day.surgeries > 0 && (
                                    <p className="text-xs text-orange-500 font-medium flex items-center gap-1">
                                        {day.surgeries} cirurgia(s)
                                    </p>
                                )}
                            </div>
                        </div>
                        {day.appointments > 10 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10">
                                Cheio
                            </Badge>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
