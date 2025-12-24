import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdPlatformConnections } from './useAdPlatformConnections';
import { useAdCampaignMetrics } from './useAdCampaignsSync';
import { useCommercialLeads } from './useCommercialLeads';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

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
  lastSyncTime: string | null;
  hasConnections: boolean;
}

export function useMarketingDashboard() {
  // Buscar dados do mês atual
  const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
  const endOfCurrentMonth = endOfMonth(new Date()).toISOString();
  
  const { data: campaigns } = useAdCampaignsSync();
  const { data: connections } = useAdPlatformConnections();
  const { data: metrics } = useAdCampaignMetrics({
    start_date: startOfCurrentMonth,
    end_date: endOfCurrentMonth,
  });
  
  // Buscar leads do mês (vamos usar um hook que já existe ou criar um filtrado)
  const { data: allLeads } = useCommercialLeads({});
  
  return useQuery({
    queryKey: ['marketing-dashboard', campaigns, connections, metrics, allLeads],
    queryFn: async (): Promise<MarketingDashboardData> => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:66',message:'queryFn iniciado',data:{hasCampaigns:!!campaigns,campaignsCount:campaigns?.length,hasConnections:!!connections,connectionsCount:connections?.length,hasMetrics:!!metrics,hasAllLeads:!!allLeads,allLeadsCount:allLeads?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const campaignsData = campaigns || [];
      const connectionsData = connections || [];
      const metricsData = metrics || {
        total_spend: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_conversion_value: 0,
        average_ctr: 0,
        average_cpa: 0,
        average_roas: 0,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:81',message:'dados processados',data:{campaignsDataLength:campaignsData.length,connectionsDataLength:connectionsData.length,metricsDataTotalSpend:metricsData.total_spend,metricsDataTotalRevenue:metricsData.total_conversion_value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Filtrar leads do mês atual que vieram de anúncios
      const currentMonthLeads = (allLeads || []).filter(lead => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:83',message:'filtrando lead',data:{leadId:lead?.id,leadOrigin:lead?.origin,leadCreatedAt:lead?.created_at,startOfMonth:startOfCurrentMonth,endOfMonth:endOfCurrentMonth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        const leadDate = new Date(lead.created_at);
        const startDate = new Date(startOfCurrentMonth);
        const endDate = new Date(endOfCurrentMonth);
        const isInMonth = leadDate >= startDate && leadDate <= endDate;
        const isFromAds = lead.origin === 'google' || lead.origin === 'facebook' || lead.origin === 'instagram';
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:90',message:'filtro aplicado',data:{leadId:lead?.id,isInMonth,isFromAds,willInclude:isInMonth && isFromAds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        return isInMonth && isFromAds;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:95',message:'leads filtrados',data:{totalLeads:allLeads?.length || 0,currentMonthLeadsCount:currentMonthLeads.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // Calcular métricas por plataforma
      const googleCampaigns = campaignsData.filter(c => c.platform === 'google_ads');
      const metaCampaigns = campaignsData.filter(c => c.platform === 'meta_ads');
      
      const googleAdsSpend = googleCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      const metaAdsSpend = metaCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
      
      const googleAdsRevenue = googleCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
      const metaAdsRevenue = metaCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
      
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
      
      // Status de integrações
      const activeConnections = connectionsData.filter(c => c.is_active).length;
      const lastSync = connectionsData
        .filter(c => c.last_sync_at)
        .sort((a, b) => {
          const dateA = new Date(a.last_sync_at || 0);
          const dateB = new Date(b.last_sync_at || 0);
          return dateB.getTime() - dateA.getTime();
        })[0]?.last_sync_at || null;
      
      const result = {
        totalSpend: metricsData.total_spend,
        totalRevenue: metricsData.total_conversion_value,
        averageROAS: metricsData.average_roas,
        totalLeads: currentMonthLeads.length,
        googleAdsSpend,
        metaAdsSpend,
        googleAdsRevenue,
        metaAdsRevenue,
        topCampaignsByROAS,
        topCampaignsByConversions,
        alerts: alerts.slice(0, 5), // Limitar a 5 alertas
        activeConnections,
        lastSyncTime: lastSync,
        hasConnections: connectionsData.length > 0,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingDashboard.tsx:167',message:'resultado final',data:{totalSpend:result.totalSpend,totalRevenue:result.totalRevenue,averageROAS:result.averageROAS,totalLeads:result.totalLeads,alertsCount:result.alerts.length,activeConnections:result.activeConnections,hasConnections:result.hasConnections},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return result;
    },
    enabled: true,
  });
}

