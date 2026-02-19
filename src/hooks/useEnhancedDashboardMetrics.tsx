import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { parseLocalDate } from '@/utils/dateUtils';

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
  // IDs para filtro
  const targetIds = (doctorIds && doctorIds.length > 0) ? doctorIds : [userId];
  const idsString = `(${targetIds.join(',')})`;

  // 1. Buscar deals com tratamento defensivo
  let dealsData: any[] = [];
  try {
    // RLS handles organization filtering automatically
    const dealsQuery = supabase
      .from('crm_deals')
      .select('*, contact:crm_contacts(id, full_name, email, phone)');

    const dealsResult = await supabaseQueryWithTimeout(dealsQuery as any, 30000, signal);
    dealsData = (dealsResult.data || []) as any[];
  } catch (err) {
    console.error('⚠️ Erro ao buscar deals no dashboard:', err);
    const fallbackQuery = supabase.from('crm_deals').select('*');
    const fallbackResult = await supabaseQueryWithTimeout(fallbackQuery as any, 30000, signal);
    dealsData = (fallbackResult.data || []) as any[];
  }

  // Calcular valor médio de negócio
  const totalDealsValue = dealsData.reduce((sum: number, deal: any) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);
  const averageDealValue = dealsData.length > 0 ? totalDealsValue / dealsData.length : 0;

  // Calcular tempo médio no pipeline
  const closedDeals = dealsData.filter((d: any) => d.stage === 'fechado_ganho' || d.stage === 'fechado_perdido');
  const pipelineTimes = closedDeals
    .map((d: any) => {
      const created = parseLocalDate(d.created_at);
      const updated = parseLocalDate(d.updated_at);
      return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
  const averagePipelineTime = pipelineTimes.length > 0
    ? pipelineTimes.reduce((sum: number, time: number) => sum + time, 0) / pipelineTimes.length
    : 0;

  // Taxa de inadimplência
  const defaultingDeals = dealsData.filter((d: any) => d.is_defaulting === true || d.stage === 'inadimplente').length;
  const activeDeals = dealsData.filter((d: any) => !d.stage.includes('fechado')).length;
  const defaultRate = activeDeals > 0 ? (defaultingDeals / activeDeals) * 100 : 0;

  // Pacientes em tratamento ativo
  const activeTreatments = dealsData.filter((d: any) => d.is_in_treatment === true || d.stage === 'em_tratamento').length;

  // 2. Follow-ups pendentes (Ajustado para usar somente 'activity_type' que é o correto no banco)
  let pendingFollowUps = 0;
  try {
    // RLS handles organization filtering
    const followUpsQuery = (supabase
      .from('crm_activities' as any) as any)
      .select('id')
      .eq('completed', false)
      .eq('activity_type', 'call');

    const followUpsResult = await supabaseQueryWithTimeout(followUpsQuery as any, 30000, signal);
    pendingFollowUps = ((followUpsResult.data || []) as any[]).length;
  } catch (err) {
    console.error('⚠️ Erro ao buscar follow-ups:', err);
  }

  // 3. Consultas do mês
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  let appointmentsData: any[] = [];
  try {
    // RLS handles organization filtering
    const appointmentsQuery = supabase
      .from('medical_appointments')
      .select('id, status')
      .gte('start_time', currentMonth.toISOString());

    const appointmentsResult = await supabaseQueryWithTimeout(appointmentsQuery as any, 30000, signal);
    appointmentsData = (appointmentsResult.data || []) as any[];
  } catch (err) {
    console.error('⚠️ Erro ao buscar agendamentos no dashboard:', err);
  }

  const appointmentsThisMonth = appointmentsData.length;
  const completedAppointmentsThisMonth = appointmentsData.filter((a: any) => a.status === 'completed').length;
  const appointmentCompletionRate = appointmentsThisMonth > 0
    ? (completedAppointmentsThisMonth / appointmentsThisMonth) * 100
    : 0;

  // Ticket médio por procedimento (usando title ou service provider se service falhar)
  const procedureTickets: Record<string, { total: number; count: number }> = {};

  dealsData.forEach((deal: any) => {
    // Incluir qualquer deal que tenha valor, independente do estágio (para mostrar potencial)
    if (deal.value && deal.value > 0) {
      const service = deal.service || deal.title || 'Outros';
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

  // Evolução de pacientes (últimos 12 meses)
  const treatmentEvolution: TreatmentEvolutionData[] = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthDeals = dealsData.filter((deal: any) => {
      const dealDate = parseLocalDate(deal.updated_at);
      return dealDate >= monthStart && dealDate <= monthEnd;
    });

    treatmentEvolution.push({
      month: monthName,
      emTratamento: monthDeals.filter((d: any) => d.is_in_treatment === true || d.stage === 'em_tratamento').length,
      inadimplentes: monthDeals.filter((d: any) => d.is_defaulting === true || d.stage === 'inadimplente').length,
      agendados: monthDeals.filter((d: any) => d.stage === 'agendado').length
    });
  }

  // 4. Receita vs Despesas
  const receitaDespesas: ReceitaDespesasData[] = [];

  try {
    // RLS handles organization filtering
    const transactionsQuery = supabase
      .from('financial_transactions' as any)
      .select('amount, type, status, transaction_date');

    const transactionsResult = await supabaseQueryWithTimeout(transactionsQuery as any, 30000, signal);
    const transactionsData = (transactionsResult.data || []) as any[];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransactions = transactionsData.filter((t: any) => {
        const tDate = parseLocalDate(t.transaction_date || t.created_at);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const receita = monthTransactions
        .filter((t: any) => (t.type === 'entrada' || t.type === 'receita') && t.status !== 'cancelada')
        .reduce((sum: number, t: any) => sum + ((typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount) || 0), 0);

      const despesas = monthTransactions
        .filter((t: any) => (t.type === 'saida' || t.type === 'despesa') && t.status !== 'cancelada')
        .reduce((sum: number, t: any) => sum + ((typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount) || 0), 0);

      receitaDespesas.push({
        month: monthName,
        receita,
        despesas
      });
    }
  } catch (error) {
    console.error('⚠️ Erro ao buscar dados financeiros no dashboard:', error);
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
        doctorIdsToUse
      );
    },
    enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile && (!isSecretaria || !isLoadingDoctors),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for longer
    gcTime: 15 * 60 * 1000, // 15 minutes in cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
