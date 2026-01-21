import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { getContactService } from '@/lib/crm';

interface DashboardMetrics {
  totalPipelineValue: number;
  totalClosedValue: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  totalContacts: number;
  dealsByStage: Record<string, { count: number; value: number }>;
  monthlyLeads: Array<{ month: string; leads: number }>;
  monthlyRevenue: Array<{ month: string; projected: number; closed: number }>;
  servicesInterest: Array<{ service: string; count: number }>;
  conversionByStage: Array<{ stage: string; conversion: number }>;
  recentDeals: Array<any>;
}

const fetchDashboardMetrics = async (
  userId: string,
  isAdminOrDono: boolean,
  signal?: AbortSignal,
  doctorIds?: string[] // IDs dos médicos vinculados (para secretárias)
): Promise<DashboardMetrics> => {
  // Buscar deals com contatos
  let dealsQuery = supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts(*)
    `);

  // Aplicar filtros baseados no papel do usuário
  if (!isAdminOrDono) {
    if (doctorIds && doctorIds.length > 0) {
      // Secretária: ver deals dos médicos vinculados
      const orConditions = doctorIds
        .map(id => `user_id.eq.${id},assigned_to.eq.${id}`)
        .join(',');
      dealsQuery = dealsQuery.or(orConditions);
    } else {
      // Outros usuários: ver apenas seus próprios deals
      dealsQuery = dealsQuery.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
    }
  }
  // Admin/Dono: ver todos os deals (sem filtro)

  // Passar o query builder (não executado) para permitir abortSignal
  const dealsResult = await supabaseQueryWithTimeout(dealsQuery as any, 15000, signal);
  const { data: deals, error: dealsError } = dealsResult;

  if (dealsError) throw new Error(`Erro ao buscar deals: ${dealsError.message}`);

  // Buscar contatos
  let contactsQuery = supabase
    .from('crm_contacts')
    .select('*');

  // Aplicar filtros baseados no papel do usuário
  if (!isAdminOrDono) {
    if (doctorIds && doctorIds.length > 0) {
      // Secretária: ver contatos dos médicos vinculados
      contactsQuery = contactsQuery.in('user_id', doctorIds);
    } else {
      // Outros usuários: ver apenas seus próprios contatos
      contactsQuery = contactsQuery.eq('user_id', userId);
    }
  }
  // Admin/Dono: ver todos os contatos (sem filtro)

  // Passar o query builder (não executado) para permitir abortSignal
  const contactsResult = await supabaseQueryWithTimeout(contactsQuery as any, 15000, signal);
  const { data: contacts, error: contactsError } = contactsResult;

  if (contactsError) throw new Error(`Erro ao buscar contatos: ${contactsError.message}`);

  const dealsData = deals || [];
  const contactsData = contacts || [];

  // Calcular métricas básicas
  const totalPipelineValue = dealsData.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const activeDeals = dealsData.filter(d =>
    !d.stage.includes('fechado')
  ).length;

  const wonDeals = dealsData.filter(d =>
    d.stage === 'fechado_ganho'
  ).length;

  const lostDeals = dealsData.filter(d =>
    d.stage === 'fechado_perdido'
  ).length;

  const totalClosedValue = dealsData
    .filter(d => d.stage === 'fechado_ganho')
    .reduce((sum, deal) => {
      const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
      return sum + (value || 0);
    }, 0);

  // Taxa de conversão: deals ganhos / total de deals (incluindo ativos, ganhos e perdidos)
  // Garantir que não haja divisão por zero e que o resultado seja um número válido
  const conversionRate = dealsData.length > 0
    ? Math.round((wonDeals / dealsData.length) * 100 * 100) / 100 // Arredondar para 2 casas decimais
    : 0;

  // Calcular deals por estágio
  const dealsByStage: Record<string, { count: number; value: number }> = {};
  const stages = ['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'];

  stages.forEach(stage => {
    const stageDeals = dealsData.filter(d => d.stage === stage);
    const stageValue = stageDeals.reduce((sum, deal) => {
      const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
      return sum + (value || 0);
    }, 0);

    dealsByStage[stage] = {
      count: stageDeals.length,
      value: stageValue
    };
  });

  // Gerar dados mensais (últimos 12 meses)
  const monthlyLeads = [];
  const monthlyRevenue = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Contar leads criados no mês (usando comparação de string YYYY-MM para bater com o banco)
    const monthLeads = contactsData.filter(contact =>
      contact.created_at?.startsWith(monthKey)
    ).length;

    // Calcular receita projetada e fechada do mês
    const monthDeals = dealsData.filter(deal =>
      deal.created_at?.startsWith(monthKey)
    );

    const monthProjected = monthDeals.reduce((sum, deal) => {
      const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
      return sum + (value || 0);
    }, 0);

    const monthClosed = monthDeals
      .filter(deal => deal.stage === 'fechado_ganho')
      .reduce((sum, deal) => {
        const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
        return sum + (value || 0);
      }, 0);

    monthlyLeads.push({ month: monthName, leads: monthLeads });
    monthlyRevenue.push({
      month: monthName,
      projected: monthProjected,
      closed: monthClosed
    });
  }

  // Calcular interesse por serviços - com labels traduzidos
  // Primeiro, coletar todos os procedure_ids únicos
  const procedureIds = new Set<string>();
  contactsData.forEach(contact => {
    const contactService = getContactService(contact);
    if (contactService) {
      procedureIds.add(contactService);
    }
  });

  // Buscar nomes dos procedimentos do banco de dados
  let procedureNames: Record<string, string> = {};
  if (procedureIds.size > 0) {
    const { data: procedures } = await supabaseQueryWithTimeout(
      supabase
        .from('commercial_procedures')
        .select('id, name')
        .in('id', Array.from(procedureIds)) as any,
      15000,
      signal
    );

    if (procedures) {
      procedures.forEach((proc: any) => {
        procedureNames[proc.id] = proc.name;
      });
    }
  }

  // Mapeamento de nomes técnicos para labels amigáveis (fallback para serviços não-médicos)
  const serviceLabels: Record<string, string> = {
    'procedure': 'Procedimentos',
    'first_visit': 'Primeira Consulta',
    'return': 'Retorno',
    'gestao_trafego': 'Gestão de Tráfego',
    'branding_completo': 'Branding Completo',
    'desenvolvimento_web': 'Desenvolvimento Web',
    'social_media': 'Social Media',
    'consultoria_seo': 'Consultoria SEO',
    'branding_midia': 'Branding e Mídia',
    'automacao_ia': 'Automação IA'
  };

  const servicesInterest: Array<{ service: string; count: number }> = [];
  const serviceCounts: Record<string, number> = {};

  contactsData.forEach(contact => {
    const contactService = getContactService(contact);
    if (contactService) {
      // Prioridade: nome do procedimento do banco > label hardcoded > ID original
      const label = procedureNames[contactService] || serviceLabels[contactService] || contactService;
      serviceCounts[label] = (serviceCounts[label] || 0) + 1;
    }
  });

  Object.entries(serviceCounts).forEach(([service, count]) => {
    servicesInterest.push({ service, count });
  });

  // Calcular conversão por estágio
  // A conversão representa: dos deals que entraram nesse estágio, quantos % passaram para o próximo
  const conversionByStage = [];
  const stageOrder = ['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao'];

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const currentStage = stageOrder[i];
    const nextStage = stageOrder[i + 1];

    const currentCount = dealsByStage[currentStage]?.count || 0;
    const nextCount = dealsByStage[nextStage]?.count || 0;

    // Limitar a 100% - não pode ter mais conversão do que 100%
    const conversion = currentCount > 0
      ? Math.min((nextCount / currentCount) * 100, 100)
      : 0;
    conversionByStage.push({ stage: currentStage, conversion: Math.round(conversion * 10) / 10 }); // 1 casa decimal
  }

  // Pegar os 5 últimos deals atualizados
  const recentDeals = [...dealsData]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return {
    totalPipelineValue,
    totalClosedValue,
    activeDeals,
    wonDeals,
    lostDeals,
    conversionRate,
    totalContacts: contactsData.length,
    dealsByStage,
    monthlyLeads,
    monthlyRevenue,
    servicesInterest,
    conversionByStage,
    recentDeals
  };
};

export function useDashboardMetrics() {
  const { user, loading: authLoading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

  // Secretária usa lista de médicos vinculados para filtrar
  const doctorIdsToUse = isSecretaria ? doctorIds : [];

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, profile?.role, doctorIdsToUse],
    queryFn: async ({ signal }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      try {
        const result = await fetchDashboardMetrics(
          user.id,
          isAdminOrDono,
          signal,
          doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined
        );
        return result;
      } catch (error: any) {
        console.error('❌ useDashboardMetrics - Erro ao buscar métricas:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile && (!isSecretaria || !isLoadingDoctors),
    refetchInterval: (query) => {
      // Se a query está carregando, não fazer refetch para evitar acúmulo
      if (query.state.fetchStatus === 'fetching') {
        return false;
      }
      return 5 * 60 * 1000; // 5 minutos quando não está carregando
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Não refetch ao reconectar - usar cache
    refetchIntervalInBackground: false, // Não refetch quando aba não está em foco
    staleTime: 5 * 60 * 1000, // Considerar dados válidos por 5 minutos (era 30s)
    gcTime: 30 * 60 * 1000, // 30 minutos para idle longo
    retry: 1, // Reduzir retries para evitar acúmulo
  });
}
