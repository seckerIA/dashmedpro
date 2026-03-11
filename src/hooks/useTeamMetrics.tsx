import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export interface BottleneckMetric {
  stage: string;
  previousStageCount: number;
  currentStageCount: number;
  dropOffRate: number;
  isCritical: boolean;
}

export interface ConcentrationMetric {
  isHighRisk: boolean;
  topSource: string;
  topSourceValue: number;
  topSourcePercentage: number;
  totalRevenue: number;
}

export interface TeamMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;

  // ── CRM (funil de vendas) ──────────────────────────────────────
  totalPipeline: number;       // Valor dos deals ativos em crm_deals
  activeDeals: number;         // Deals ativos no CRM
  wonDeals: number;            // Deals fechados ganhos (crm_deals stage = fechado_ganho)
  lostDeals: number;           // Deals fechados perdidos
  totalDeals: number;          // Total de deals únicos
  dealsByStage: Record<string, { count: number; value: number }>;
  averageDealValue: number;
  averageTimeInPipeline: number;
  totalContacts: number;       // crm_contacts
  totalLeads: number;          // commercial_leads criados no mês

  // ── Médico / Clínica (conversão real) ─────────────────────────
  appointmentsScheduled: number;  // Consultas agendadas no mês (medical_appointments)
  totalRevenue: number;           // Receita de entradas no mês (financial_transactions type=income)

  // ── KPI calculado ─────────────────────────────────────────────
  conversionRate: number;      // appointmentsScheduled / totalLeads * 100

  // ── Insights ──────────────────────────────────────────────────
  bottleneck?: BottleneckMetric;
  revenueConcentration?: ConcentrationMetric;
}

export interface ConsolidatedTeamMetrics {
  // CRM
  totalPipeline: number;
  totalActiveDeals: number;
  totalWonDeals: number;
  totalLostDeals: number;
  totalContacts: number;
  totalLeads: number;
  // Clínica
  totalRevenue: number;
  totalAppointmentsScheduled: number;
  // KPI
  averageConversionRate: number;
  // Detalhes por membro
  teamMetrics: TeamMetrics[];
  // Insights globais
  globalBottleneck?: BottleneckMetric;
  globalConcentration?: ConcentrationMetric;
}

const emptyMetrics: ConsolidatedTeamMetrics = {
  totalPipeline: 0,
  totalRevenue: 0,
  totalActiveDeals: 0,
  totalWonDeals: 0,
  totalLostDeals: 0,
  averageConversionRate: 0,
  totalContacts: 0,
  totalLeads: 0,
  totalAppointmentsScheduled: 0,
  teamMetrics: [],
};

// ── Métricas específicas de secretárias (leve) ─────────────────────────────
export interface SecretaryMetrics {
  appointmentsScheduledToday: number;
  appointmentsScheduledThisMonth: number;
  patientsRegisteredToday: number;
  patientsRegisteredThisMonth: number;
  confirmationsToday: number;
  pendingConfirmations: number;
  userName: string;
  userEmail: string;
}

const emptySecretaryMetrics: SecretaryMetrics = {
  appointmentsScheduledToday: 0,
  appointmentsScheduledThisMonth: 0,
  patientsRegisteredToday: 0,
  patientsRegisteredThisMonth: 0,
  confirmationsToday: 0,
  pendingConfirmations: 0,
  userName: '',
  userEmail: '',
};

const fetchSecretaryMetrics = async (
  userId: string,
  signal?: AbortSignal
): Promise<SecretaryMetrics> => {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const profileQuery = supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .single() as any;

  const appointmentsTodayQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  const appointmentsMonthQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  const contactsTodayQuery = supabase
    .from('crm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  const contactsMonthQuery = supabase
    .from('crm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  const confirmationsTodayQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed' as any)
    .gte('updated_at', todayStart)
    .lte('updated_at', todayEnd);

  const pendingConfirmationsQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'scheduled' as any)
    .gte('start_time', todayStart);

  const [
    profileResult,
    appointmentsTodayResult,
    appointmentsMonthResult,
    contactsTodayResult,
    contactsMonthResult,
    confirmationsTodayResult,
    pendingConfirmationsResult
  ] = await Promise.all([
    supabaseQueryWithTimeout(profileQuery, 30000, signal),
    supabaseQueryWithTimeout(appointmentsTodayQuery, 30000, signal),
    supabaseQueryWithTimeout(appointmentsMonthQuery, 30000, signal),
    supabaseQueryWithTimeout(contactsTodayQuery, 30000, signal),
    supabaseQueryWithTimeout(contactsMonthQuery, 30000, signal),
    supabaseQueryWithTimeout(confirmationsTodayQuery, 30000, signal),
    supabaseQueryWithTimeout(pendingConfirmationsQuery, 30000, signal),
  ]);

  return {
    appointmentsScheduledToday: (appointmentsTodayResult as any).count || 0,
    appointmentsScheduledThisMonth: (appointmentsMonthResult as any).count || 0,
    patientsRegisteredToday: (contactsTodayResult as any).count || 0,
    patientsRegisteredThisMonth: (contactsMonthResult as any).count || 0,
    confirmationsToday: (confirmationsTodayResult as any).count || 0,
    pendingConfirmations: (pendingConfirmationsResult as any).count || 0,
    userName: (profileResult.data as any)?.full_name || (profileResult.data as any)?.email || 'Secretaria',
    userEmail: (profileResult.data as any)?.email || '',
  };
};

// ── Fetch principal ────────────────────────────────────────────────────────
const fetchTeamMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  selectedUserIds?: string[],
  signal?: AbortSignal,
  isMedico?: boolean
): Promise<ConsolidatedTeamMetrics> => {
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();

  // Resolver quais usuários buscar
  let targetUserIds: string[] = [];

  if (isMedico && !isAdminOrDono) {
    // Médico: ele mesmo + secretárias vinculadas
    const { data: links } = await (supabase
      .from('secretary_doctor_links' as any) as any)
      .select('secretary_id')
      .eq('doctor_id', userId);
    const linkedSecretaryIds = (links as any[])?.map((l: any) => l.secretary_id) || [];
    targetUserIds = [userId, ...linkedSecretaryIds];
  } else if (!isAdminOrDono) {
    // Usuário comum: apenas ele mesmo
    targetUserIds = [userId];
  } else {
    // Admin/Dono: seleção ou todos ativos
    if (selectedUserIds && selectedUserIds.length > 0) {
      targetUserIds = selectedUserIds.slice(0, 50);
    } else {
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('is_active', true)
        .limit(50);
      const { data: profiles, error } = await supabaseQueryWithTimeout(profilesQuery as any, 25000, signal);
      if (!error && profiles && (profiles as any[]).length > 0) {
        targetUserIds = (profiles as any[]).map((p: any) => p.id);
      }
    }
  }

  if (targetUserIds.length === 0) return emptyMetrics;

  // ── Queries paralelas ─────────────────────────────────────────────────────
  // 1. CRM — funil de vendas
  const dealsQuery = supabase
    .from('crm_deals')
    .select('id, title, value, stage, user_id, assigned_to, created_at, updated_at')
    .or(`user_id.in.(${targetUserIds.join(',')}),assigned_to.in.(${targetUserIds.join(',')})`)
    .limit(1000);

  // 2. CRM — contatos
  const contactsQuery = supabase
    .from('crm_contacts')
    .select('id, user_id')
    .in('user_id', targetUserIds);

  // 3. CRM — leads do mês (denominador da conversão)
  const leadsQuery = supabase
    .from('commercial_leads')
    .select('id, user_id, created_at')
    .in('user_id', targetUserIds)
    .gte('created_at', monthStart);

  // 4. Perfis
  const profilesQuery = supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .in('id', targetUserIds);

  // 5. CLÍNICA — agendamentos do mês (numerador da conversão)
  const appointmentsQuery = supabase
    .from('medical_appointments')
    .select('id, user_id, created_at')
    .in('user_id', targetUserIds)
    .gte('created_at', monthStart);

  // 6. FINANCEIRO — receita de entradas do mês (fonte de verdade)
  const revenueQuery = supabase
    .from('financial_transactions')
    .select('id, user_id, amount, type, status')
    .in('user_id', targetUserIds)
    .eq('type', 'income' as any)
    .gte('created_at', monthStart);

  const [
    dealsResult,
    contactsResult,
    leadsResult,
    profilesResult,
    appointmentsResult,
    revenueResult,
  ] = await Promise.all([
    supabaseQueryWithTimeout(dealsQuery, 25000, signal),
    supabaseQueryWithTimeout(contactsQuery, 25000, signal),
    supabaseQueryWithTimeout(leadsQuery, 25000, signal),
    supabaseQueryWithTimeout(profilesQuery, 25000, signal),
    supabaseQueryWithTimeout(appointmentsQuery, 25000, signal),
    supabaseQueryWithTimeout(revenueQuery, 25000, signal),
  ]);

  if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
  if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

  const deals = (dealsResult.data || []) as any[];
  const contacts = (contactsResult.data || []) as any[];
  const leads = (leadsResult.data || []) as any[];
  const profiles = (profilesResult.data || []) as any[];
  const appointments = (appointmentsResult.data || []) as any[];
  const revenues = (revenueResult.data || []) as any[];

  const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));

  // ── Métricas por usuário ──────────────────────────────────────────────────
  const teamMetrics: TeamMetrics[] = targetUserIds.map(targetUserId => {
    const userDeals = deals.filter(d => d.user_id === targetUserId || d.assigned_to === targetUserId);
    const userContacts = contacts.filter(c => c.user_id === targetUserId);
    const userLeads = leads.filter(l => l.user_id === targetUserId);
    const userAppointments = appointments.filter(a => a.user_id === targetUserId);
    const userRevenues = revenues.filter(r => r.user_id === targetUserId);
    const profile = profilesMap.get(targetUserId);

    return calculateUserMetrics(
      targetUserId, userDeals, userContacts, userLeads, profile, userAppointments, userRevenues
    );
  });

  // ── Consolidado global ────────────────────────────────────────────────────
  const totalWonDeals = teamMetrics.reduce((sum, tm) => sum + tm.wonDeals, 0);
  const totalLostDeals = teamMetrics.reduce((sum, tm) => sum + tm.lostDeals, 0);
  const totalLeads = teamMetrics.reduce((sum, tm) => sum + tm.totalLeads, 0);
  const totalAppointments = teamMetrics.reduce((sum, tm) => sum + tm.appointmentsScheduled, 0);

  // Bottleneck global: pegar o mais crítico da equipe
  const globalBottleneck = teamMetrics
    .map(tm => tm.bottleneck)
    .filter(Boolean)
    .sort((a, b) => (b?.dropOffRate ?? 0) - (a?.dropOffRate ?? 0))[0];

  // Concentração global: pegar a mais crítica
  const globalConcentration = teamMetrics
    .map(tm => tm.revenueConcentration)
    .filter(Boolean)
    .sort((a, b) => (b?.topSourcePercentage ?? 0) - (a?.topSourcePercentage ?? 0))[0];

  return {
    totalPipeline: teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0),
    totalRevenue: teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0),
    totalActiveDeals: teamMetrics.reduce((sum, tm) => sum + tm.activeDeals, 0),
    totalWonDeals,
    totalLostDeals,
    totalContacts: teamMetrics.reduce((sum, tm) => sum + tm.totalContacts, 0),
    totalLeads,
    totalAppointmentsScheduled: totalAppointments,
    // Taxa de conversão global: consultas agendadas / leads no mês
    averageConversionRate: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0,
    teamMetrics,
    globalBottleneck,
    globalConcentration,
  };
};

// ── Cálculo por usuário ────────────────────────────────────────────────────
function calculateUserMetrics(
  userId: string,
  userDeals: any[],
  userContacts: any[],
  userLeads: any[],
  profile: any,
  userAppointments: any[],
  userRevenues: any[]
): TeamMetrics {
  // ── CRM pipeline ──────────────────────────────────────────────
  const ACTIVE_STAGES = ['lead', 'qualificado', 'proposta', 'negociacao', 'agendado', 'em_tratamento', 'aguardando_retorno'];
  const WON_STAGES = ['fechado_ganho'];
  const LOST_STAGES = ['fechado_perdido', 'inadimplente'];

  const activeDealsList = userDeals.filter(d => ACTIVE_STAGES.includes(d.stage));
  const wonDealsList = userDeals.filter(d => WON_STAGES.includes(d.stage));
  const lostDealsList = userDeals.filter(d => LOST_STAGES.includes(d.stage));

  const totalPipeline = activeDealsList.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const dealsByStage: Record<string, { count: number; value: number }> = {};
  userDeals.forEach(deal => {
    if (!dealsByStage[deal.stage]) dealsByStage[deal.stage] = { count: 0, value: 0 };
    dealsByStage[deal.stage].count++;
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    dealsByStage[deal.stage].value += value || 0;
  });

  const averageDealValue = userDeals.length > 0 ? totalPipeline / userDeals.length : 0;
  const averageTimeInPipeline = userDeals.length > 0
    ? userDeals.reduce((sum, deal) => {
        const created = new Date(deal.created_at).getTime();
        const updated = new Date(deal.updated_at).getTime();
        return sum + (updated - created);
      }, 0) / userDeals.length / (1000 * 60 * 60 * 24)
    : 0;

  // ── Clínica: agendamentos (numerador de conversão) ────────────
  const appointmentsScheduled = userAppointments.length;

  // ── Financeiro: receita de entradas (financial_transactions) ──
  const totalRevenue = userRevenues.reduce((sum, tx) => {
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
    return sum + (amount || 0);
  }, 0);

  // ── Taxa de conversão: consultas / leads ──────────────────────
  const conversionRate = userLeads.length > 0
    ? (appointmentsScheduled / userLeads.length) * 100
    : 0;

  // ── Gargalo (Bottleneck) ──────────────────────────────────────
  let bottleneck: BottleneckMetric | undefined;
  const activeStageKeys = Object.keys(dealsByStage).filter(s => ACTIVE_STAGES.includes(s));
  if (activeStageKeys.length >= 2) {
    const sorted = activeStageKeys.sort((a, b) => dealsByStage[b].count - dealsByStage[a].count);
    let maxDropOff = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      const currCount = dealsByStage[curr].count;
      const nextCount = dealsByStage[next].count;
      if (currCount > 0) {
        const dropOff = ((currCount - nextCount) / currCount) * 100;
        if (dropOff > maxDropOff) {
          maxDropOff = dropOff;
          bottleneck = {
            stage: curr,
            previousStageCount: currCount,
            currentStageCount: nextCount,
            dropOffRate: dropOff,
            isCritical: dropOff > 50,
          };
        }
      }
    }
  }

  // ── Concentração de Receita ───────────────────────────────────
  let revenueConcentration: ConcentrationMetric | undefined;
  if (wonDealsList.length > 0 && totalRevenue > 0) {
    const revenueBySource: Record<string, number> = {};
    wonDealsList.forEach(d => {
      const source = d.title ? d.title.split(' ')[0] : 'Outros';
      revenueBySource[source] = (revenueBySource[source] || 0) + (parseFloat(d.value) || 0);
    });
    const sorted = Object.entries(revenueBySource).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [topSource, topValue] = sorted[0];
      const percentage = (topValue / totalRevenue) * 100;
      revenueConcentration = {
        isHighRisk: percentage > 80,
        topSource,
        topSourceValue: topValue,
        topSourcePercentage: percentage,
        totalRevenue,
      };
    }
  }

  return {
    userId,
    userName: profile?.full_name || profile?.email || 'Usuário',
    userEmail: profile?.email || '',
    userRole: profile?.role || undefined,
    // CRM
    totalPipeline,
    activeDeals: activeDealsList.length,
    wonDeals: wonDealsList.length,
    lostDeals: lostDealsList.length,
    totalDeals: userDeals.length,
    dealsByStage,
    averageDealValue,
    averageTimeInPipeline,
    totalContacts: userContacts.length,
    totalLeads: userLeads.length,
    // Clínica
    appointmentsScheduled,
    totalRevenue,
    // KPI
    conversionRate,
    // Insights
    bottleneck,
    revenueConcentration,
  };
}

// ── Hook público ───────────────────────────────────────────────────────────
export function useTeamMetrics(selectedUserIds?: string[]) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSecretaria, isMedico, isLoading: isLoadingProfile } = useUserProfile();

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team-metrics', user?.id, selectedUserIds?.join(','), isMedico],
    queryFn: async ({ signal }) => {
      if (!user?.id) return emptyMetrics;
      try {
        return await fetchTeamMetrics(user.id, isAdmin, selectedUserIds, signal, isMedico);
      } catch (error: any) {
        if (
          error?.message?.includes('cancelada') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('aborted') ||
          error?.name === 'AbortError'
        ) {
          console.log('Query cancelada, retornando métricas vazias');
          return emptyMetrics;
        }
        console.error('Erro ao buscar métricas:', error);
        return emptyMetrics;
      }
    },
    enabled: !!user?.id && !authLoading && !isLoadingProfile && !isSecretaria,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
    retryDelay: 2000,
    networkMode: 'online',
  });

  const {
    data: secretaryMetrics,
    isLoading: isLoadingSecretary,
    error: secretaryError,
  } = useQuery({
    queryKey: ['secretary-team-metrics', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return emptySecretaryMetrics;
      try {
        return await fetchSecretaryMetrics(user.id, signal);
      } catch (error: any) {
        if (
          error?.message?.includes('cancelada') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('aborted') ||
          error?.name === 'AbortError'
        ) {
          console.log('Query secretaria cancelada');
          return emptySecretaryMetrics;
        }
        console.error('Erro ao buscar métricas da secretaria:', error);
        return emptySecretaryMetrics;
      }
    },
    enabled: !!user?.id && !authLoading && !isLoadingProfile && isSecretaria,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    metrics: metrics || emptyMetrics,
    secretaryMetrics: secretaryMetrics || emptySecretaryMetrics,
    isLoading: isSecretaria ? isLoadingSecretary : isLoading,
    error: isSecretaria ? secretaryError : error,
    isSecretaria,
  };
}
