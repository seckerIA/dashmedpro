import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface TeamMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;

  // CRM
  totalPipeline: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalContacts: number;
  totalLeads: number;

  // Clínica
  appointmentsScheduled: number;
  totalRevenue: number;

  // KPI
  conversionRate: number; // appointmentsScheduled / totalLeads * 100
}

export interface ConsolidatedTeamMetrics {
  totalPipeline: number;
  totalActiveDeals: number;
  totalWonDeals: number;
  totalLostDeals: number;
  totalContacts: number;
  totalLeads: number;
  totalRevenue: number;
  totalAppointmentsScheduled: number;
  averageConversionRate: number;
  teamMetrics: TeamMetrics[];
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

// ── Métricas de secretárias ───────────────────────────────────────────────────

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

  const [
    profileResult,
    appointmentsTodayResult,
    appointmentsMonthResult,
    contactsTodayResult,
    contactsMonthResult,
    confirmationsTodayResult,
    pendingConfirmationsResult,
  ] = await Promise.all([
    supabaseQueryWithTimeout(
      supabase.from('profiles').select('id, email, full_name').eq('id', userId).single() as any,
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('medical_appointments').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', todayStart).lte('created_at', todayEnd),
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('medical_appointments').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', monthStart).lte('created_at', monthEnd),
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('crm_contacts').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', todayStart).lte('created_at', todayEnd),
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('crm_contacts').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', monthStart).lte('created_at', monthEnd),
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('medical_appointments').select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed' as any).gte('updated_at', todayStart).lte('updated_at', todayEnd),
      25000, signal
    ),
    supabaseQueryWithTimeout(
      supabase.from('medical_appointments').select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled' as any).gte('start_time', todayStart),
      25000, signal
    ),
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

// ── Fetch principal ───────────────────────────────────────────────────────────

const ACTIVE_STAGES = ['lead_novo', 'em_contato', 'lead', 'qualificado', 'proposta', 'negociacao', 'agendado', 'em_tratamento', 'aguardando_retorno'];
const WON_STAGES = ['fechado_ganho'];
const LOST_STAGES = ['fechado_perdido', 'inadimplente'];

const fetchTeamMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  selectedUserIds?: string[],
  signal?: AbortSignal,
  isMedico?: boolean
): Promise<ConsolidatedTeamMetrics> => {
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();

  // ── Resolver quais usuários buscar ──────────────────────────────────────
  let targetUserIds: string[] = [];

  if (isMedico && !isAdminOrDono) {
    const { data: links } = await (supabase
      .from('secretary_doctor_links' as any) as any)
      .select('secretary_id')
      .eq('doctor_id', userId);
    const linkedIds = (links as any[])?.map((l: any) => l.secretary_id) || [];
    targetUserIds = [userId, ...linkedIds];
  } else if (!isAdminOrDono) {
    targetUserIds = [userId];
  } else {
    if (selectedUserIds && selectedUserIds.length > 0) {
      targetUserIds = selectedUserIds.slice(0, 50);
    } else {
      const { data: profiles, error } = await supabaseQueryWithTimeout(
        supabase.from('profiles').select('id').eq('is_active', true).limit(50) as any,
        25000, signal
      );
      if (!error && profiles) {
        targetUserIds = (profiles as any[]).map((p: any) => p.id);
      }
    }
  }

  if (targetUserIds.length === 0) return emptyMetrics;

  // ── Pré-query: buscar form_ids válidos (apenas de BMs sincronizadas) ────
  const { data: syncedForms } = await supabaseQueryWithTimeout(
    (supabase.from('meta_lead_forms' as any) as any)
      .select('meta_form_id')
      .in('user_id', targetUserIds),
    25000, signal
  );
  const validFormIds: string[] = (syncedForms as any[] || []).map((f: any) => f.meta_form_id);

  // ── Queries paralelas ───────────────────────────────────────────────────
  const monthStartDate = monthStart.split('T')[0]; // yyyy-MM-dd

  const [
    dealsResult,
    contactsResult,
    leadsResult,
    profilesResult,
    appointmentsResult,
    revenueResult,
  ] = await Promise.all([
    // 1. Deals (CRM)
    supabaseQueryWithTimeout(
      supabase.from('crm_deals')
        .select('id, value, stage, user_id, assigned_to')
        .or(`user_id.in.(${targetUserIds.join(',')}),assigned_to.in.(${targetUserIds.join(',')})`)
        .limit(1000),
      25000, signal
    ),
    // 2. Contatos
    supabaseQueryWithTimeout(
      supabase.from('crm_contacts').select('id, user_id').in('user_id', targetUserIds),
      25000, signal
    ),
    // 3. Leads do mês — fonte: lead_form_submissions (formulários Facebook)
    //    Filtra apenas por formulários de BMs sincronizadas (existentes em meta_lead_forms)
    supabaseQueryWithTimeout(
      validFormIds.length > 0
        ? (supabase.from('lead_form_submissions' as any) as any)
            .select('id, user_id')
            .in('user_id', targetUserIds)
            .in('form_id', validFormIds)
            .gte('created_at', monthStart)
        : (supabase.from('lead_form_submissions' as any) as any)
            .select('id, user_id')
            .in('user_id', targetUserIds)
            .gte('created_at', monthStart)
            .limit(0),
      25000, signal
    ),
    // 4. Perfis
    supabaseQueryWithTimeout(
      supabase.from('profiles')
        .select('id, email, full_name, role')
        .in('id', targetUserIds),
      25000, signal
    ),
    // 5. Agendamentos do mês (numerador conversão)
    supabaseQueryWithTimeout(
      supabase.from('medical_appointments')
        .select('id, user_id')
        .in('user_id', targetUserIds)
        .gte('created_at', monthStart),
      25000, signal
    ),
    // 6. Receita do mês — tipo 'entrada' (NÃO 'income'), status concluída
    supabaseQueryWithTimeout(
      supabase.from('financial_transactions')
        .select('id, user_id, amount')
        .in('user_id', targetUserIds)
        .eq('type', 'entrada' as any)
        .eq('status', 'concluida' as any)
        .gte('transaction_date', monthStartDate),
      25000, signal
    ),
  ]);

  if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);

  const deals = (dealsResult.data || []) as any[];
  const contacts = (contactsResult.data || []) as any[];
  const leads = (leadsResult.data || []) as any[];
  const profiles = (profilesResult.data || []) as any[];
  const appointments = (appointmentsResult.data || []) as any[];
  const revenues = (revenueResult.data || []) as any[];

  const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));

  // ── Métricas por usuário ────────────────────────────────────────────────
  const teamMetrics: TeamMetrics[] = targetUserIds.map(uid => {
    const userDeals = deals.filter(d => d.user_id === uid || d.assigned_to === uid);
    const profile = profilesMap.get(uid);

    const activeDealsList = userDeals.filter(d => ACTIVE_STAGES.includes(d.stage));
    const wonDealsList = userDeals.filter(d => WON_STAGES.includes(d.stage));
    const lostDealsList = userDeals.filter(d => LOST_STAGES.includes(d.stage));

    const totalPipeline = activeDealsList.reduce((sum, d) => {
      return sum + (parseFloat(d.value) || 0);
    }, 0);

    const userLeadsCount = leads.filter(l => l.user_id === uid).length;
    const userAppointmentsCount = appointments.filter(a => a.user_id === uid).length;

    const totalRevenue = revenues
      .filter(r => r.user_id === uid)
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const conversionRate = userLeadsCount > 0
      ? (userAppointmentsCount / userLeadsCount) * 100
      : 0;

    return {
      userId: uid,
      userName: profile?.full_name || profile?.email || 'Usuário',
      userEmail: profile?.email || '',
      userRole: profile?.role || undefined,
      totalPipeline,
      activeDeals: activeDealsList.length,
      wonDeals: wonDealsList.length,
      lostDeals: lostDealsList.length,
      totalContacts: contacts.filter(c => c.user_id === uid).length,
      totalLeads: userLeadsCount,
      appointmentsScheduled: userAppointmentsCount,
      totalRevenue,
      conversionRate,
    };
  });

  // ── Consolidado global ──────────────────────────────────────────────────
  const totalLeads = teamMetrics.reduce((s, m) => s + m.totalLeads, 0);
  const totalAppointments = teamMetrics.reduce((s, m) => s + m.appointmentsScheduled, 0);

  return {
    totalPipeline: teamMetrics.reduce((s, m) => s + m.totalPipeline, 0),
    totalRevenue: teamMetrics.reduce((s, m) => s + m.totalRevenue, 0),
    totalActiveDeals: teamMetrics.reduce((s, m) => s + m.activeDeals, 0),
    totalWonDeals: teamMetrics.reduce((s, m) => s + m.wonDeals, 0),
    totalLostDeals: teamMetrics.reduce((s, m) => s + m.lostDeals, 0),
    totalContacts: teamMetrics.reduce((s, m) => s + m.totalContacts, 0),
    totalLeads,
    totalAppointmentsScheduled: totalAppointments,
    averageConversionRate: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0,
    teamMetrics,
  };
};

// ── Hook público ──────────────────────────────────────────────────────────────

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
          return emptyMetrics;
        }
        console.error('Erro ao buscar métricas da equipe:', error);
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
