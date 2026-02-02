
import { AlertCircle, Calendar, CheckCircle2, Clock, DollarSign, FileText, MoreVertical, Phone, Video, Wallet, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PatientQuickView } from "./PatientQuickView";
import { useState } from "react";

interface AgendaCardProps {
    appointment: any;
    onStatusChange?: (id: string, status: string) => void;
}

export function AgendaCard({ appointment, onStatusChange }: AgendaCardProps) {
    const [showQuickView, setShowQuickView] = useState(false);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'consulta': return <FileText className="h-3.5 w-3.5" />;
            case 'retorno': return <Clock className="h-3.5 w-3.5" />;
            case 'procedimento': return <Activity className="h-3.5 w-3.5" />;
            case 'exame': return <Activity className="h-3.5 w-3.5" />;
            default: return <FileText className="h-3.5 w-3.5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'agendado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'confirmed': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'in_progress': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'no_show': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'agendado': return 'Agendado';
            case 'confirmed': return 'Confirmado';
            case 'in_progress': return 'Em Atendimento';
            case 'completed': return 'Concluído';
            case 'cancelled': return 'Cancelado';
            case 'no_show': return 'Faltou';
            case 'bloqueado': return 'Bloqueio';
            default: return status;
        }
    };

    const getStatusDescription = (status: string) => {
        switch (status) {
            case 'agendado': return 'Consulta agendada, aguardando confirmação do paciente';
            case 'confirmed': return 'Paciente confirmou presenca';
            case 'in_progress': return 'Atendimento em andamento';
            case 'completed': return 'Consulta finalizada com sucesso';
            case 'cancelled': return 'Consulta foi cancelada';
            case 'no_show': return 'Paciente nao compareceu';
            case 'bloqueado': return 'Horario bloqueado na agenda';
            default: return 'Status da consulta';
        }
    };

    return (
        <>
            <Card
                className={cn(
                    "group transition-all duration-300 border hover:border-primary/20 bg-card/50 hover:bg-card"
                )}
            >
                <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Time & Indicator */}
                        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-[80px] border-b sm:border-b-0 sm:border-r border-border/50 pb-3 sm:pb-0 sm:pr-4">
                            <div className="text-lg font-bold tracking-tight">
                                {format(new Date(appointment.start_time), 'HH:mm')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 uppercase tracking-wider font-semibold cursor-help", getStatusColor(appointment.status))}>
                                                {getStatusLabel(appointment.status)}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{getStatusDescription(appointment.status)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                            {/* Patient Info */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => setShowQuickView(true)}>
                                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                                        <AvatarImage />
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                            {(appointment.contact?.full_name || appointment.patient?.name)?.substring(0, 2).toUpperCase() || 'PAC'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm leading-none truncate group-hover:text-primary transition-colors">
                                            {appointment.contact?.full_name || appointment.patient?.name || 'Paciente não identificado'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1.5">
                                            {appointment.appointment_type && (
                                                <span className="flex items-center gap-1">
                                                    {getTypeIcon(appointment.appointment_type)}
                                                    {appointment.appointment_type.charAt(0).toUpperCase() + appointment.appointment_type.slice(1)}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-primary">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => setShowQuickView(true)}>
                                            Ver Prontuário
                                        </DropdownMenuItem>
                                        {(appointment.contact?.phone || appointment.patient?.phone) && (
                                            <DropdownMenuItem onClick={() => window.open(`https://wa.me/${appointment.contact?.phone || appointment.patient?.phone}`, '_blank')}>
                                                <Phone className="mr-2 h-4 w-4" /> WhatsApp
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, 'in_progress')}>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-purple-500" /> Iniciar Atendimento
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, 'completed')}>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Concluir
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, 'cancelled')}>
                                            <AlertCircle className="mr-2 h-4 w-4 text-red-500" /> Cancelar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Procedures / Notes */}
                            {appointment.notes && (
                                <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 border border-border/50 line-clamp-1">
                                    Obs: {appointment.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PatientQuickView
                open={showQuickView}
                onOpenChange={setShowQuickView}
                patientId={appointment.contact_id || appointment.patient_id}
                patientName={appointment.contact?.full_name || appointment.patient?.name}
            />
        </>
    );
}
