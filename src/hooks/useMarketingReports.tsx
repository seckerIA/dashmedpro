import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdCampaignMetrics } from './useAdCampaignsSync';
import { useMarketingLeads, useMarketingLeadMetrics } from './useMarketingLeads';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export type ReportPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface ReportFilters {
  period: ReportPeriod;
  start_date?: string;
  end_date?: string;
  platform?: 'google_ads' | 'meta_ads' | 'all';
  campaign_id?: string;
}

export interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  metrics: {
    total_spend: number;
    total_revenue: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_leads: number;
    average_ctr: number;
    average_cpa: number;
    average_roas: number;
    roi: number;
  };
  byPlatform: Array<{
    platform: string;
    spend: number;
    revenue: number;
    conversions: number;
    roas: number;
  }>;
  byCampaign: Array<{
    campaign_id: string;
    campaign_name: string;
    platform: string;
    spend: number;
    revenue: number;
    conversions: number;
    roas: number;
  }>;
  dailyData: Array<{
    date: string;
    spend: number;
    revenue: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}

function getPeriodDates(period: ReportPeriod, start_date?: string, end_date?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  switch (period) {
    case 'today':
      start = startOfDay(now);
      break;
    case '7d':
      start = startOfDay(subDays(now, 7));
      break;
    case '30d':
      start = startOfDay(subDays(now, 30));
      break;
    case '90d':
      start = startOfDay(subDays(now, 90));
      break;
    case 'custom':
      start = start_date ? new Date(start_date) : startOfDay(subDays(now, 30));
      end = end_date ? new Date(end_date) : endOfDay(now);
      break;
    default:
      start = startOfDay(subDays(now, 30));
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: period === 'custom' 
      ? `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
      : period === 'today' 
        ? 'Hoje'
        : period === '7d'
          ? 'Últimos 7 dias'
          : period === '30d'
            ? 'Últimos 30 dias'
            : 'Últimos 90 dias',
  };
}

export function useMarketingReports(filters: ReportFilters) {
  const periodDates = getPeriodDates(filters.period, filters.start_date, filters.end_date);
  
  // Filtros de campanhas: NÃO passamos start_date/end_date porque os dados
  // no ad_campaigns_sync são cumulativos (last_90d) e cada campanha tem um
  // único record. O filtro de período é aplicado no gráfico e nos leads.
  const campaignFilters: any = {};
  if (filters.platform && filters.platform !== 'all') {
    campaignFilters.platform = filters.platform;
  }
  if (filters.campaign_id) {
    campaignFilters.connection_id = filters.campaign_id;
  }

  const { data: campaigns } = useAdCampaignsSync(campaignFilters);
  const { data: metrics } = useAdCampaignMetrics(campaignFilters);
  const { data: leads } = useMarketingLeads({
    platform: filters.platform !== 'all' ? filters.platform : undefined,
    campaign_id: filters.campaign_id,
  });
  const { data: leadMetrics } = useMarketingLeadMetrics({
    platform: filters.platform !== 'all' ? filters.platform : undefined,
    campaign_id: filters.campaign_id,
    start_date: periodDates.start,
    end_date: periodDates.end,
  });

  return useQuery({
    queryKey: ['marketing-reports', filters, campaigns, metrics, leads, leadMetrics],
    queryFn: async (): Promise<ReportData> => {
      const campaignsData = campaigns || [];
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
      const leadsData = leads || [];
      const leadMetricsData = leadMetrics || {
        totalLeads: 0,
        leadsByStatus: {},
        leadsByPlatform: {},
        totalRevenue: 0,
        averageLeadValue: 0,
        conversionRate: 0,
      };

      // Agrupar por plataforma
      const byPlatform: ReportData['byPlatform'] = [];
      const platforms = ['google_ads', 'meta_ads'];
      
      platforms.forEach(platform => {
        const platformCampaigns = campaignsData.filter(c => c.platform === platform);
        const spend = platformCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        const revenue = platformCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
        const conversions = platformCampaigns.reduce((sum, c) => sum + c.conversions, 0);
        const roas = spend > 0 ? revenue / spend : 0;

        if (spend > 0 || revenue > 0) {
          byPlatform.push({
            platform: platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
            spend,
            revenue,
            conversions,
            roas,
          });
        }
      });

      // Agrupar por campanha
      const byCampaign: ReportData['byCampaign'] = campaignsData
        .map(campaign => ({
          campaign_id: campaign.id,
          campaign_name: campaign.platform_campaign_name,
          platform: campaign.platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
          spend: Number(campaign.spend) || 0,
          revenue: Number(campaign.conversion_value) || 0,
          conversions: campaign.conversions,
          roas: campaign.roas || 0,
        }))
        .sort((a, b) => b.spend - a.spend);

      // Dados diários — média diária calculada a partir dos totais do período de sync (90d)
      // A Meta API não retorna breakdown diário nesta integração, então mostramos
      // o total do período com média diária como referência.
      const dailyData: ReportData['dailyData'] = [];

      // Usar o período real coberto pelos insights (start_date/end_date da campanha)
      // para calcular a média diária mais precisa
      let totalDaysCovered = 90; // default: last_90d
      if (campaignsData.length > 0) {
        const earliestStart = campaignsData
          .filter(c => c.start_date)
          .reduce((min, c) => {
            const d = new Date(c.start_date!);
            return d < min ? d : min;
          }, new Date());
        const daysDiff = Math.ceil((new Date().getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 0) totalDaysCovered = daysDiff;
      }

      // Gerar pontos para o gráfico usando a média diária do período
      const chartStart = new Date(periodDates.start);
      const chartEnd = new Date(periodDates.end);
      const chartDays = Math.ceil((chartEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAvgSpend = totalDaysCovered > 0 ? metricsData.total_spend / totalDaysCovered : 0;
      const dailyAvgRevenue = totalDaysCovered > 0 ? metricsData.total_conversion_value / totalDaysCovered : 0;
      const dailyAvgImpressions = totalDaysCovered > 0 ? Math.floor(metricsData.total_impressions / totalDaysCovered) : 0;
      const dailyAvgClicks = totalDaysCovered > 0 ? Math.floor(metricsData.total_clicks / totalDaysCovered) : 0;
      const dailyAvgConversions = totalDaysCovered > 0 ? Math.floor(metricsData.total_conversions / totalDaysCovered) : 0;

      for (let i = 0; i <= Math.min(chartDays, 90); i++) {
        const date = new Date(chartStart);
        date.setDate(date.getDate() + i);
        dailyData.push({
          date: format(date, 'dd/MM'),
          spend: dailyAvgSpend,
          revenue: dailyAvgRevenue,
          impressions: dailyAvgImpressions,
          clicks: dailyAvgClicks,
          conversions: dailyAvgConversions,
        });
      }

      const totalRevenue = metricsData.total_conversion_value + leadMetricsData.totalRevenue;
      const totalSpend = metricsData.total_spend;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      return {
        period: {
          start: periodDates.start,
          end: periodDates.end,
          label: periodDates.label,
        },
        metrics: {
          total_spend: totalSpend,
          total_revenue: totalRevenue,
          total_impressions: metricsData.total_impressions,
          total_clicks: metricsData.total_clicks,
          total_conversions: metricsData.total_conversions,
          total_leads: leadMetricsData.totalLeads,
          average_ctr: metricsData.average_ctr,
          average_cpa: metricsData.average_cpa,
          average_roas: metricsData.average_roas,
          roi,
        },
        byPlatform,
        byCampaign,
        dailyData,
      };
    },
    enabled: true,
  });
}

