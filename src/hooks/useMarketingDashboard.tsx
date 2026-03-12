import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdPlatformConnections } from './useAdPlatformConnections';
import { useCommercialLeads } from './useCommercialLeads';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

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

  // Status de integrações
  activeConnections: number;
  activeAccountsList: ActiveAccountInfo[];
  lastSyncTime: string | null;
  hasConnections: boolean;
}

export function useMarketingDashboard() {
  // Buscar dados do mês atual
  const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
  const endOfCurrentMonth = endOfMonth(new Date()).toISOString();
  
  const { data: campaigns } = useAdCampaignsSync();
  const { data: connections } = useAdPlatformConnections();

  // Buscar leads do mês (vamos usar um hook que já existe ou criar um filtrado)
  const { leads: allLeads } = useCommercialLeads({});

  return useQuery({
    queryKey: ['marketing-dashboard', campaigns, connections, allLeads],
    queryFn: async (): Promise<MarketingDashboardData> => {
      const connectionsData = connections || [];

      // Contas ativas: apenas ad accounts reais (category 'other')
      const activeConns = connectionsData.filter(
        c => c.is_active && c.account_category === 'other'
      );
      const activeConnIds = new Set(activeConns.map(c => c.id));

      // Filtrar campanhas apenas das contas ATIVAS
      // Os dados no ad_campaigns_sync representam os últimos 90 dias (date_preset=last_90d)
      // Não filtramos por data aqui — cada campanha tem um único record cumulativo
      const allCampaigns = campaigns || [];
      const campaignsData = activeConnIds.size > 0
        ? allCampaigns.filter(c => activeConnIds.has(c.connection_id))
        : [];

      // Filtrar leads do mês atual que vieram de anúncios
      const currentMonthLeads = (allLeads || []).filter(lead => {
        const leadDate = new Date(lead.created_at);
        const startDate = new Date(startOfCurrentMonth);
        const endDate = new Date(endOfCurrentMonth);
        const isInMonth = leadDate >= startDate && leadDate <= endDate;
        const isFromAds = lead.origin === 'google' || lead.origin === 'facebook' || lead.origin === 'instagram';
        return isInMonth && isFromAds;
      });

      // Calcular métricas por plataforma (das campanhas filtradas)
      const googleCampaigns = campaignsData.filter(c => c.platform === 'google_ads');
      const metaCampaigns = campaignsData.filter(c => c.platform === 'meta_ads');

      const googleAdsSpend = googleCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      const metaAdsSpend = metaCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);

      const googleAdsRevenue = googleCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
      const metaAdsRevenue = metaCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);

      // Calcular métricas agregadas das campanhas filtradas
      const totalSpend = campaignsData.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      const totalRevenue = campaignsData.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
      const roasValues = campaignsData.filter(c => c.roas && c.roas > 0).map(c => Number(c.roas));
      const averageROAS = roasValues.length > 0
        ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length
        : 0;

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

      return {
        totalSpend,
        totalRevenue,
        averageROAS,
        totalLeads: currentMonthLeads.length,
        googleAdsSpend,
        metaAdsSpend,
        googleAdsRevenue,
        metaAdsRevenue,
        topCampaignsByROAS,
        topCampaignsByConversions,
        alerts: alerts.slice(0, 5),
        activeConnections: activeConns.length,
        activeAccountsList,
        lastSyncTime: lastSync,
        hasConnections: connectionsData.length > 0,
      };
    },
    enabled: true,
  });
}

