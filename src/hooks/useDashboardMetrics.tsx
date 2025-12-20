import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

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

const fetchDashboardMetrics = async (userId: string, isAdminOrDono: boolean): Promise<DashboardMetrics> => {
  // Buscar deals com contatos
  let dealsQuery = supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts(*)
    `);

  // Apenas filtrar por usuário se NÃO for Admin/Dono
  if (!isAdminOrDono) {
    dealsQuery = dealsQuery.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
  }

  const { data: deals, error: dealsError } = await dealsQuery;

  if (dealsError) throw new Error(`Erro ao buscar deals: ${dealsError.message}`);

  // Buscar contatos
  let contactsQuery = supabase
    .from('crm_contacts')
    .select('*');

  // Apenas filtrar por usuário se NÃO for Admin/Dono
  if (!isAdminOrDono) {
    contactsQuery = contactsQuery.eq('user_id', userId);
  }

  const { data: contacts, error: contactsError } = await contactsQuery;

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
    
    // Contar leads criados no mês
    const monthLeads = contactsData.filter(contact => {
      const contactDate = new Date(contact.created_at);
      return contactDate.getFullYear() === date.getFullYear() && 
             contactDate.getMonth() === date.getMonth();
    }).length;
    
    // Calcular receita projetada e fechada do mês
    const monthDeals = dealsData.filter(deal => {
      const dealDate = new Date(deal.created_at);
      return dealDate.getFullYear() === date.getFullYear() && 
             dealDate.getMonth() === date.getMonth();
    });
    
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

  // Calcular interesse por serviços
  const servicesInterest: Array<{ service: string; count: number }> = [];
  const serviceCounts: Record<string, number> = {};
  
  contactsData.forEach(contact => {
    if (contact.service) {
      serviceCounts[contact.service] = (serviceCounts[contact.service] || 0) + 1;
    }
  });
  
  Object.entries(serviceCounts).forEach(([service, count]) => {
    servicesInterest.push({ service, count });
  });

  // Calcular conversão por estágio
  const conversionByStage = [];
  const stageOrder = ['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao'];
  
  for (let i = 0; i < stageOrder.length - 1; i++) {
    const currentStage = stageOrder[i];
    const nextStage = stageOrder[i + 1];
    
    const currentCount = dealsByStage[currentStage]?.count || 0;
    const nextCount = dealsByStage[nextStage]?.count || 0;
    
    const conversion = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
    conversionByStage.push({ stage: currentStage, conversion });
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
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  const isAdminOrDono = profile?.role === 'admin' || profile?.role === 'dono';

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      try {
        return await fetchDashboardMetrics(user.id, isAdminOrDono);
      } catch (error) {
        console.error('❌ useDashboardMetrics - Erro ao buscar métricas:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
