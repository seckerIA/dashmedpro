'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, FileText, MessageCircle, Calendar, Clock, User } from 'lucide-react';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientQuickViewProps {
    appointment: MedicalAppointmentWithRelations | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartConsultation?: (appointmentId: string) => void;
}

export function PatientQuickView({
    appointment,
    open,
    onOpenChange,
    onStartConsultation
}: PatientQuickViewProps) {
    if (!appointment || !appointment.contact) return null;

    const { contact, start_time } = appointment;
    const initial = contact.full_name?.charAt(0).toUpperCase() || 'P';

    const handleWhatsApp = () => {
        if (!contact.phone) return;
        const cleanPhone = contact.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={contact.photo_url || undefined} />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                {contact.full_name}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                    {appointment.appointment_type === 'first_visit' ? 'Primeira Consulta' : 'Retorno'}
                                </Badge>
                                {contact.tags && contact.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Appointment Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Agendamento de Hoje</p>
                            <p className="text-sm text-muted-foreground capitalize">
                                {start_time && format(new Date(start_time), "EEEE, HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <Badge className={
                                appointment.status === 'confirmed' ? 'bg-green-500' :
                                    appointment.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                            }>
                                {appointment.status === 'confirmed' ? 'Confirmado' :
                                    appointment.status === 'completed' ? 'Concluído' :
                                        appointment.status === 'scheduled' ? 'Agendado' : appointment.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contato</h4>

                            {contact.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{contact.phone}</span>
                                </div>
                            )}

                            {contact.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{contact.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados</h4>
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{contact.cpf || 'CPF não informado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => onStartConsultation?.(appointment.id)}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Abrir Prontuário
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                            size="lg"
                            onClick={handleWhatsApp}
                            disabled={!contact.phone}
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
