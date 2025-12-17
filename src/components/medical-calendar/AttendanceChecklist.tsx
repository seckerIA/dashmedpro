import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Phone } from "lucide-react";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function AttendanceChecklist() {
  const { toast } = useToast();
  const { appointments, markAsCompleted, markAsNoShow } = useMedicalAppointments({});

  // Filtrar apenas consultas de hoje com pagamento pendente
  const todayPendingAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    return (
      isToday(aptDate) &&
      apt.payment_status === "pending" &&
      apt.status !== "completed" &&
      apt.status !== "no_show" &&
      apt.status !== "cancelled"
    );
  }) || [];

  // Verificar se há consultas antigas (mais de 12h) sem marcação
  const overdueAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    const now = new Date();
    const hoursDiff = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);

    return (
      hoursDiff > 12 &&
      apt.payment_status === "pending" &&
      apt.status !== "completed" &&
      apt.status !== "no_show" &&
      apt.status !== "cancelled"
    );
  }) || [];

  const handleMarkAttended = async (appointmentId: string) => {
    try {
      await markAsCompleted.mutateAsync(appointmentId);
      toast({
        title: "Comparecimento confirmado",
        description: "Pagamento registrado no financeiro automaticamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar comparecimento",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      await markAsNoShow.mutateAsync(appointmentId);
      toast({
        title: "Marcado como não compareceu",
        description: "A consulta foi marcada como falta.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao marcar não comparecimento",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  if (todayPendingAppointments.length === 0 && overdueAppointments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alerta de consultas atrasadas */}
      {overdueAppointments.length > 0 && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="font-medium">
            <span className="font-bold">{overdueAppointments.length}</span> consulta(s) com mais de 12 horas sem marcação de comparecimento!
            Verifique e atualize o status.
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist de hoje */}
      {todayPendingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Checklist de Comparecimento - Hoje
            </CardTitle>
            <CardDescription>
              Consultas com pagamento pendente aguardando confirmação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayPendingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">
                        {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}
                      </span>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {appointment.contact?.full_name || "Sem nome"}
                        </span>
                      </div>
                      {appointment.contact?.phone && (
                        <>
                          <div className="h-4 w-px bg-border" />
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{appointment.contact.phone}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-16">
                      <Badge variant="outline" className="text-xs">
                        {appointment.title}
                      </Badge>
                      {appointment.estimated_value && (
                        <span className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(appointment.estimated_value)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleMarkAttended(appointment.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Compareceu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkNoShow(appointment.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Não Compareceu
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
