import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdPlatformConnections } from './useAdPlatformConnections';
import { useAdCampaignDailyMetrics, aggregateDailyMetrics } from './useAdCampaignDailyMetrics';
import { useMarketingLeads } from './useMarketingLeads';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export interface ActiveAccountInfo {
  id: string;
  name: string;
  category: string;
  lastSync: string | null;
}

export interface MarketingDashboardData {
  // Métricas principais
  totalSpend: number;
  totalRevenue: number;
  averageROAS: number;
  totalLeads: number;

  // KPIs de lead gen (essenciais para clínica médica)
  cpl: number; // Custo por Lead
  cac: number; // Custo de Aquisição de Paciente (appointment completed)
  leadToPatientRate: number; // Taxa de conversão Lead → Paciente (%)
  newPatients: number; // Leads que se tornaram pacientes (appointment completed)

  // Comparativos
  googleAdsSpend: number;
  metaAdsSpend: number;
  googleAdsRevenue: number;
  metaAdsRevenue: number;

  // Top campanhas
  topCampaignsByROAS: Array<{
    id: string;
    name: string;
    roas: number;
    spend: number;
    revenue: number;
  }>;
  topCampaignsByConversions: Array<{
    id: string;
    name: string;
    conversions: number;
    spend: number;
    revenue: number;
  }>;

  // Alertas
  alerts: Array<{
    type: 'low_roas' | 'no_conversions' | 'budget_limit' | 'optimization';
    message: string;
    campaignId?: string;
    campaignName?: string;
  }>;

  // Dados diários para gráficos
  dailyPerformance: Array<{
    date: string;
    gasto: number;
    receita: number;
  }>;
  
  // Status de integrações
  activeConnections: number;
  activeAccountsList: ActiveAccountInfo[];
  lastSyncTime: string | null;
  hasConnections: boolean;
}

export function useMarketingDashboard(filters?: { startDate?: Date; endDate?: Date }) {
  // Buscar dados baseados no filtro ou mês atual
  const now = new Date();
  const startOfRange = filters?.startDate || startOfMonth(now);
  const endOfRange = filters?.endDate || endOfMonth(now);
  
  const rangeStartISO = startOfRange.toISOString();
  const rangeEndISO = endOfRange.toISOString();
  const startDateStr = format(startOfRange, 'yyyy-MM-dd');
  const endDateStr = format(endOfRange, 'yyyy-MM-dd');

  const { data: campaigns } = useAdCampaignsSync();
  const { data: connections } = useAdPlatformConnections();

  // Métricas diárias do período
  const { data: dailyMetrics } = useAdCampaignDailyMetrics({
    start_date: startDateStr,
    end_date: endDateStr,
  });

  // Buscar leads de formulários (lead_form_submissions + commercial_leads marketing) filtrados por data
  const { data: allLeads } = useMarketingLeads({
    start_date: rangeStartISO,
    end_date: rangeEndISO,
    include_conversions_in_range: true
  });

  return useQuery({
    queryKey: ['marketing-dashboard', campaigns, connections, allLeads, dailyMetrics, startDateStr, endDateStr],
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    queryFn: async (): Promise<MarketingDashboardData> => {
      const connectionsData = connections || [];

      // Contas ativas: apenas ad accounts reais (category 'other')
      const activeConns = connectionsData.filter(
        c => c.is_active && c.account_category === 'other'
      );
      const activeConnIds = new Set(activeConns.map(c => c.id));

      // Filtrar campanhas apenas das contas ATIVAS
      const allCampaigns = campaigns || [];
      const campaignsData = activeConnIds.size > 0
        ? allCampaigns.filter(c => activeConnIds.has(c.connection_id))
        : [];

      const startDate = new Date(rangeStartISO);
      const endDate = new Date(rangeEndISO);

      // Leads captados no período (volume de lead gen)
      const leadsCaptured = (allLeads || []).filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= startDate && leadDate <= endDate;
      });

      // Pacientes novos: leads (de qualquer data) que tiveram consulta completed NESTE período.
      const newPatientsList = (allLeads || []).filter(l => {
        if (l.appointment_status !== 'completed') return false;
        if (!l.appointment_completed_at) return false;
        const apptDate = new Date(l.appointment_completed_at);
        return apptDate >= startDate && apptDate <= endDate;
      });
      const newPatients = newPatientsList.length;

      // Usar métricas diárias APENAS se existem dados reais para o mês atual
      // Se daily metrics estão vazias para este mês, usar dados cumulativos (90d)
      const monthlyDailyRows = dailyMetrics || [];
      const useDailyData = monthlyDailyRows.length > 0;

      let totalSpend: number, totalRevenue: number, averageROAS: number;
      let googleAdsSpend: number, metaAdsSpend: number;
      let googleAdsRevenue: number, metaAdsRevenue: number;

      if (useDailyData) {
        // Filtrar daily rows pelas contas ativas
        const activeCampaignIds = new Set(campaignsData.map(c => c.id));
        const activeRows = monthlyDailyRows.filter(r => activeCampaignIds.has(r.campaign_sync_id));
        const agg = aggregateDailyMetrics(activeRows);

        totalSpend = agg.total_spend;
        totalRevenue = agg.total_conversion_value;
        averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        const googleRows = activeRows.filter(r => (r as any).campaign?.platform === 'google_ads');
        const metaRows = activeRows.filter(r => (r as any).campaign?.platform === 'meta_ads');
        const googleAgg = aggregateDailyMetrics(googleRows);
        const metaAgg = aggregateDailyMetrics(metaRows);

        googleAdsSpend = googleAgg.total_spend;
        metaAdsSpend = metaAgg.total_spend;
        googleAdsRevenue = googleAgg.total_conversion_value;
        metaAdsRevenue = metaAgg.total_conversion_value;
      } else {
        // Fallback: dados cumulativos (90 dias)
        const googleCampaigns = campaignsData.filter(c => c.platform === 'google_ads');
        const metaCampaigns = campaignsData.filter(c => c.platform === 'meta_ads');

        googleAdsSpend = googleCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        metaAdsSpend = metaCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        googleAdsRevenue = googleCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
        metaAdsRevenue = metaCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);

        totalSpend = campaignsData.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        totalRevenue = campaignsData.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
        // ROAS = total revenue / total spend (não média de ROAS individuais)
        averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      }

      // Top campanhas por ROAS
      const topCampaignsByROAS = campaignsData
        .filter(c => c.roas && c.roas > 0)
        .sort((a, b) => (b.roas || 0) - (a.roas || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.platform_campaign_name,
          roas: c.roas || 0,
          spend: Number(c.spend) || 0,
          revenue: Number(c.conversion_value) || 0,
        }));

      // Top campanhas por conversões
      const topCampaignsByConversions = campaignsData
        .filter(c => c.conversions > 0)
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.platform_campaign_name,
          conversions: c.conversions,
          spend: Number(c.spend) || 0,
          revenue: Number(c.conversion_value) || 0,
        }));

      // Gerar alertas
      const alerts: MarketingDashboardData['alerts'] = [];

      // Campanhas com baixo ROAS
      campaignsData.forEach(campaign => {
        if (campaign.roas && campaign.roas < 2 && campaign.status === 'active') {
          alerts.push({
            type: 'low_roas',
            message: `Campanha "${campaign.platform_campaign_name}" tem ROAS baixo (${campaign.roas.toFixed(2)}x)`,
            campaignId: campaign.id,
            campaignName: campaign.platform_campaign_name,
          });
        }
      });

      // Campanhas sem conversões há mais de 7 dias
      const sevenDaysAgo = subDays(new Date(), 7);
      campaignsData.forEach(campaign => {
        if (campaign.conversions === 0 && campaign.status === 'active') {
          const lastSync = new Date(campaign.synced_at);
          if (lastSync < sevenDaysAgo) {
            alerts.push({
              type: 'no_conversions',
              message: `Campanha "${campaign.platform_campaign_name}" não tem conversões há mais de 7 dias`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
            });
          }
        }
      });

      // Alerta de CPL alto (campanha ativa com CPL > 2× média da conta)
      const activeCampaignsWithLeads = campaignsData.filter(
        c => c.status === 'active' && c.conversions > 0 && Number(c.spend) > 0
      );
      if (activeCampaignsWithLeads.length > 1) {
        const avgCpl =
          activeCampaignsWithLeads.reduce(
            (sum, c) => sum + Number(c.spend) / c.conversions,
            0
          ) / activeCampaignsWithLeads.length;

        activeCampaignsWithLeads.forEach(campaign => {
          const campaignCpl = Number(campaign.spend) / campaign.conversions;
          if (campaignCpl > avgCpl * 2) {
            alerts.push({
              type: 'low_roas',
              message: `CPL alto em "${campaign.platform_campaign_name}": R$ ${campaignCpl.toFixed(2)} (2× acima da média R$ ${avgCpl.toFixed(2)})`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
            });
          }
        });
      }

      // Lista de contas ativas para exibir no dashboard
      const activeAccountsList: ActiveAccountInfo[] = activeConns.map(c => ({
        id: c.id,
        name: c.account_name,
        category: c.account_category || 'other',
        lastSync: c.last_sync_at || null,
      }));

      const lastSync = connectionsData
        .filter(c => c.last_sync_at)
        .sort((a, b) => {
          const dateA = new Date(a.last_sync_at || 0);
          const dateB = new Date(b.last_sync_at || 0);
          return dateB.getTime() - dateA.getTime();
        })[0]?.last_sync_at || null;

      // Preparar dados diários para o gráfico
      const dailyPerformanceMap = new Map<string, { gasto: number; receita: number }>();
      
      (dailyMetrics || []).forEach(row => {
        const date = format(new Date(row.metric_date), 'dd/MM');
        const current = dailyPerformanceMap.get(date) || { gasto: 0, receita: 0 };
        dailyPerformanceMap.set(date, {
          gasto: current.gasto + (Number(row.spend) || 0),
          receita: current.receita + (Number(row.conversion_value) || 0)
        });
      });

      const dailyPerformance = Array.from(dailyPerformanceMap.entries())
        .map(([date, values]) => ({
          date,
          gasto: values.gasto,
          receita: values.receita
        }))
        .sort((a, b) => {
          // Sort by date (DD/MM) - simplistic but works for same-year ranges
          const [dayA, monthA] = a.date.split('/').map(Number);
          const [dayB, monthB] = b.date.split('/').map(Number);
          return (monthA * 100 + dayA) - (monthB * 100 + dayB);
        });

      const totalLeadsCount = leadsCaptured.length;
      const cpl = totalLeadsCount > 0 ? totalSpend / totalLeadsCount : 0;
      const cac = newPatients > 0 ? totalSpend / newPatients : 0;
      const leadToPatientRate = totalLeadsCount > 0 ? (newPatients / totalLeadsCount) * 100 : 0;

      return {
        totalSpend,
        totalRevenue,
        averageROAS,
        totalLeads: totalLeadsCount,
        cpl,
        cac,
        leadToPatientRate,
        newPatients,
        googleAdsSpend,
        metaAdsSpend,
        googleAdsRevenue,
        metaAdsRevenue,
        topCampaignsByROAS,
        topCampaignsByConversions,
        alerts: alerts.slice(0, 5),
        dailyPerformance,
        activeConnections: activeConns.length,
        activeAccountsList,
        lastSyncTime: lastSync,
        hasConnections: connectionsData.length > 0,
      };
    },
    enabled: true,
  });
}

