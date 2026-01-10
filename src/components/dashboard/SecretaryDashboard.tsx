/**
 * SecretaryDashboard - Dashboard simplificado para Secretárias
 * 
 * Foco em: Agenda do dia, Pendências, Ações rápidas
 * Design: Limpo, intuitivo, sem sobrecarga de informações
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard, QuickActionCard } from "@/components/dashboard/MetricCard";
import { HotLeadsCard } from "@/components/dashboard/HotLeadsCard";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { useSecretaryMetrics } from "@/hooks/useSecretaryMetrics";
import { useSecretarySinalMetrics } from "@/hooks/useSecretarySinalMetrics";
import { useSecretaryProductivityMetrics } from "@/hooks/useSecretaryProductivityMetrics";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserPlus,
  CalendarCheck,
  Stethoscope,
  MessageSquare,
  DollarSign,
  Timer,
  PhoneCall,
  Activity,
  Target,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const SecretaryDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error } = useSecretaryMetrics();
  const { data: sinalMetrics, isLoading: isLoadingSinal } = useSecretarySinalMetrics();
  const { data: productivityMetrics, isLoading: isLoadingProductivity } = useSecretaryProductivityMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
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

  const getDateLabel = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return "Hoje";
      if (isTomorrow(date)) return "Amanhã";
      return format(date, "dd/MM", { locale: ptBR });
    } catch {
      return "-";
    }
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

  // Calcular taxa de confirmação
  const confirmationRate = metrics?.todayAppointments && metrics.todayAppointments > 0
    ? ((metrics.confirmedToday || 0) / metrics.todayAppointments) * 100
    : 0;

  // Status geral do dia
  const pendingCount = metrics?.pendingConfirmation || 0;
  const dayStatus = pendingCount === 0 ? "success" : pendingCount <= 3 ? "warning" : "danger";

  return (
    <div className="min-h-screen space-y-5 bg-background font-sans px-3 sm:px-4 lg:px-6 pb-10">

      {/* Header Simples */}
      <AnimatedWrapper animationType="fadeIn" delay={0}>
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Painel da Secretária
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={() => navigate('/calendar')} className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </AnimatedWrapper>

      {/* HERO: 3 Métricas Principais do Dia */}
      <AnimatedWrapper animationType="fadeIn" delay={0.05}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Agenda Hoje */}
          <Card className={cn(
            "relative overflow-hidden bg-gradient-to-br border transition-all duration-300 hover:shadow-lg",
            "from-blue-500/20 to-blue-500/5 border-blue-500/30"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Agenda Hoje
                  </span>
                </div>
                <Badge variant="outline" className="text-xs gap-1 bg-background/50">
                  {metrics?.confirmedToday || 0} ✓
                </Badge>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight mb-1">
                {metrics?.todayAppointments || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                consultas agendadas
              </p>
              <div className="pt-3 mt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  💡 {metrics?.todayAppointments === 0
                    ? "Sem consultas para hoje"
                    : `${metrics?.confirmedToday || 0} confirmadas, ${pendingCount} pendentes`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pendências */}
          <Card className={cn(
            "relative overflow-hidden bg-gradient-to-br border transition-all duration-300 hover:shadow-lg cursor-pointer",
            dayStatus === "success" && "from-green-500/20 to-green-500/5 border-green-500/30",
            dayStatus === "warning" && "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
            dayStatus === "danger" && "from-red-500/20 to-red-500/5 border-red-500/30"
          )}
            onClick={() => navigate('/calendar?status=scheduled')}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    dayStatus === "success" && "bg-green-500/20 text-green-600",
                    dayStatus === "warning" && "bg-yellow-500/20 text-yellow-600",
                    dayStatus === "danger" && "bg-red-500/20 text-red-600"
                  )}>
                    {dayStatus === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Aguardando Confirmação
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight mb-1">
                {pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">
                pacientes para contatar
              </p>
              <div className="pt-3 mt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  {dayStatus === "success"
                    ? "✅ Todas as consultas confirmadas!"
                    : dayStatus === "warning"
                      ? "⚠️ Alguns pacientes precisam confirmar"
                      : "🔔 Vários pacientes aguardam confirmação"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Confirmação */}
          <Card className={cn(
            "relative overflow-hidden bg-gradient-to-br border transition-all duration-300 hover:shadow-lg",
            confirmationRate >= 80 && "from-green-500/20 to-green-500/5 border-green-500/30",
            confirmationRate >= 50 && confirmationRate < 80 && "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
            confirmationRate < 50 && "from-primary/20 to-primary/5 border-primary/30"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    confirmationRate >= 80 && "bg-green-500/20 text-green-600",
                    confirmationRate >= 50 && confirmationRate < 80 && "bg-yellow-500/20 text-yellow-600",
                    confirmationRate < 50 && "bg-primary/20 text-primary"
                  )}>
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Taxa de Confirmação
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight mb-1">
                {confirmationRate.toFixed(0)}%
              </p>
              <Progress value={confirmationRate} className="h-2 mt-2" />
              <div className="pt-3 mt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  💡 {confirmationRate >= 80
                    ? "Excelente taxa de confirmação!"
                    : confirmationRate >= 50
                      ? "Bom progresso, continue confirmando"
                      : "Foco em confirmar mais pacientes"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedWrapper>

      {/* Grid Principal: Quick Actions + Próximas Consultas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <AnimatedWrapper animationType="slideUp" delay={0.1}>
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionCard
                title="Calendário"
                description="Ver agenda completa"
                variant="red"
                icon={Calendar}
                onClick={() => navigate('/calendar')}
              />
              <QuickActionCard
                title="WhatsApp"
                description="Conversas ativas"
                variant="green"
                icon={MessageSquare}
                onClick={() => navigate('/whatsapp')}
              />
              <QuickActionCard
                title="Médicos"
                description="Ver disponibilidade"
                variant="cyan"
                icon={Stethoscope}
                onClick={() => navigate('/calendar')}
              />
              <QuickActionCard
                title="Pagamentos"
                description="Sinais e recebimentos"
                variant="yellow"
                icon={DollarSign}
                onClick={() => navigate('/financeiro')}
              />
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Próximas Consultas do Dia */}
        <AnimatedWrapper animationType="slideUp" delay={0.15} className="lg:col-span-2">
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Próximas Consultas</CardTitle>
                  <CardDescription>Pacientes agendados para hoje</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {metrics?.todayAppointments === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhuma consulta para hoje</p>
                  <Button variant="outline" className="mt-3" onClick={() => navigate('/calendar')}>
                    Agendar consulta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics?.upcomingAppointments?.slice(0, 5).map((apt: any, index: number) => (
                    <div
                      key={apt.id || index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{apt.patient_name || 'Paciente'}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.start_time ? format(parseISO(apt.start_time), "HH:mm") : '-'} • {apt.procedure || 'Consulta'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(apt.status || 'pendente')}
                        {apt.status === 'pendente' && (
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Métricas de Sinais (Colapsável) */}
      {!isLoadingSinal && sinalMetrics && (
        <AnimatedWrapper animationType="slideUp" delay={0.2}>
          <CollapsibleSection
            id="secretary-sinais"
            title="Sinais e Pagamentos"
            icon={DollarSign}
            badge={sinalMetrics.pendingSinais + sinalMetrics.receivedSinais}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {sinalMetrics.pendingSinais}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(sinalMetrics.pendingValue)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Recebidos</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {sinalMetrics.receivedSinais}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(sinalMetrics.receivedValue)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Total</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {sinalMetrics.totalSinais}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(sinalMetrics.totalValue)}
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </AnimatedWrapper>
      )}

      {/* Métricas de Produtividade (Colapsável) */}
      {!isLoadingProductivity && productivityMetrics && (
        <AnimatedWrapper animationType="slideUp" delay={0.25}>
          <CollapsibleSection
            id="secretary-productivity"
            title="Métricas de Produtividade"
            icon={Activity}
            badge={`Score: ${productivityMetrics.performanceScore}/100`}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Tempo de Resposta */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Tempo Resposta</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {productivityMetrics.avgResponseTimeMinutes.toFixed(0)} min
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {productivityMetrics.responsesUnder5Min} respostas {'<'}5min
                </p>
              </div>

              {/* Chamadas */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <PhoneCall className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Chamadas</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {productivityMetrics.totalCalls}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {productivityMetrics.avgCallDurationSeconds
                    ? `${Math.round(productivityMetrics.avgCallDurationSeconds / 60)}min média`
                    : 'Sem dados'}
                </p>
              </div>

              {/* Taxa de Confirmação */}
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Confirmação</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {productivityMetrics.confirmationRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No-show: {productivityMetrics.noShowRate.toFixed(0)}%
                </p>
              </div>

              {/* Mensagens */}
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-600">Mensagens</span>
                </div>
                <p className="text-2xl font-bold text-cyan-600">
                  {productivityMetrics.messagesSent}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  enviadas esta semana
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </AnimatedWrapper>
      )}

      {/* Médicos Disponíveis (Colapsável) */}
      {metrics?.availableDoctors && metrics.availableDoctors.length > 0 && (
        <AnimatedWrapper animationType="slideUp" delay={0.3}>
          <CollapsibleSection
            id="secretary-doctors"
            title="Médicos Disponíveis"
            icon={Stethoscope}
            badge={metrics.availableDoctors.length}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.availableDoctors.map((doctor: any, index: number) => (
                <div
                  key={doctor.id || index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Dr(a). {doctor.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialty || 'Clínico Geral'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doctor.todaySlots || 0} vagas
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </AnimatedWrapper>
      )}

      {/* Contatos Recentes (Colapsável) */}
      <AnimatedWrapper animationType="slideUp" delay={0.35}>
        <CollapsibleSection
          id="secretary-contacts"
          title="Contatos Recentes"
          icon={UserPlus}
          badge={`${metrics?.newContactsToday || 0} hoje`}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Novos Hoje</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.newContactsToday || 0}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Esta Semana</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.newContactsWeek || 0}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Total</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {metrics?.totalContacts || 0}
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </AnimatedWrapper>
    </div>
  );
};

export default SecretaryDashboard;
