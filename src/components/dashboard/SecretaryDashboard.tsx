import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard, QuickActionCard } from "@/components/dashboard/MetricCard";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { useSecretaryMetrics } from "@/hooks/useSecretaryMetrics";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserPlus,
  CalendarCheck,
  CalendarClock,
  Stethoscope,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error } = useSecretaryMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando seu dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-destructive">
          Erro ao carregar dados: {error.message}
        </div>
      </div>
    );
  }

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Confirmado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen space-y-4 sm:space-y-6 lg:space-y-8 bg-background font-sans px-3 sm:px-4 lg:px-6">

      {/* Header com saudação */}
      <AnimatedWrapper animationType="fadeIn" delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Painel da Secretária
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie agendamentos e atendimentos
            </p>
          </div>
          <Button onClick={() => navigate('/calendar')} className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </AnimatedWrapper>

      {/* Métricas de Agendamentos do Dia */}
      <AnimatedWrapper animationType="slideUp" delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Consultas Hoje"
            value={metrics?.todayAppointments || 0}
            variant="red"
            icon={Calendar}
            trend={{
              value: metrics?.confirmedToday || 0,
              label: `${metrics?.confirmedToday || 0} confirmadas`
            }}
          />

          <MetricCard
            title="Aguardando Confirmação"
            value={metrics?.pendingConfirmation || 0}
            variant="yellow"
            icon={AlertCircle}
            trend={{
              value: 0,
              label: "pacientes para contatar"
            }}
          />

          <MetricCard
            title="Consultas na Semana"
            value={metrics?.weekAppointments || 0}
            variant="cyan"
            icon={CalendarClock}
            trend={{
              value: 0,
              label: "próximos 7 dias"
            }}
          />

          <MetricCard
            title="Agendados por Mim"
            value={metrics?.appointmentsScheduledByMe || 0}
            variant="green"
            icon={CheckCircle2}
            trend={{
              value: 0,
              label: "este mês"
            }}
          />
        </div>
      </AnimatedWrapper>

      {/* Próximas Consultas */}
      <AnimatedWrapper animationType="slideUp" delay={0.2}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximas Consultas
                </CardTitle>
                <CardDescription>Consultas agendadas para os próximos dias</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/calendar')}>
                Ver Agenda Completa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {metrics?.upcomingAppointments && metrics.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {metrics.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-md bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                          {getDateLabel(appointment.date)}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {appointment.time}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {appointment.patientName}
                          </span>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="h-4 w-4" />
                          <span>Dr(a). {appointment.doctorName}</span>
                          {appointment.procedure && (
                            <>
                              <span>•</span>
                              <span>{appointment.procedure}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'pendente' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma consulta agendada para os próximos dias</p>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedWrapper>

      {/* Grid com Médicos e Contatos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Lista de Médicos */}
        <AnimatedWrapper animationType="slideUp" delay={0.3}>
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Médicos Disponíveis
              </CardTitle>
              <CardDescription>Equipe médica da clínica</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.doctors && metrics.doctors.length > 0 ? (
                <div className="space-y-2">
                  {metrics.doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {doctor.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doctor.name}</p>
                          {doctor.specialty && (
                            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        {doctor.appointmentsToday || 0} hoje
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum médico cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Métricas de Contatos */}
        <AnimatedWrapper animationType="slideUp" delay={0.4}>
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Contatos e Pacientes
              </CardTitle>
              <CardDescription>Novos contatos registrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">
                    {metrics?.newContactsToday || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-cyan-500/10">
                  <p className="text-2xl font-bold text-cyan-600">
                    {metrics?.newContactsWeek || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Esta Semana</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">
                    {metrics?.totalContacts || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {/* Placeholder para futuras métricas de WhatsApp */}
              <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 opacity-50" />
                  <div>
                    <p className="font-medium">Integração WhatsApp</p>
                    <p className="text-sm">Em breve: métricas de conversas e leads</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Ações Rápidas */}
      <AnimatedWrapper animationType="slideUp" delay={0.5}>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Acesso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickActionCard
              title="Agenda"
              description="Ver calendário"
              variant="red"
              icon={Calendar}
              onClick={() => navigate('/calendar')}
            />
            <QuickActionCard
              title="Novo Paciente"
              description="Cadastrar contato"
              variant="cyan"
              icon={UserPlus}
              onClick={() => navigate('/crm')}
            />
            <QuickActionCard
              title="Follow-ups"
              description="Pendências"
              variant="yellow"
              icon={Phone}
              onClick={() => navigate('/follow-ups')}
            />
            <QuickActionCard
              title="Tarefas"
              description="Minhas tarefas"
              variant="green"
              icon={CheckCircle2}
              onClick={() => navigate('/tarefas')}
            />
          </div>
        </div>
      </AnimatedWrapper>
    </div>
  );
};

export default SecretaryDashboard;
