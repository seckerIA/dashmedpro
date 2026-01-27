'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaCardProps {
    appointment: MedicalAppointmentWithRelations;
    onClick: (appointment: MedicalAppointmentWithRelations) => void;
}

export function AgendaCard({ appointment, onClick }: AgendaCardProps) {
    if (!appointment.contact) return null;

    const { contact, start_time, status, appointment_type } = appointment;
    const initial = contact.full_name?.charAt(0).toUpperCase() || 'P';

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
            case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'scheduled': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const statusLabel = {
        'confirmed': 'Confirmado',
        'completed': 'Realizado',
        'scheduled': 'Agendado',
        'cancelled': 'Cancelado',
        'no_show': 'Faltou',
        'in_progress': 'Em Andamento'
    }[status] || status;

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/60 hover:border-l-primary"
            onClick={() => onClick(appointment)}
        >
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] py-1 px-2 bg-muted/50 rounded text-center">
                        <span className="text-sm font-bold text-foreground">
                            {format(new Date(start_time), 'HH:mm')}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground font-medium">
                            {format(new Date(start_time), 'aaa', { locale: ptBR })}
                        </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={contact.photo_url || undefined} />
                            <AvatarFallback className="text-xs font-semibold bg-primary/5 text-primary">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm leading-none mb-1">
                                {contact.full_name || 'Paciente sem nome'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                    {appointment_type === 'first_visit' ? '1ª Vez' : 'Retorno'}
                                </Badge>
                                {contact.tags?.[0] && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                        #{contact.tags[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(status)}`}>
                    {status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
                    {status === 'scheduled' && <Clock className="w-3 h-3" />}
                    {status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
                    <span>{statusLabel}</span>
                </div>
            </CardContent>
        </Card>
    );
}
