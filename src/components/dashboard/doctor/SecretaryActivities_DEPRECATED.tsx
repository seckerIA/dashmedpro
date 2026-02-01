
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Clock, UserPlus, Phone, CalendarCheck2, MessageCircle, Mail, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSecretaryActivities, ActivityType } from "@/hooks/useSecretaryActivities";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SecretaryActivities() {
    const navigate = useNavigate();
    const { data: activities, isLoading } = useSecretaryActivities();

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case 'confirmation': return <CheckCheck className="w-3.5 h-3.5 text-green-500" />;
            case 'scheduling': return <CalendarCheck2 className="w-3.5 h-3.5 text-blue-500" />;
            case 'new_patient': return <UserPlus className="w-3.5 h-3.5 text-purple-500" />;
            case 'call': return <Phone className="w-3.5 h-3.5 text-orange-500" />;
            case 'whatsapp': return <MessageCircle className="w-3.5 h-3.5 text-green-500" />;
            case 'email': return <Mail className="w-3.5 h-3.5 text-blue-400" />;
            case 'note': return <FileText className="w-3.5 h-3.5 text-gray-500" />;
            default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    };

    const getTypeLabel = (type: ActivityType) => {
        switch (type) {
            case 'new_patient': return 'Novo Paciente';
            case 'scheduling': return 'Agendamento';
            case 'confirmation': return 'Confirmação';
            case 'call': return 'Ligação';
            case 'whatsapp': return 'WhatsApp';
            case 'email': return 'Email';
            case 'note': return 'Anotação';
            default: return 'Contato';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-primary/5">
                <Avatar className="w-8 h-8 rounded-lg shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-lg">SEC</AvatarFallback>
                </Avatar>
                <h3 className="text-sm font-semibold text-foreground">
                    Atividades da Secretaria
                </h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !activities || activities.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-xs text-muted-foreground">Nenhuma atividade nas últimas 24h</p>
                        </div>
                    ) : (
                        activities.map((activity, i) => (
                            <div key={activity.id} className="relative pl-4 pb-0 last:pb-0">
                                {/* Timeline line */}
                                {i !== activities.length - 1 && (
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
                                                {getTypeLabel(activity.type)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            <div className="p-3 border-t bg-muted/20">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/crm')}>
                    Ver todas as negociações
                </Button>
            </div>
        </div>
    );
}
