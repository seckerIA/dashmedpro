import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export interface TeamMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  totalPipeline: number;
  totalRevenue: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  totalContacts: number;
  totalLeads: number;
  dealsByStage: Record<string, { count: number; value: number }>;
  averageDealValue: number;
  averageTimeInPipeline: number;
}

export interface ConsolidatedTeamMetrics {
  totalPipeline: number;
  totalRevenue: number;
  totalActiveDeals: number;
  totalWonDeals: number;
  totalLostDeals: number;
  averageConversionRate: number;
  totalContacts: number;
  totalLeads: number;
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
  teamMetrics: [],
};

const fetchTeamMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  selectedUserIds?: string[],
  signal?: AbortSignal
): Promise<ConsolidatedTeamMetrics> => {
  // Se não for admin/dono, retornar apenas dados do próprio usuário
  if (!isAdminOrDono) {
    const dealsQuery = supabase
      .from('crm_deals')
      .select(`*, contact:crm_contacts(*)`)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`);

    const contactsQuery = supabase
      .from('crm_contacts')
      .select('*')
      .eq('user_id', userId);

    const leadsQuery = supabase
      .from('commercial_leads')
      .select('*')
      .eq('user_id', userId);

    const profilesQuery = supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId);

    const [dealsResult, contactsResult, leadsResult, profilesResult] = await Promise.all([
      supabaseQueryWithTimeout(dealsQuery, 30000, signal),
      supabaseQueryWithTimeout(contactsQuery, 30000, signal),
      supabaseQueryWithTimeout(leadsQuery, 30000, signal),
      supabaseQueryWithTimeout(profilesQuery, 30000, signal),
    ]);

    if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
    if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

    const deals = dealsResult.data || [];
    const contacts = contactsResult.data || [];
    const leads = leadsResult.data || [];
    const profiles = profilesResult.data || [];

    const profile = profiles[0];
    const userMetrics = calculateUserMetrics(userId, deals, contacts, leads, profile);

    return {
      ...userMetrics,
      teamMetrics: [userMetrics],
    };
  }

  // Admin/Dono: pode ver todos os dados
  let targetUserIds: string[] = [];

  if (selectedUserIds && selectedUserIds.length > 0) {
    targetUserIds = selectedUserIds;
  } else {
    const profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true);

    const { data: profiles, error } = await supabaseQueryWithTimeout(profilesQuery, 30000, signal);
    if (!error && profiles && profiles.length > 0) {
      targetUserIds = profiles.map(p => p.id);
    }
  }

  if (targetUserIds.length === 0) {
    return emptyMetrics;
  }

  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');

  const dealsQuery = supabase
    .from('crm_deals')
    .select(`*, contact:crm_contacts(*)`)
    .or(orConditions);

  const contactsQuery = supabase
    .from('crm_contacts')
    .select('*')
    .in('user_id', targetUserIds);

  const leadsQuery = supabase
    .from('commercial_leads')
    .select('*')
    .in('user_id', targetUserIds);

  const profilesQuery = supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', targetUserIds);

  const [dealsResult, contactsResult, leadsResult, profilesResult] = await Promise.all([
    supabaseQueryWithTimeout(dealsQuery, 30000, signal),
    supabaseQueryWithTimeout(contactsQuery, 30000, signal),
    supabaseQueryWithTimeout(leadsQuery, 30000, signal),
    supabaseQueryWithTimeout(profilesQuery, 30000, signal),
  ]);

  if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
  if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

  const deals = dealsResult.data || [];
  const contacts = contactsResult.data || [];
  const leads = leadsResult.data || [];
  const profiles = profilesResult.data || [];

  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Calcular métricas por usuário
  const teamMetrics: TeamMetrics[] = targetUserIds.map(targetUserId => {
    const userDeals = deals.filter(d => d.user_id === targetUserId || d.assigned_to === targetUserId);
    const userContacts = contacts.filter(c => c.user_id === targetUserId);
    const userLeads = leads.filter(l => l.user_id === targetUserId);
    const profile = profilesMap.get(targetUserId);

    return calculateUserMetricsFromData(targetUserId, userDeals, userContacts, userLeads, profile);
  });

  // Calcular métricas consolidadas
  return {
    totalPipeline: teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0),
    totalRevenue: teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0),
    totalActiveDeals: teamMetrics.reduce((sum, tm) => sum + tm.activeDeals, 0),
    totalWonDeals: teamMetrics.reduce((sum, tm) => sum + tm.wonDeals, 0),
    totalLostDeals: teamMetrics.reduce((sum, tm) => sum + tm.lostDeals, 0),
    averageConversionRate: teamMetrics.length > 0
      ? teamMetrics.reduce((sum, tm) => sum + tm.conversionRate, 0) / teamMetrics.length
      : 0,
    totalContacts: teamMetrics.reduce((sum, tm) => sum + tm.totalContacts, 0),
    totalLeads: teamMetrics.reduce((sum, tm) => sum + tm.totalLeads, 0),
    teamMetrics,
  };
};

function calculateUserMetrics(
  userId: string,
  deals: any[],
  contacts: any[],
  leads: any[],
  profile: any
): ConsolidatedTeamMetrics & TeamMetrics {
  const metrics = calculateUserMetricsFromData(userId, deals, contacts, leads, profile);
  return {
    ...metrics,
    totalActiveDeals: metrics.activeDeals,
    totalWonDeals: metrics.wonDeals,
    totalLostDeals: metrics.lostDeals,
    averageConversionRate: metrics.conversionRate,
    teamMetrics: [],
  };
}

function calculateUserMetricsFromData(
  userId: string,
  userDeals: any[],
  userContacts: any[],
  userLeads: any[],
  profile: any
): TeamMetrics {
  const totalPipeline = userDeals.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const wonDeals = userDeals.filter(d => d.stage === 'fechado_ganho');
  const lostDeals = userDeals.filter(d => d.stage === 'fechado_perdido');
  const activeDeals = userDeals.filter(d => !d.stage.includes('fechado'));

  const totalRevenue = wonDeals.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const conversionRate = userDeals.length > 0
    ? (wonDeals.length / userDeals.length) * 100
    : 0;

  const dealsByStage: Record<string, { count: number; value: number }> = {};
  userDeals.forEach(deal => {
    const stage = deal.stage;
    if (!dealsByStage[stage]) {
      dealsByStage[stage] = { count: 0, value: 0 };
    }
    dealsByStage[stage].count++;
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    dealsByStage[stage].value += value || 0;
  });

  const averageDealValue = userDeals.length > 0 ? totalPipeline / userDeals.length : 0;

  const averageTimeInPipeline = userDeals.length > 0
    ? userDeals.reduce((sum, deal) => {
        const created = new Date(deal.created_at).getTime();
        const updated = new Date(deal.updated_at).getTime();
        return sum + (updated - created);
      }, 0) / userDeals.length / (1000 * 60 * 60 * 24)
    : 0;

  return {
    userId,
    userName: profile?.full_name || profile?.email || 'Usuário',
    userEmail: profile?.email || '',
    totalPipeline,
    totalRevenue,
    activeDeals: activeDeals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    conversionRate,
    totalContacts: userContacts.length,
    totalLeads: userLeads.length,
    dealsByStage,
    averageDealValue,
    averageTimeInPipeline,
  };
}

export function useTeamMetrics(selectedUserIds?: string[]) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: isLoadingProfile } = useUserProfile();

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team-metrics', user?.id, selectedUserIds?.join(',')],
    queryFn: async ({ signal }) => {
      if (!user?.id) return emptyMetrics;
      try {
        return await fetchTeamMetrics(user.id, isAdmin, selectedUserIds, signal);
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return emptyMetrics;
      }
    },
    enabled: !!user?.id && !authLoading && !isLoadingProfile,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    metrics: metrics || emptyMetrics,
    isLoading,
    error,
  };
}
