import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

interface TreatmentEvolutionData {
  month: string;
  emTratamento: number;
  inadimplentes: number;
  agendados: number;
}

interface ReceitaDespesasData {
  month: string;
  receita: number;
  despesas: number;
}

interface EnhancedMetrics {
  averageDealValue: number;
  averagePipelineTime: number; // dias
  defaultRate: number; // taxa de inadimplência
  activeTreatments: number; // pacientes em tratamento ativo
  pendingFollowUps: number;
  appointmentsThisMonth: number;
  completedAppointmentsThisMonth: number;
  appointmentCompletionRate: number;
  averageTicketByProcedure: Array<{ procedure: string; avgTicket: number; count: number }>;
  treatmentEvolution: TreatmentEvolutionData[];
  receitaDespesas: ReceitaDespesasData[];
}

const fetchEnhancedMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  signal?: AbortSignal,
  doctorIds?: string[]
): Promise<EnhancedMetrics> => {
  // Buscar deals
  let dealsQuery = supabase
    .from('crm_deals')
    .select('*');

  if (!isAdminOrDono) {
    if (doctorIds && doctorIds.length > 0) {
      const orConditions = doctorIds
        .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
        .join(',');
      dealsQuery = dealsQuery.or(orConditions);
    } else {
      dealsQuery = dealsQuery.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
    }
  }

  const dealsResult = await supabaseQueryWithTimeout(dealsQuery as any, 30000, signal);
  const { data: deals } = dealsResult;
  const dealsData = deals || [];

  // Calcular valor médio de negócio
  const totalDealsValue = dealsData.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);
  const averageDealValue = dealsData.length > 0 ? totalDealsValue / dealsData.length : 0;

  // Calcular tempo médio no pipeline
  const closedDeals = dealsData.filter(d => d.stage === 'fechado_ganho' || d.stage === 'fechado_perdido');
  const pipelineTimes = closedDeals
    .filter(d => d.created_at && d.updated_at)
    .map(d => {
      const created = new Date(d.created_at);
      const updated = new Date(d.updated_at);
      return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
  const averagePipelineTime = pipelineTimes.length > 0
    ? pipelineTimes.reduce((sum, time) => sum + time, 0) / pipelineTimes.length
    : 0;

  // Taxa de inadimplência
  const defaultingDeals = dealsData.filter(d => d.is_defaulting === true).length;
  const activeDeals = dealsData.filter(d => !d.stage.includes('fechado')).length;
  const defaultRate = activeDeals > 0 ? (defaultingDeals / activeDeals) * 100 : 0;

  // Pacientes em tratamento ativo
  const activeTreatments = dealsData.filter(d => d.is_in_treatment === true).length;

  // Follow-ups pendentes
  let followUpsQuery = supabase
    .from('crm_activities')
    .select('id')
    .eq('completed', false)
    .eq('type', 'call');

  if (!isAdminOrDono) {
    if (doctorIds && doctorIds.length > 0) {
      followUpsQuery = followUpsQuery.in('user_id', doctorIds);
    } else {
      followUpsQuery = followUpsQuery.eq('user_id', userId);
    }
  }

  const followUpsResult = await supabaseQueryWithTimeout(followUpsQuery as any, 30000, signal);
  const { data: followUps } = followUpsResult;
  const pendingFollowUps = (followUps || []).length;

  // Consultas do mês
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  let appointmentsQuery = supabase
    .from('medical_appointments')
    .select('id, status')
    .gte('start_time', currentMonth.toISOString());

  if (!isAdminOrDono) {
    if (doctorIds && doctorIds.length > 0) {
      appointmentsQuery = appointmentsQuery.in('doctor_id', doctorIds);
    } else {
      appointmentsQuery = appointmentsQuery.eq('doctor_id', userId);
    }
  }

  const appointmentsResult = await supabaseQueryWithTimeout(appointmentsQuery as any, 30000, signal);
  const { data: appointments } = appointmentsResult;
  const appointmentsData = appointments || [];

  const appointmentsThisMonth = appointmentsData.length;
  const completedAppointmentsThisMonth = appointmentsData.filter(a => a.status === 'completed').length;
  const appointmentCompletionRate = appointmentsThisMonth > 0
    ? (completedAppointmentsThisMonth / appointmentsThisMonth) * 100
    : 0;

  // Ticket médio por procedimento
  const procedureTickets: Record<string, { total: number; count: number }> = {};

  dealsData.forEach(deal => {
    if (deal.stage === 'fechado_ganho' && deal.value && deal.contact?.service) {
      const service = deal.contact.service;
      const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;

      if (!procedureTickets[service]) {
        procedureTickets[service] = { total: 0, count: 0 };
      }

      procedureTickets[service].total += value;
      procedureTickets[service].count += 1;
    }
  });

  const averageTicketByProcedure = Object.entries(procedureTickets).map(([procedure, data]) => ({
    procedure,
    avgTicket: data.total / data.count,
    count: data.count
  })).sort((a, b) => b.avgTicket - a.avgTicket);

  // Evolução de pacientes em tratamento (últimos 12 meses)
  const treatmentEvolution: TreatmentEvolutionData[] = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthDeals = dealsData.filter(deal => {
      const dealDate = new Date(deal.updated_at);
      return dealDate >= monthStart && dealDate <= monthEnd;
    });

    treatmentEvolution.push({
      month: monthName,
      emTratamento: monthDeals.filter(d => d.is_in_treatment === true).length,
      inadimplentes: monthDeals.filter(d => d.is_defaulting === true).length,
      agendados: monthDeals.filter(d => d.stage === 'agendado').length
    });
  }

  // Receita vs Despesas (últimos 12 meses) - buscar dados financeiros
  const receitaDespesas: ReceitaDespesasData[] = [];

  try {
    // Buscar transações financeiras
    let transactionsQuery = supabase
      .from('financial_transactions')
      .select('amount, type, transaction_date');

    if (!isAdminOrDono) {
      if (doctorIds && doctorIds.length > 0) {
        transactionsQuery = transactionsQuery.in('user_id', doctorIds);
      } else {
        transactionsQuery = transactionsQuery.eq('user_id', userId);
      }
    }

    const transactionsResult = await supabaseQueryWithTimeout(transactionsQuery as any, 30000, signal);
    const { data: transactions } = transactionsResult;
    const transactionsData = transactions || [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransactions = transactionsData.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const receita = monthTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

      const despesas = monthTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

      receitaDespesas.push({
        month: monthName,
        receita,
        despesas
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    // Se falhar, retornar array vazio
  }

  return {
    averageDealValue,
    averagePipelineTime,
    defaultRate,
    activeTreatments,
    pendingFollowUps,
    appointmentsThisMonth,
    completedAppointmentsThisMonth,
    appointmentCompletionRate,
    averageTicketByProcedure,
    treatmentEvolution,
    receitaDespesas
  };
};

export function useEnhancedDashboardMetrics() {
  const { user, loading: authLoading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

  const doctorIdsToUse = isSecretaria ? doctorIds : [];

  return useQuery({
    queryKey: ['enhanced-dashboard-metrics', user?.id, profile?.role, doctorIdsToUse],
    queryFn: async ({ signal }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      return await fetchEnhancedMetrics(
        user.id,
        isAdminOrDono,
        signal,
        doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined
      );
    },
    enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile && (!isSecretaria || !isLoadingDoctors),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
