import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useTeamMembers } from './useTeamMembers';

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

const fetchTeamMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  selectedUserIds?: string[]
): Promise<ConsolidatedTeamMetrics> => {
  // Se não for admin/dono, SEMPRE retornar apenas dados do próprio usuário
  if (!isAdminOrDono) {
    // Médicos/vendedores veem APENAS seus próprios dados
    const targetUserIds = [userId];
    
    // Buscar deals apenas do próprio usuário
    const { data: deals, error: dealsError } = await supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(*)
      `)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`);

    if (dealsError) {
      throw new Error(`Erro ao buscar deals: ${dealsError.message}`);
    }

    // Buscar contatos apenas do próprio usuário
    const { data: contacts, error: contactsError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError) {
      throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
    }

    // Buscar leads apenas do próprio usuário
    const { data: leads, error: leadsError } = await supabase
      .from('commercial_leads')
      .select('*')
      .eq('user_id', userId);

    if (leadsError) {
      console.warn('Erro ao buscar leads:', leadsError);
    }

    // Buscar profile do próprio usuário
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Calcular métricas apenas do próprio usuário
    const userDeals = deals || [];
    const userContacts = contacts || [];
    const userLeads = leads || [];

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

    const profile = profilesMap.get(userId);

    const teamMetrics: TeamMetrics[] = [{
      userId: userId,
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
    }];

    return {
      totalPipeline,
      totalRevenue,
      totalActiveDeals: activeDeals.length,
      totalWonDeals: wonDeals.length,
      totalLostDeals: lostDeals.length,
      averageConversionRate: conversionRate,
      totalContacts: userContacts.length,
      totalLeads: userLeads.length,
      teamMetrics,
    };
  }

  // Admin/Dono: pode ver todos os dados
  let targetUserIds: string[] = [];
  
  if (selectedUserIds && selectedUserIds.length > 0) {
    targetUserIds = selectedUserIds;
  } else {
    // Buscar todos os membros ativos da equipe
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);
    
    if (profiles) {
      targetUserIds = profiles.map(p => p.id);
    }
  }

  if (targetUserIds.length === 0) {
    return {
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
  }

  // Buscar deals de todos os usuários selecionados
  const orConditions = targetUserIds
    .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
    .join(',');

  const { data: deals, error: dealsError } = await supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts(*)
    `)
    .or(orConditions);

  if (dealsError) {
    throw new Error(`Erro ao buscar deals: ${dealsError.message}`);
  }

  // Buscar contatos
  const { data: contacts, error: contactsError } = await supabase
    .from('crm_contacts')
    .select('*')
    .in('user_id', targetUserIds);

  if (contactsError) {
    throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);
  }

  // Buscar leads comerciais
  const { data: leads, error: leadsError } = await supabase
    .from('commercial_leads')
    .select('*')
    .in('user_id', targetUserIds);

  if (leadsError) {
    console.warn('Erro ao buscar leads:', leadsError);
  }

  // Buscar profiles para ter nomes
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', targetUserIds);

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Calcular métricas por usuário
  const teamMetrics: TeamMetrics[] = targetUserIds.map(targetUserId => {
    const userDeals = (deals || []).filter(
      d => d.user_id === targetUserId || d.assigned_to === targetUserId
    );
    const userContacts = (contacts || []).filter(c => c.user_id === targetUserId);
    const userLeads = (leads || []).filter(l => l.user_id === targetUserId);

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

    // Calcular tempo médio no pipeline (simplificado)
    const averageTimeInPipeline = userDeals.length > 0
      ? userDeals.reduce((sum, deal) => {
          const created = new Date(deal.created_at).getTime();
          const updated = new Date(deal.updated_at).getTime();
          return sum + (updated - created);
        }, 0) / userDeals.length / (1000 * 60 * 60 * 24) // Converter para dias
      : 0;

    const profile = profilesMap.get(targetUserId);

    return {
      userId: targetUserId,
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
  });

  // Calcular métricas consolidadas
  const totalPipeline = teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0);
  const totalRevenue = teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0);
  const totalActiveDeals = teamMetrics.reduce((sum, tm) => sum + tm.activeDeals, 0);
  const totalWonDeals = teamMetrics.reduce((sum, tm) => sum + tm.wonDeals, 0);
  const totalLostDeals = teamMetrics.reduce((sum, tm) => sum + tm.lostDeals, 0);
  const totalContacts = teamMetrics.reduce((sum, tm) => sum + tm.totalContacts, 0);
  const totalLeads = teamMetrics.reduce((sum, tm) => sum + tm.totalLeads, 0);

  const averageConversionRate = teamMetrics.length > 0
    ? teamMetrics.reduce((sum, tm) => sum + tm.conversionRate, 0) / teamMetrics.length
    : 0;

  return {
    totalPipeline,
    totalRevenue,
    totalActiveDeals,
    totalWonDeals,
    totalLostDeals,
    averageConversionRate,
    totalContacts,
    totalLeads,
    teamMetrics,
  };
};

export function useTeamMetrics(selectedUserIds?: string[]) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: isLoadingProfile } = useUserProfile();
  const isAdminOrDono = isAdmin;

  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team-metrics', user?.id, selectedUserIds?.join(',')],
    queryFn: async () => {
      if (!user?.id) {
        return {
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
      }
      try {
        return await fetchTeamMetrics(user.id, isAdminOrDono, selectedUserIds);
      } catch (error) {
        console.error('❌ useTeamMetrics - Erro ao buscar métricas:', error);
        return {
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
      }
    },
    enabled: !!user?.id && !authLoading && !isLoadingProfile, // Aguardar auth e profile carregarem
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    metrics: metrics || {
      totalPipeline: 0,
      totalRevenue: 0,
      totalActiveDeals: 0,
      totalWonDeals: 0,
      totalLostDeals: 0,
      averageConversionRate: 0,
      totalContacts: 0,
      totalLeads: 0,
      teamMetrics: [],
    },
    isLoading,
    error,
  };
}

