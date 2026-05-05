import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface SecretaryPerformance {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;

  /** Faturamento das consultas que ELA agendou e foram pagas (payment_status='paid' & status in ('completed','scheduled','confirmed')) */
  revenue: number;
  /** Quantidade de consultas que ela agendou no período */
  appointmentsScheduled: number;
  /** Quantidade de consultas concluídas (presença) */
  appointmentsCompleted: number;
  /** Quantidade de no_show */
  appointmentsNoShow: number;
  /** Quantidade de canceladas */
  appointmentsCancelled: number;
  /** Quantidade de consultas pagas */
  appointmentsPaid: number;
  /** Ticket médio = revenue / appointmentsPaid */
  averageTicket: number;
  /** Taxa de comparecimento = completed / (completed + no_show) */
  attendanceRate: number;
  /** Tempo médio de 1ª resposta em segundos (mensagens onde ela é o autor outbound) */
  averageResponseTimeSeconds: number | null;
  /** Conversas únicas em que ela respondeu pelo menos uma vez */
  conversationsHandled: number;
  /** Leads atribuídos no período (deals.assigned_to) */
  dealsAssigned: number;
  /** Leads atribuídos que viraram agendamento (stage in 'agendado','em_tratamento','follow_up') */
  dealsConverted: number;
  /** Taxa de conversão lead → agendamento */
  conversionRate: number;
}

export interface SecretaryPerformanceResult {
  rankings: SecretaryPerformance[];
  totalRevenue: number;
  totalAppointments: number;
  totalConversations: number;
  periodStart: string;
  periodEnd: string;
}

const emptyResult = (start: string, end: string): SecretaryPerformanceResult => ({
  rankings: [],
  totalRevenue: 0,
  totalAppointments: 0,
  totalConversations: 0,
  periodStart: start,
  periodEnd: end,
});

interface UseSecretaryPerformanceArgs {
  start?: Date;
  end?: Date;
  /** Quando definido, restringe o ranking aos secretários vinculados a esse médico (via secretary_doctor_links). */
  doctorId?: string;
}

export function useSecretaryPerformance(args: UseSecretaryPerformanceArgs = {}) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();

  const now = new Date();
  const startDate = args.start ?? startOfMonth(now);
  const endDate = args.end ?? endOfMonth(now);
  const periodStart = startDate.toISOString();
  const periodEnd = endDate.toISOString();

  const role = profile?.role;
  const canSee = role === 'admin' || role === 'dono' || role === 'medico';

  return useQuery<SecretaryPerformanceResult>({
    queryKey: ['secretary-performance', user?.id, profile?.organization_id, periodStart, periodEnd, args.doctorId ?? 'all'],
    enabled: !!user?.id && !!profile && canSee && !authLoading && !isLoadingProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
    queryFn: async ({ signal }) => {
      if (!user?.id) return emptyResult(periodStart, periodEnd);

      // 1) Lista de secretárias.
      // - Se for médico (não admin/dono): apenas as vinculadas a ele em secretary_doctor_links.
      // - Se for admin/dono: todas as secretárias da mesma organização.
      // - args.doctorId força o filtro pelos vínculos desse médico.
      let secretaryIds: string[] = [];

      const targetDoctorId = args.doctorId
        ?? (role === 'medico' ? user.id : undefined);

      if (targetDoctorId) {
        const { data: links } = await supabaseQueryWithTimeout(
          (supabase
            .from('secretary_doctor_links' as any) as any)
            .select('secretary_id')
            .eq('doctor_id', targetDoctorId),
          20000,
          signal,
        );
        secretaryIds = ((links as any[]) || []).map((l: any) => l.secretary_id);
      } else {
        // admin/dono: pegar todas as secretárias da org
        const orgId = profile?.organization_id ?? null;
        const profilesQuery = supabase
          .from('profiles')
          .select('id, role, organization_id')
          .eq('role', 'secretaria')
          .eq('is_active', true);
        const finalQuery = orgId ? profilesQuery.eq('organization_id', orgId) : profilesQuery;
        const { data: secs } = await supabaseQueryWithTimeout(finalQuery as any, 20000, signal);
        secretaryIds = ((secs as any[]) || []).map((p: any) => p.id);
      }

      if (secretaryIds.length === 0) {
        return emptyResult(periodStart, periodEnd);
      }

      // 2) Carregar dados em paralelo
      const [
        profilesResult,
        appointmentsResult,
        conversationsAssignedResult,
        assignmentHistoryResult,
        dealsResult,
      ] = await Promise.all([
        supabaseQueryWithTimeout(
          supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', secretaryIds) as any,
          20000,
          signal,
        ),
        supabaseQueryWithTimeout(
          supabase
            .from('medical_appointments')
            .select('id, scheduled_by, status, payment_status, estimated_value, start_time, contact_id')
            .in('scheduled_by' as any, secretaryIds)
            .gte('start_time', periodStart)
            .lte('start_time', periodEnd) as any,
          25000,
          signal,
        ),
        supabaseQueryWithTimeout(
          supabase
            .from('whatsapp_conversations')
            .select('id, assigned_to, created_at, last_message_at')
            .in('assigned_to', secretaryIds)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd) as any,
          20000,
          signal,
        ),
        // Histórico de atribuição (cobre conversas onde assigned_to atual seja outro)
        supabaseQueryWithTimeout(
          (supabase
            .from('whatsapp_assignment_history' as any) as any)
            .select('conversation_id, assigned_to, created_at')
            .in('assigned_to', secretaryIds)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd),
          20000,
          signal,
        ),
        supabaseQueryWithTimeout(
          supabase
            .from('crm_deals')
            .select('id, assigned_to, stage, updated_at, created_at')
            .in('assigned_to' as any, secretaryIds)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd) as any,
          20000,
          signal,
        ),
      ]);

      const profiles = (profilesResult.data || []) as Array<{
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
      }>;
      const appointments = (appointmentsResult.data || []) as Array<{
        id: string;
        scheduled_by: string;
        status: string;
        payment_status: string | null;
        estimated_value: number | null;
        start_time: string;
        contact_id: string;
      }>;
      const conversationsAssigned = (conversationsAssignedResult.data || []) as Array<{
        id: string;
        assigned_to: string;
        created_at: string;
        last_message_at: string | null;
      }>;
      const assignmentHistory = (assignmentHistoryResult.data || []) as Array<{
        conversation_id: string;
        assigned_to: string;
        created_at: string;
      }>;
      const deals = (dealsResult.data || []) as Array<{
        id: string;
        assigned_to: string;
        stage: string;
        updated_at: string | null;
        created_at: string;
      }>;

      // 3) Tempo de resposta: para cada conversa com atribuição (atual ou histórica),
      // pegamos primeiro inbound e primeiro outbound após esse inbound.
      const allConversationIds = Array.from(new Set([
        ...conversationsAssigned.map(c => c.id),
        ...assignmentHistory.map(h => h.conversation_id),
      ]));

      const responseTimesBySecretary = new Map<string, number[]>();
      const conversationsBySecretary = new Map<string, Set<string>>();

      // Mapear: conversa -> conjunto de secretárias que estiveram atribuídas a ela no período
      const convToSecretaries = new Map<string, Set<string>>();
      conversationsAssigned.forEach(c => {
        if (!convToSecretaries.has(c.id)) convToSecretaries.set(c.id, new Set());
        convToSecretaries.get(c.id)!.add(c.assigned_to);
      });
      assignmentHistory.forEach(h => {
        if (!convToSecretaries.has(h.conversation_id)) convToSecretaries.set(h.conversation_id, new Set());
        convToSecretaries.get(h.conversation_id)!.add(h.assigned_to);
      });

      // Importante: whatsapp_messages.user_id é o dono da conta (médico), NÃO a secretária
      // que efetivamente respondeu. Por isso atribuímos o tempo de resposta à(s) secretária(s)
      // que estavam vinculadas à conversa (via whatsapp_conversations.assigned_to ou
      // whatsapp_assignment_history.assigned_to). Esse mapeamento é nulo enquanto o fluxo
      // de "assumir conversa" no inbox não estiver em uso.
      if (allConversationIds.length > 0) {
        const { data: messages } = await supabaseQueryWithTimeout(
          supabase
            .from('whatsapp_messages')
            .select('conversation_id, direction, created_at')
            .in('conversation_id', allConversationIds)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd)
            .order('created_at', { ascending: true })
            .limit(5000) as any,
          25000,
          signal,
        );

        const msgsByConv = new Map<string, Array<{ direction: string; created_at: string }>>();
        ((messages as any[]) || []).forEach((m: any) => {
          if (!msgsByConv.has(m.conversation_id)) msgsByConv.set(m.conversation_id, []);
          msgsByConv.get(m.conversation_id)!.push({
            direction: m.direction,
            created_at: m.created_at,
          });
        });

        msgsByConv.forEach((msgs, convId) => {
          const secretariesForConv = convToSecretaries.get(convId);
          if (!secretariesForConv || secretariesForConv.size === 0) return;

          // Toda secretária atribuída à conversa "conta" como tendo atendido.
          secretariesForConv.forEach(secId => {
            if (!conversationsBySecretary.has(secId)) conversationsBySecretary.set(secId, new Set());
            conversationsBySecretary.get(secId)!.add(convId);
          });

          // Tempo de resposta: delta entre 1º inbound e 1º outbound subsequente (qualquer outbound,
          // independente de quem mandou no banco — atribuímos o crédito à(s) secretária(s) atribuída(s)).
          let firstInbound: Date | null = null;
          for (const m of msgs) {
            if (m.direction === 'inbound' && !firstInbound) {
              firstInbound = new Date(m.created_at);
              continue;
            }
            if (firstInbound && m.direction === 'outbound') {
              const diffSec = (new Date(m.created_at).getTime() - firstInbound.getTime()) / 1000;
              if (diffSec >= 0 && diffSec <= 86400) {
                secretariesForConv.forEach(secId => {
                  if (!responseTimesBySecretary.has(secId)) responseTimesBySecretary.set(secId, []);
                  responseTimesBySecretary.get(secId)!.push(diffSec);
                });
              }
              break;
            }
          }
        });
      }

      // 4) Ranking por secretária
      const profileById = new Map(profiles.map(p => [p.id, p]));

      const CONVERTED_STAGES = new Set(['agendado', 'em_tratamento', 'follow_up', 'fechado_ganho', 'finalizado']);

      const rankings: SecretaryPerformance[] = secretaryIds.map((sid) => {
        const prof = profileById.get(sid);
        const myAppts = appointments.filter(a => a.scheduled_by === sid);
        const paidAppts = myAppts.filter(a => a.payment_status === 'paid');
        const completedAppts = myAppts.filter(a => a.status === 'completed');
        const noShowAppts = myAppts.filter(a => a.status === 'no_show');
        const cancelledAppts = myAppts.filter(a => a.status === 'cancelled');

        const revenue = paidAppts.reduce((sum, a) => sum + (Number(a.estimated_value) || 0), 0);
        const averageTicket = paidAppts.length > 0 ? revenue / paidAppts.length : 0;

        const presenceDenom = completedAppts.length + noShowAppts.length;
        const attendanceRate = presenceDenom > 0
          ? (completedAppts.length / presenceDenom) * 100
          : 0;

        const myDeals = deals.filter(d => d.assigned_to === sid);
        const convertedDeals = myDeals.filter(d => CONVERTED_STAGES.has(d.stage));
        const conversionRate = myDeals.length > 0
          ? (convertedDeals.length / myDeals.length) * 100
          : 0;

        const responseTimes = responseTimesBySecretary.get(sid) || [];
        const avgResponse = responseTimes.length > 0
          ? responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length
          : null;

        const conversationsCount = (conversationsBySecretary.get(sid) || new Set()).size;

        return {
          userId: sid,
          fullName: prof?.full_name || prof?.email || 'Secretária',
          email: prof?.email || '',
          avatarUrl: prof?.avatar_url ?? null,
          revenue,
          appointmentsScheduled: myAppts.length,
          appointmentsCompleted: completedAppts.length,
          appointmentsNoShow: noShowAppts.length,
          appointmentsCancelled: cancelledAppts.length,
          appointmentsPaid: paidAppts.length,
          averageTicket,
          attendanceRate,
          averageResponseTimeSeconds: avgResponse,
          conversationsHandled: conversationsCount,
          dealsAssigned: myDeals.length,
          dealsConverted: convertedDeals.length,
          conversionRate,
        };
      });

      rankings.sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = rankings.reduce((s, r) => s + r.revenue, 0);
      const totalAppointments = rankings.reduce((s, r) => s + r.appointmentsScheduled, 0);
      const totalConversations = rankings.reduce((s, r) => s + r.conversationsHandled, 0);

      return {
        rankings,
        totalRevenue,
        totalAppointments,
        totalConversations,
        periodStart,
        periodEnd,
      };
    },
  });
}
