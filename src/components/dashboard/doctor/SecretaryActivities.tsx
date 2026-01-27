
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Clock, UserPlus, Phone, CalendarCheck2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data integration
const ACTIVITIES = [
    {
        id: 1,
        type: 'confirmation',
        secretary: 'Ana Paula',
        patient: 'Roberto Silva',
        time: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        description: 'confirmou consulta de amanhã',
    },
    {
        id: 2,
        type: 'scheduling',
        secretary: 'Ana Paula',
        patient: 'Maria Oliveira',
        time: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
        description: 'agendou retorno para dia 25/10',
    },
    {
        id: 3,
        type: 'call',
        secretary: 'Carla',
        patient: 'Joao Santos',
        time: new Date(Date.now() - 1000 * 60 * 120), // 2h ago
        description: 'registrou tentativa de contato (sem resposta)',
    },
];

export function SecretaryActivities() {

    const getIcon = (type: string) => {
        switch (type) {
            case 'confirmation': return <CheckCheck className="w-3.5 h-3.5 text-green-500" />;
            case 'scheduling': return <CalendarCheck2 className="w-3.5 h-3.5 text-blue-500" />;
            case 'new_patient': return <UserPlus className="w-3.5 h-3.5 text-purple-500" />;
            case 'call': return <Phone className="w-3.5 h-3.5 text-orange-500" />;
            default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 pb-2 border-b border-border/50 bg-muted/20">
                <h3 className="tex-sm font-semibold flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">SEC</AvatarFallback>
                    </Avatar>
                    Atividades da Secretaria
                </h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {ACTIVITIES.map((activity, i) => (
                        <div key={activity.id} className="relative pl-4 pb-0 last:pb-0">
                            {/* Timeline line */}
                            {i !== ACTIVITIES.length - 1 && (
                                <div className="absolute left-[5.5px] top-2 bottom-0 w-[1px] bg-border" />
                            )}

                            <div className="flex gap-3">
                                <div className="relative z-10 w-3 h-3 rounded-full bg-background border-2 border-primary mt-1.5 shrink-0" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-foreground">{activity.patient}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(activity.time, 'HH:mm')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-tight">
                                        <span className="font-medium text-primary/80">{activity.secretary}</span> {activity.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5 bg-muted/30 w-fit px-1.5 py-0.5 rounded-md">
                                        {getIcon(activity.type)}
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                            {activity.type === 'new_patient' ? 'Novo Paciente' :
                                                activity.type === 'scheduling' ? 'Agendamento' :
                                                    activity.type === 'confirmation' ? 'Confirmação' : 'Contato'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
