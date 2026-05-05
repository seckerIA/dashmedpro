import { useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, subDays, startOfDay, endOfDay, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Trophy,
  DollarSign,
  Receipt,
  UserCheck,
  Clock,
  TrendingUp,
  Calendar,
  Users as UsersIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useSecretaryPerformance } from '@/hooks/useSecretaryPerformance';
import { SecretaryPodium } from '@/components/performance/SecretaryPodium';
import { SecretaryMetricBarChart } from '@/components/performance/SecretaryMetricBarChart';
import { MetricCard } from '@/components/commercial/MetricCard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatCurrency } from '@/lib/currency';

type Preset = 'today' | 'last_7_days' | 'last_30_days' | 'mtd' | 'last_month';

const PRESET_LABELS: Record<Preset, string> = {
  today: 'Hoje',
  last_7_days: '7 dias',
  last_30_days: '30 dias',
  mtd: 'Este mês',
  last_month: 'Mês passado',
};

const buildRange = (preset: Preset): { start: Date; end: Date; label: string } => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now), label: 'Hoje' };
    case 'last_7_days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), label: 'Últimos 7 dias' };
    case 'last_30_days':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now), label: 'Últimos 30 dias' };
    case 'mtd':
      return { start: startOfMonth(now), end: endOfDay(now), label: 'Este mês' };
    case 'last_month': {
      const ref = subMonths(now, 1);
      return { start: startOfMonth(ref), end: endOfMonth(ref), label: 'Mês passado' };
    }
  }
};

export default function PerformanceComercial() {
  const [preset, setPreset] = useState<Preset>('mtd');
  const { profile } = useUserProfile();
  const range = useMemo(() => buildRange(preset), [preset]);

  const { data, isLoading } = useSecretaryPerformance({
    start: range.start,
    end: range.end,
  });

  const rankings = data?.rankings ?? [];
  const totalRevenue = data?.totalRevenue ?? 0;
  const totalAppointments = data?.totalAppointments ?? 0;

  // Métricas agregadas para os cards de topo
  const totalCompleted = rankings.reduce((s, r) => s + r.appointmentsCompleted, 0);
  const totalNoShow = rankings.reduce((s, r) => s + r.appointmentsNoShow, 0);
  const aggregateAttendance = (totalCompleted + totalNoShow) > 0
    ? (totalCompleted / (totalCompleted + totalNoShow)) * 100
    : 0;
  const avgTicket = rankings.reduce((s, r) => s + r.appointmentsPaid, 0) > 0
    ? totalRevenue / rankings.reduce((s, r) => s + r.appointmentsPaid, 0)
    : 0;

  // Preparar dados para os charts
  const revenueData = rankings.map((r) => ({ name: r.fullName, value: r.revenue }));
  const ticketData = rankings.map((r) => ({ name: r.fullName, value: r.averageTicket }));
  const attendanceData = rankings.map((r) => ({ name: r.fullName, value: r.attendanceRate }));
  const responseData = rankings
    .filter((r) => r.averageResponseTimeSeconds !== null)
    .map((r) => ({ name: r.fullName, value: r.averageResponseTimeSeconds || 0 }));
  const conversionData = rankings.map((r) => ({ name: r.fullName, value: r.conversionRate }));
  const conversationsData = rankings.map((r) => ({ name: r.fullName, value: r.conversationsHandled }));

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
              Performance Comercial
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              Ranking individual da equipe de atendimento e secretaria
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1 w-full sm:w-auto">
          <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto">
              {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
                <TabsTrigger key={p} value={p} className="text-xs sm:text-sm">
                  {PRESET_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
            <Calendar className="h-3 w-3" />
            {format(range.start, "dd 'de' MMM", { locale: ptBR })} → {format(range.end, "dd 'de' MMM yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {profile?.role === 'medico' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <UsersIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Você está vendo o desempenho das secretárias <span className="font-semibold text-foreground">vinculadas a você</span> em
              <span className="font-mono"> secretary_doctor_links</span>.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Cards de KPI agregados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Caixa total no período"
          value={totalRevenue}
          icon="dollar-sign"
          format="currency"
          isLoading={isLoading}
          hint="Soma de consultas pagas (payment_status=paid) agendadas pela equipe"
        />
        <MetricCard
          title="Consultas agendadas"
          value={totalAppointments}
          icon="calendar"
          format="number"
          isLoading={isLoading}
          hint="Consultas com scheduled_by preenchido no período"
        />
        <MetricCard
          title="Ticket médio"
          value={avgTicket}
          icon="calculator"
          format="currency"
          isLoading={isLoading}
          hint="Caixa total ÷ consultas pagas"
        />
        <MetricCard
          title="Taxa de comparecimento"
          value={aggregateAttendance}
          icon="user-check"
          format="percentage"
          isLoading={isLoading}
          hint="Concluídas ÷ (concluídas + faltas)"
        />
      </div>

      <SecretaryPodium rankings={rankings} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SecretaryMetricBarChart
          title="Caixa por Secretária"
          subtitle="Faturamento total das consultas agendadas e pagas no período"
          icon={DollarSign}
          data={revenueData}
          format="currency"
          isLoading={isLoading}
          emptyMessage="Nenhuma consulta paga foi agendada por secretárias no período."
        />
        <SecretaryMetricBarChart
          title="Ticket Médio por Secretária"
          subtitle="Valor médio de cada consulta paga"
          icon={Receipt}
          data={ticketData}
          format="currency"
          isLoading={isLoading}
          emptyMessage="Sem ticket médio para calcular (nenhuma consulta paga)."
        />
        <SecretaryMetricBarChart
          title="Taxa de Comparecimento"
          subtitle="% de pacientes que compareceram (vs faltas) das consultas agendadas por ela"
          icon={UserCheck}
          data={attendanceData}
          format="percentage"
          isLoading={isLoading}
          emptyMessage="Sem dados de comparecimento (nenhuma consulta concluída ou faltada)."
        />
        <SecretaryMetricBarChart
          title="Conversão Lead → Agendamento"
          subtitle="% de deals atribuídos que avançaram para agendado/em tratamento"
          icon={TrendingUp}
          data={conversionData}
          format="percentage"
          isLoading={isLoading}
          emptyMessage="Sem deals atribuídos a secretárias no período."
        />
        <SecretaryMetricBarChart
          title="Tempo Médio de 1ª Resposta (WhatsApp)"
          subtitle="Atribuído via whatsapp_conversations.assigned_to / assignment_history"
          icon={Clock}
          data={responseData}
          format="duration"
          isLoading={isLoading}
          emptyMessage="Para calcular, atribua conversas no Inbox WhatsApp (campo assigned_to está vazio hoje)."
        />
        <SecretaryMetricBarChart
          title="Conversas Atendidas"
          subtitle="Conversas em que a secretária esteve atribuída no período"
          icon={UsersIcon}
          data={conversationsData}
          format="number"
          isLoading={isLoading}
          emptyMessage="Para popular, atribua conversas no Inbox WhatsApp."
        />
      </div>

      {/* Tabela detalhada */}
      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Secretária</th>
                <th className="px-4 py-3 font-semibold text-right">Caixa</th>
                <th className="px-4 py-3 font-semibold text-right">Agendadas</th>
                <th className="px-4 py-3 font-semibold text-right">Pagas</th>
                <th className="px-4 py-3 font-semibold text-right">Faltas</th>
                <th className="px-4 py-3 font-semibold text-right">Ticket médio</th>
                <th className="px-4 py-3 font-semibold text-right">Comparec.</th>
                <th className="px-4 py-3 font-semibold text-right">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma secretária com dados no período selecionado.
                  </td>
                </tr>
              ) : (
                rankings.map((r, idx) => (
                  <tr key={r.userId} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                          {idx + 1}º
                        </span>
                        <span className="truncate font-medium text-foreground" title={r.fullName}>
                          {r.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-400">
                      {formatCurrency(r.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.appointmentsScheduled}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.appointmentsPaid}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-500">
                      {r.appointmentsNoShow}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.appointmentsPaid > 0 ? formatCurrency(r.averageTicket) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {(r.appointmentsCompleted + r.appointmentsNoShow) > 0
                        ? `${r.attendanceRate.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.dealsAssigned > 0 ? `${r.conversionRate.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
