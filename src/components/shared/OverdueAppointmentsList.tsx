import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, Calendar, User, DollarSign, AlertTriangle } from "lucide-react";
import { useOverdueAppointments } from "@/hooks/useOverdueAppointments";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OverdueAppointmentsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OverdueAppointmentsList({ open, onOpenChange }: OverdueAppointmentsListProps) {
  const { overdueAppointments, isLoading } = useOverdueAppointments();
  const { markAsCompleted, markAsNoShow, appointments } = useMedicalAppointments({});
  const { isMedico, isAdmin } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleMarkAsCompleted = async (appointmentId: string) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      console.log('Marcando consulta como concluída:', appointmentId);
      await markAsCompleted.mutateAsync(appointmentId);
      toast({
        title: "Status atualizado",
        description: "Consulta marcada como concluída.",
      });
      
      // Se for médico ou admin, buscar o appointment completo e redirecionar
      if ((isMedico || isAdmin) && appointments) {
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (appointment && appointment.contact_id) {
          navigate(`/prontuarios?patientId=${appointment.contact_id}&tab=historico`);
        }
      }
    } catch (error: any) {
      console.error('Erro ao marcar como concluída:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleMarkAsNoShow = async (appointmentId: string) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      console.log('Marcando consulta como não compareceu:', appointmentId);
      await markAsNoShow.mutateAsync(appointmentId);
      toast({
        title: "Status atualizado",
        description: "Consulta marcada como não compareceu.",
      });
    } catch (error: any) {
      console.error('Erro ao marcar como não compareceu:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleViewInCalendar = (appointmentId: string) => {
    navigate(`/calendar?appointment=${appointmentId}`);
    onOpenChange(false);
  };

  const getHoursOverdue = (startTime: string) => {
    const aptDate = new Date(startTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);
    return Math.floor(hoursDiff);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultas Sem Marcação</DialogTitle>
            <DialogDescription>Carregando...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Consultas Sem Marcação de Comparecimento
          </DialogTitle>
          <DialogDescription>
            {overdueAppointments.length} consulta(s) com mais de 12 horas aguardando confirmação
          </DialogDescription>
        </DialogHeader>

        {overdueAppointments.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Todas as consultas estão atualizadas!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Não há consultas pendentes de marcação de comparecimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Atraso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueAppointments.map((appointment) => {
                  const hoursOverdue = getHoursOverdue(appointment.start_time);
                  const appointmentDate = parseISO(appointment.start_time);
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(appointmentDate, "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {appointment.contact?.full_name || "Sem paciente"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {appointment.appointment_type === 'first_visit' ? 'Primeira Consulta' :
                           appointment.appointment_type === 'return' ? 'Retorno' :
                           appointment.appointment_type === 'procedure' ? 'Procedimento' :
                           appointment.appointment_type === 'exam' ? 'Exame' :
                           appointment.appointment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.estimated_value ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatCurrency(appointment.estimated_value)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="destructive"
                          className="flex items-center gap-1 w-fit"
                        >
                          <Clock className="h-3 w-3" />
                          {hoursOverdue}h
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInCalendar(appointment.id)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkAsCompleted(appointment.id)}
                            disabled={processingIds.has(appointment.id) || markAsCompleted.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {processingIds.has(appointment.id) ? "Processando..." : "Compareceu"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleMarkAsNoShow(appointment.id)}
                            disabled={processingIds.has(appointment.id) || markAsNoShow.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {processingIds.has(appointment.id) ? "Processando..." : "Faltou"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Total: {overdueAppointments.length} consulta(s) pendente(s)
              </p>
              <Button
                onClick={() => {
                  navigate("/calendar");
                  onOpenChange(false);
                }}
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Abrir Agenda Completa
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

