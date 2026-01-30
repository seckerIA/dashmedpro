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
  dropOffRate: number; // Percentual de perda
  isCritical: boolean; // Se perda > 40%
}

export interface ConcentrationMetric {
  isHighRisk: boolean; // Se > 80% da receita vem de < 20% das fontes
  topSource: string;
  topSourceValue: number;
  topSourcePercentage: number;
  totalRevenue: number;
}

export interface TeamMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string; // Cargo do usuário: admin, dono, medico, secretaria, vendedor
  totalPipeline: number;
  totalRevenue: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalDeals: number; // Total de deals únicos (para cálculo de conversão sem duplicação)
  conversionRate: number;
  totalContacts: number;
  totalLeads: number;
  dealsByStage: Record<string, { count: number; value: number }>;
  averageDealValue: number;
  averageTimeInPipeline: number;
  // Novos Insights
  bottleneck?: BottleneckMetric;
  revenueConcentration?: ConcentrationMetric;
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
  // Insights Consolidados
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
  teamMetrics: [],
};

// Metricas especificas para secretarias
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

// Buscar metricas leves para secretarias
const fetchSecretaryMetrics = async (
  userId: string,
  signal?: AbortSignal
): Promise<SecretaryMetrics> => {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  // Buscar perfil do usuario
  const profileQuery = supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .single();

  // Contar agendamentos criados pela secretaria hoje
  const appointmentsTodayQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  // Contar agendamentos criados pela secretaria este mes
  const appointmentsMonthQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  // Contar contatos criados pela secretaria hoje
  const contactsTodayQuery = supabase
    .from('crm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  // Contar contatos criados pela secretaria este mes
  const contactsMonthQuery = supabase
    .from('crm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  // Contar confirmacoes hoje (agendamentos com status confirmado atualizados hoje)
  const confirmationsTodayQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmado')
    .gte('updated_at', todayStart)
    .lte('updated_at', todayEnd);

  // Contar pendentes de confirmacao
  const pendingConfirmationsQuery = supabase
    .from('medical_appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'agendado')
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
    appointmentsScheduledToday: appointmentsTodayResult.count || 0,
    appointmentsScheduledThisMonth: appointmentsMonthResult.count || 0,
    patientsRegisteredToday: contactsTodayResult.count || 0,
    patientsRegisteredThisMonth: contactsMonthResult.count || 0,
    confirmationsToday: confirmationsTodayResult.count || 0,
    pendingConfirmations: pendingConfirmationsResult.count || 0,
    userName: profileResult.data?.full_name || profileResult.data?.email || 'Secretaria',
    userEmail: profileResult.data?.email || '',
  };
};

const fetchTeamMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  selectedUserIds?: string[],
  signal?: AbortSignal,
  isMedico?: boolean // Novo parâmetro
): Promise<ConsolidatedTeamMetrics> => {
  // Calcular data de início do mês atual para filtrar métricas
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();

  // Se for médico (não admin), buscar métricas próprias + secretárias vinculadas
  if (isMedico && !isAdminOrDono) {
    // Buscar IDs de secretárias vinculadas ao médico
    const { data: links } = await supabase
      .from('secretary_doctor_links')
      .select('secretary_id')
      .eq('doctor_id', userId);

    const linkedSecretaryIds = links?.map(l => l.secretary_id) || [];
    const allUserIds = [userId, ...linkedSecretaryIds];

    // Buscar dados para o médico e suas secretárias
    const dealsQuery = supabase
      .from('crm_deals')
      .select(`id, title, value, stage, user_id, assigned_to, created_at, updated_at, contact:crm_contacts(id, full_name)`)
      .or(allUserIds.map(id => `user_id.eq.${id}`).join(',') + ',' + allUserIds.map(id => `assigned_to.eq.${id}`).join(','))
      .limit(500);

    const contactsQuery = supabase
      .from('crm_contacts')
      .select('*')
      .in('user_id', allUserIds);

    const leadsQuery = supabase
      .from('commercial_leads')
      .select('*')
      .in('user_id', allUserIds);

    const profilesQuery = supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', allUserIds);

    // NOVA QUERY: Buscar consultas agendadas no mês atual
    const appointmentsQuery = supabase
      .from('medical_appointments')
      .select('id, user_id, estimated_value, payment_status, created_at')
      .in('user_id', allUserIds)
      .gte('created_at', monthStart);

    const [dealsResult, contactsResult, leadsResult, profilesResult, appointmentsResult] = await Promise.all([
      supabaseQueryWithTimeout(dealsQuery, 25000, signal),
      supabaseQueryWithTimeout(contactsQuery, 25000, signal),
      supabaseQueryWithTimeout(leadsQuery, 25000, signal),
      supabaseQueryWithTimeout(profilesQuery, 25000, signal),
      supabaseQueryWithTimeout(appointmentsQuery, 25000, signal),
    ]);

    if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
    if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

    const deals = dealsResult.data || [];
    const contacts = contactsResult.data || [];
    const leads = leadsResult.data || [];
    const profiles = profilesResult.data || [];
    const appointments = appointmentsResult.data || [];

    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    // Calcular métricas por usuário (médico + secretárias)
    const teamMetrics: TeamMetrics[] = allUserIds.map(targetUserId => {
      const userDeals = deals.filter(d => d.user_id === targetUserId || d.assigned_to === targetUserId);
      const userContacts = contacts.filter(c => c.user_id === targetUserId);
      const userLeads = leads.filter(l => l.user_id === targetUserId);
      const userAppointments = appointments.filter(a => a.user_id === targetUserId);
      const profile = profilesMap.get(targetUserId);

      return calculateUserMetricsFromData(targetUserId, userDeals, userContacts, userLeads, profile, userAppointments, monthStart);
    });

    // Calcular métricas consolidadas
    const totalWonDeals = teamMetrics.reduce((sum, tm) => sum + tm.wonDeals, 0);
    const totalLostDeals = teamMetrics.reduce((sum, tm) => sum + tm.lostDeals, 0);
    // Total de leads criados no mês para cálculo de conversão
    const totalLeadsThisMonth = teamMetrics.reduce((sum, tm) => sum + tm.totalLeads, 0);

    return {
      totalPipeline: teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0),
      totalRevenue: teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0),
      totalActiveDeals: teamMetrics.reduce((sum, tm) => sum + tm.activeDeals, 0),
      totalWonDeals,
      totalLostDeals,
      // Conversão global: total de consultas agendadas / total de leads criados no mês
      averageConversionRate: totalLeadsThisMonth > 0
        ? (totalWonDeals / totalLeadsThisMonth) * 100
        : 0,
      totalContacts: teamMetrics.reduce((sum, tm) => sum + tm.totalContacts, 0),
      totalLeads: totalLeadsThisMonth,
      teamMetrics,
    };
  }

  // Se não for admin/dono E não for médico, retornar apenas dados do próprio usuário
  if (!isAdminOrDono) {
    const dealsQuery = supabase
      .from('crm_deals')
      .select(`id, title, value, stage, user_id, assigned_to, created_at, updated_at, contact:crm_contacts(id, full_name)`)
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .limit(500);

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
      .select('id, email, full_name, role')
      .eq('id', userId);

    // NOVA QUERY: Buscar consultas agendadas no mês atual
    const appointmentsQuery = supabase
      .from('medical_appointments')
      .select('id, user_id, estimated_value, payment_status, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart);

    const [dealsResult, contactsResult, leadsResult, profilesResult, appointmentsResult] = await Promise.all([
      supabaseQueryWithTimeout(dealsQuery, 25000, signal),
      supabaseQueryWithTimeout(contactsQuery, 25000, signal),
      supabaseQueryWithTimeout(leadsQuery, 25000, signal),
      supabaseQueryWithTimeout(profilesQuery, 25000, signal),
      supabaseQueryWithTimeout(appointmentsQuery, 25000, signal),
    ]);

    if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
    if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

    const deals = dealsResult.data || [];
    const contacts = contactsResult.data || [];
    const leads = leadsResult.data || [];
    const profiles = profilesResult.data || [];
    const appointments = appointmentsResult.data || [];

    const profile = profiles[0];
    const userMetrics = calculateUserMetrics(userId, deals, contacts, leads, profile, appointments, monthStart);

    return {
      ...userMetrics,
      teamMetrics: [userMetrics],
    };
  }

  // Admin/Dono: pode ver todos os dados
  let targetUserIds: string[] = [];

  if (selectedUserIds && selectedUserIds.length > 0) {
    // Limitar a 50 usuários para evitar queries muito pesadas
    targetUserIds = selectedUserIds.slice(0, 50);
  } else {
    // Limitar busca de perfis para evitar queries muito pesadas
    const profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .limit(50); // Reduzido de 100 para 50 para melhor performance

    const { data: profiles, error } = await supabaseQueryWithTimeout(profilesQuery, 25000, signal);
    if (!error && profiles && profiles.length > 0) {
      targetUserIds = profiles.map(p => p.id);
    }
  }

  if (targetUserIds.length === 0) {
    return emptyMetrics;
  }

  // Otimizar: usar in() ao invés de or() quando possível
  // Para deals, buscar por user_id e assigned_to separadamente e combinar
  const dealsQuery = supabase
    .from('crm_deals')
    .select(`id, title, value, stage, user_id, assigned_to, created_at, updated_at, contact:crm_contacts(id, full_name)`)
    .or(`user_id.in.(${targetUserIds.join(',')}),assigned_to.in.(${targetUserIds.join(',')})`)
    .limit(1000); // Limite de deals para evitar queries muito pesadas

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
    .select('id, email, full_name, role')
    .in('id', targetUserIds);

  // NOVA QUERY: Buscar consultas agendadas no mês atual
  const appointmentsQuery = supabase
    .from('medical_appointments')
    .select('id, user_id, estimated_value, payment_status, created_at')
    .in('user_id', targetUserIds)
    .gte('created_at', monthStart);

  const [dealsResult, contactsResult, leadsResult, profilesResult, appointmentsResult] = await Promise.all([
    supabaseQueryWithTimeout(dealsQuery, 25000, signal),
    supabaseQueryWithTimeout(contactsQuery, 25000, signal),
    supabaseQueryWithTimeout(leadsQuery, 25000, signal),
    supabaseQueryWithTimeout(profilesQuery, 25000, signal),
    supabaseQueryWithTimeout(appointmentsQuery, 25000, signal),
  ]);

  if (dealsResult.error) throw new Error(`Erro ao buscar deals: ${dealsResult.error.message}`);
  if (contactsResult.error) throw new Error(`Erro ao buscar contatos: ${contactsResult.error.message}`);

  const deals = dealsResult.data || [];
  const contacts = contactsResult.data || [];
  const leads = leadsResult.data || [];
  const profiles = profilesResult.data || [];
  const appointments = appointmentsResult.data || [];

  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Calcular métricas por usuário
  const teamMetrics: TeamMetrics[] = targetUserIds.map(targetUserId => {
    const userDeals = deals.filter(d => d.user_id === targetUserId || d.assigned_to === targetUserId);
    const userContacts = contacts.filter(c => c.user_id === targetUserId);
    const userLeads = leads.filter(l => l.user_id === targetUserId);
    const userAppointments = appointments.filter(a => a.user_id === targetUserId);
    const profile = profilesMap.get(targetUserId);

    return calculateUserMetricsFromData(targetUserId, userDeals, userContacts, userLeads, profile, userAppointments, monthStart);
  });

  // Calcular métricas consolidadas
  const totalWonDeals = teamMetrics.reduce((sum, tm) => sum + tm.wonDeals, 0);
  const totalLostDeals = teamMetrics.reduce((sum, tm) => sum + tm.lostDeals, 0);
  // Total de leads criados no mês para cálculo de conversão
  const totalLeadsThisMonth = teamMetrics.reduce((sum, tm) => sum + tm.totalLeads, 0);

  return {
    totalPipeline: teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0),
    totalRevenue: teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0),
    totalActiveDeals: teamMetrics.reduce((sum, tm) => sum + tm.activeDeals, 0),
    totalWonDeals,
    totalLostDeals,
    // Conversão global: total de consultas agendadas / total de leads criados no mês
    averageConversionRate: totalLeadsThisMonth > 0
      ? (totalWonDeals / totalLeadsThisMonth) * 100
      : 0,
    totalContacts: teamMetrics.reduce((sum, tm) => sum + tm.totalContacts, 0),
    totalLeads: totalLeadsThisMonth,
    teamMetrics,
  };
};

function calculateUserMetrics(
  userId: string,
  deals: any[],
  contacts: any[],
  leads: any[],
  profile: any,
  appointments: any[],
  monthStart: string
): ConsolidatedTeamMetrics & TeamMetrics {
  const metrics = calculateUserMetricsFromData(userId, deals, contacts, leads, profile, appointments, monthStart);
  return {
    ...metrics,
    totalActiveDeals: metrics.activeDeals,
    totalWonDeals: metrics.wonDeals,
    totalLostDeals: metrics.lostDeals,
    averageConversionRate: metrics.conversionRate,
    teamMetrics: [],
    globalBottleneck: metrics.bottleneck,
    globalConcentration: metrics.revenueConcentration,
  };
}

function calculateUserMetricsFromData(
  userId: string,
  userDeals: any[],
  userContacts: any[],
  userLeads: any[],
  profile: any,
  userAppointments: any[] = [],
  monthStart?: string
): TeamMetrics {
  const activeDealsList = userDeals.filter(d => !d.stage.includes('fechado'));
  // Considerar como "ganho" tanto o stage tradicional quanto os stages médicos de conversão
  const wonDeals = userDeals.filter(d =>
    d.stage === 'fechado_ganho' ||
    d.stage === 'agendado' ||           // Paciente agendou consulta
    d.stage === 'em_tratamento' ||      // Paciente em tratamento ativo
    d.stage === 'aguardando_retorno'    // Paciente aguardando retorno (convertido)
  );
  const lostDeals = userDeals.filter(d =>
    d.stage === 'fechado_perdido' ||
    d.stage === 'inadimplente'          // Paciente inadimplente (perda)
  );

  const totalPipeline = activeDealsList.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const activeDeals = activeDealsList.length;

  // NOVA LÓGICA: Receita total vem de consultas PAGAS no mês
  const totalRevenue = userAppointments.reduce((sum, appointment) => {
    if (appointment.payment_status === 'paid' && appointment.estimated_value) {
      const value = typeof appointment.estimated_value === 'string'
        ? parseFloat(appointment.estimated_value)
        : appointment.estimated_value;
      return sum + (value || 0);
    }
    return sum;
  }, 0);

  // NOVA LÓGICA: Filtrar leads criados NO MÊS ATUAL para cálculo de conversão
  const leadsThisMonth = monthStart
    ? userLeads.filter(l => l.created_at >= monthStart)
    : userLeads;

  // NOVA LÓGICA: Conversão = (consultas agendadas no mês) / (leads criados no mês) * 100
  const scheduledAppointmentsCount = userAppointments.length;
  const conversionRate = leadsThisMonth.length > 0
    ? (scheduledAppointmentsCount / leadsThisMonth.length) * 100
    : 0;

  const dealsByStage: Record<string, { count: number; value: number }> = {};
  const stageCounts: Record<string, number> = {};

  userDeals.forEach(deal => {
    const stage = deal.stage;
    if (!dealsByStage[stage]) {
      dealsByStage[stage] = { count: 0, value: 0 };
      stageCounts[stage] = 0;
    }
    dealsByStage[stage].count++;
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    dealsByStage[stage].value += value || 0;
    stageCounts[stage]++;
  });

  const averageDealValue = userDeals.length > 0 ? totalPipeline / userDeals.length : 0;

  const averageTimeInPipeline = userDeals.length > 0
    ? userDeals.reduce((sum, deal) => {
      const created = new Date(deal.created_at).getTime();
      const updated = new Date(deal.updated_at).getTime();
      return sum + (updated - created);
    }, 0) / userDeals.length / (1000 * 60 * 60 * 24)
    : 0;

  // --- CÁLCULO DE GARGALOS (Bottleneck) ---
  // Ordem assumida: lead -> qualificado -> proposta -> negociacao -> fechado_ganho
  // Simplificacao: vamos detectar o estágio com maior % de "não conversão" para o próximo
  // Para um MVP, vamos pegar apenas stages ativos e ordená-los por volume (suposição de funil)
  // Em produção, isso deveria vir de uma configuração de Pipeline
  let bottleneck: BottleneckMetric | undefined;
  const stages = Object.keys(dealsByStage).filter(s => !s.includes('fechado')); // Ignora finalizados

  // Se tivermos pelo menos 2 estágios para comparar
  if (stages.length >= 2) {
    // Ordenar por volume (assumindo funil decrescente)
    const sortedStages = stages.sort((a, b) => dealsByStage[b].count - dealsByStage[a].count);

    let maxDropOff = 0;

    for (let i = 0; i < sortedStages.length - 1; i++) {
      const current = sortedStages[i];
      const next = sortedStages[i + 1];
      const currentCount = dealsByStage[current].count;
      const nextCount = dealsByStage[next].count;

      if (currentCount > 0) {
        const dropOff = ((currentCount - nextCount) / currentCount) * 100;
        if (dropOff > maxDropOff) {
          maxDropOff = dropOff;
          bottleneck = {
            stage: current,
            previousStageCount: currentCount,
            currentStageCount: nextCount,
            dropOffRate: dropOff,
            isCritical: dropOff > 50 // Se perder mais de 50% é crítico
          };
        }
      }
    }
  }

  // --- CÁLCULO DE CONCENTRAÇÃO (Revenue Concentration) ---
  // Tenta agrupar por "Produto" (usando prefixo do título) ou fallback para "Produto Único"
  // Ex: "Consulta - Maria" -> "Consulta"
  const revenueBySource: Record<string, number> = {};
  if (wonDeals.length > 0) {
    wonDeals.forEach(d => {
      // Tenta pegar a primeira palavra como "Produto/Serviço"
      const source = d.title ? d.title.split(' ')[0] : 'Outros';
      revenueBySource[source] = (revenueBySource[source] || 0) + (parseFloat(d.value) || 0);
    });

    // Achar top source
    const sortedSources = Object.entries(revenueBySource).sort((a, b) => b[1] - a[1]);
    if (sortedSources.length > 0) {
      const [topSource, topValue] = sortedSources[0];
      const percentage = totalRevenue > 0 ? (topValue / totalRevenue) * 100 : 0;

      // Risco se > 80% concentrado em 1 tipo
      if (percentage > 80) {
        // revenueConcentration = { ... } (atribuído abaixo)
      }

      // Retorna metrica mesmo se não for risco alto, para ter dados
      var calculatedConcentration: ConcentrationMetric = {
        isHighRisk: percentage > 80,
        topSource: topSource,
        topSourceValue: topValue,
        topSourcePercentage: percentage,
        totalRevenue
      };
    }
  }

  return {
    userId,
    userName: profile?.full_name || profile?.email || 'Usuário',
    userEmail: profile?.email || '',
    userRole: profile?.role || undefined,
    totalPipeline,
    totalRevenue,
    activeDeals, // activeDeals já é um número
    wonDeals: scheduledAppointmentsCount, // ALTERADO: Agora representa consultas agendadas no mês
    lostDeals: lostDeals.length,
    totalDeals: userDeals.length, // Total de deals únicos do usuário
    conversionRate,
    totalContacts: userContacts.length,
    totalLeads: leadsThisMonth.length, // ALTERADO: Apenas leads criados no mês
    dealsByStage,
    averageDealValue,
    averageTimeInPipeline,
    bottleneck,
    revenueConcentration: typeof calculatedConcentration !== 'undefined' ? calculatedConcentration : undefined
  };
}

export function useTeamMetrics(selectedUserIds?: string[]) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSecretaria, isMedico, isLoading: isLoadingProfile } = useUserProfile();

  // Query para metricas de equipe (admins/vendedores/medicos)
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
        // Ignorar erros de cancelamento/timeout para evitar logs desnecessários
        if (error?.message?.includes('cancelada') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('aborted') ||
          error?.name === 'AbortError') {
          console.log('Query cancelada, retornando métricas vazias');
          return emptyMetrics;
        }
        console.error('Erro ao buscar métricas:', error);
        return emptyMetrics;
      }
    },
    // Nao executar para secretarias - elas usam secretaryMetrics
    enabled: !!user?.id && !authLoading && !isLoadingProfile && !isSecretaria,
    staleTime: 10 * 60 * 1000, // 10 minutos - aumentar cache
    gcTime: 15 * 60 * 1000, // 15 minutos em cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Não refetch ao reconectar - usar cache
    refetchInterval: false, // Não fazer refetch automático
    retry: 1, // Reduzir retries para evitar acúmulo de queries
    retryDelay: 2000,
    // Cancelar queries anteriores quando uma nova é iniciada
    networkMode: 'online',
  });

  // Query especifica para secretarias (mais leve e rapida)
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
        if (error?.message?.includes('cancelada') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('aborted') ||
          error?.name === 'AbortError') {
          console.log('Query secretaria cancelada');
          return emptySecretaryMetrics;
        }
        console.error('Erro ao buscar métricas da secretaria:', error);
        return emptySecretaryMetrics;
      }
    },
    // So executar para secretarias
    enabled: !!user?.id && !authLoading && !isLoadingProfile && isSecretaria,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
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
