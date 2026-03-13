import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdCampaignDailyMetrics, aggregateDailyMetrics } from './useAdCampaignDailyMetrics';
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
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
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

  // Campanhas para metadados (nome, plataforma, status)
  const campaignFilters: any = {};
  if (filters.platform && filters.platform !== 'all') {
    campaignFilters.platform = filters.platform;
  }

  const { data: allCampaigns } = useAdCampaignsSync(campaignFilters);

  // Métricas diárias REAIS — filtradas por período no banco
  const campaignSyncIds = filters.campaign_id
    ? [filters.campaign_id]
    : undefined;

  const { data: dailyMetrics } = useAdCampaignDailyMetrics({
    start_date: periodDates.startDate,
    end_date: periodDates.endDate,
    campaign_sync_ids: campaignSyncIds,
  });

  // Leads filtrados por período
  const { data: leads } = useMarketingLeads({
    platform: filters.platform !== 'all' ? filters.platform : undefined,
  });
  const { data: leadMetrics } = useMarketingLeadMetrics({
    platform: filters.platform !== 'all' ? filters.platform : undefined,
    start_date: periodDates.start,
    end_date: periodDates.end,
  });

  return useQuery({
    queryKey: ['marketing-reports', filters, allCampaigns, dailyMetrics, leads, leadMetrics],
    queryFn: async (): Promise<ReportData> => {
      const campaignsData = filters.campaign_id
        ? (allCampaigns || []).filter(c => c.id === filters.campaign_id)
        : (allCampaigns || []);

      const dailyRows = dailyMetrics || [];
      const leadMetricsData = leadMetrics || {
        totalLeads: 0,
        leadsByStatus: {},
        leadsByPlatform: {},
        totalRevenue: 0,
        averageLeadValue: 0,
        conversionRate: 0,
      };

      // Filtrar daily rows por plataforma (via JOIN campaign data)
      let filteredDailyRows = dailyRows;
      if (filters.platform && filters.platform !== 'all') {
        filteredDailyRows = dailyRows.filter(row =>
          (row as any).campaign?.platform === filters.platform
        );
      }

      // Métricas agregadas do período (dados REAIS diários)
      const aggregated = aggregateDailyMetrics(filteredDailyRows);

      // Se não tiver dados diários ainda, fallback para dados cumulativos das campanhas
      const hasDaily = filteredDailyRows.length > 0;
      const metricsData = hasDaily ? aggregated : (() => {
        let total_spend = 0, total_impressions = 0, total_clicks = 0;
        let total_conversions = 0, total_conversion_value = 0;
        campaignsData.forEach(c => {
          total_spend += Number(c.spend) || 0;
          total_impressions += Number(c.impressions) || 0;
          total_clicks += Number(c.clicks) || 0;
          total_conversions += Number(c.conversions) || 0;
          total_conversion_value += Number(c.conversion_value) || 0;
        });
        return { total_spend, total_impressions, total_clicks, total_conversions, total_conversion_value, total_reach: 0 };
      })();

      // CTR, CPA, ROAS calculados dos totais do período
      const average_ctr = metricsData.total_impressions > 0
        ? (metricsData.total_clicks / metricsData.total_impressions) * 100
        : 0;
      const average_cpa = metricsData.total_conversions > 0
        ? metricsData.total_spend / metricsData.total_conversions
        : 0;
      const average_roas = metricsData.total_spend > 0
        ? metricsData.total_conversion_value / metricsData.total_spend
        : 0;

      // Agrupar por plataforma (dos dados diários)
      const byPlatform: ReportData['byPlatform'] = [];
      const platforms = ['google_ads', 'meta_ads'];

      if (hasDaily) {
        platforms.forEach(platform => {
          const platformRows = filteredDailyRows.filter(r => (r as any).campaign?.platform === platform);
          const agg = aggregateDailyMetrics(platformRows);
          if (agg.total_spend > 0 || agg.total_conversion_value > 0) {
            byPlatform.push({
              platform: platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
              spend: agg.total_spend,
              revenue: agg.total_conversion_value,
              conversions: agg.total_conversions,
              roas: agg.total_spend > 0 ? agg.total_conversion_value / agg.total_spend : 0,
            });
          }
        });
      } else {
        // Fallback: usar dados cumulativos das campanhas
        platforms.forEach(platform => {
          const platformCampaigns = campaignsData.filter(c => c.platform === platform);
          const spend = platformCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
          const revenue = platformCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
          const conversions = platformCampaigns.reduce((sum, c) => sum + c.conversions, 0);
          if (spend > 0 || revenue > 0) {
            byPlatform.push({
              platform: platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
              spend, revenue, conversions,
              roas: spend > 0 ? revenue / spend : 0,
            });
          }
        });
      }

      // Agrupar por campanha (dos dados diários no período)
      const byCampaign: ReportData['byCampaign'] = [];

      if (hasDaily) {
        const campaignMap = new Map<string, { name: string; platform: string; spend: number; revenue: number; conversions: number }>();
        filteredDailyRows.forEach(row => {
          const campaign = (row as any).campaign;
          if (!campaign) return;
          const key = row.campaign_sync_id;
          const existing = campaignMap.get(key) || {
            name: campaign.platform_campaign_name,
            platform: campaign.platform,
            spend: 0, revenue: 0, conversions: 0,
          };
          existing.spend += Number(row.spend) || 0;
          existing.revenue += Number(row.conversion_value) || 0;
          existing.conversions += Number(row.conversions) || 0;
          campaignMap.set(key, existing);
        });
        campaignMap.forEach((data, id) => {
          byCampaign.push({
            campaign_id: id,
            campaign_name: data.name,
            platform: data.platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
            spend: data.spend,
            revenue: data.revenue,
            conversions: data.conversions,
            roas: data.spend > 0 ? data.revenue / data.spend : 0,
          });
        });
        byCampaign.sort((a, b) => b.spend - a.spend);
      } else {
        // Fallback
        campaignsData.forEach(campaign => {
          byCampaign.push({
            campaign_id: campaign.id,
            campaign_name: campaign.platform_campaign_name,
            platform: campaign.platform === 'google_ads' ? 'Google Ads' : 'Meta Ads',
            spend: Number(campaign.spend) || 0,
            revenue: Number(campaign.conversion_value) || 0,
            conversions: campaign.conversions,
            roas: campaign.roas || 0,
          });
        });
        byCampaign.sort((a, b) => b.spend - a.spend);
      }

      // Dados diários REAIS para o gráfico
      const dailyData: ReportData['dailyData'] = [];

      if (hasDaily) {
        // Agrupar por data
        const dateMap = new Map<string, { spend: number; revenue: number; impressions: number; clicks: number; conversions: number }>();
        filteredDailyRows.forEach(row => {
          const dateKey = row.metric_date; // YYYY-MM-DD
          const existing = dateMap.get(dateKey) || { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 };
          existing.spend += Number(row.spend) || 0;
          existing.revenue += Number(row.conversion_value) || 0;
          existing.impressions += Number(row.impressions) || 0;
          existing.clicks += Number(row.clicks) || 0;
          existing.conversions += Number(row.conversions) || 0;
          dateMap.set(dateKey, existing);
        });

        // Converter para array ordenado
        const sortedDates = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        sortedDates.forEach(([dateStr, data]) => {
          const d = new Date(dateStr + 'T00:00:00');
          dailyData.push({
            date: format(d, 'dd/MM'),
            ...data,
          });
        });
      } else {
        // Fallback: gerar dados sintéticos (média diária)
        const chartStart = new Date(periodDates.start);
        const chartEnd = new Date(periodDates.end);
        const chartDays = Math.ceil((chartEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
        const days = Math.max(chartDays, 1);
        const dailyAvgSpend = metricsData.total_spend / days;
        const dailyAvgRevenue = metricsData.total_conversion_value / days;

        for (let i = 0; i <= Math.min(chartDays, 90); i++) {
          const date = new Date(chartStart);
          date.setDate(date.getDate() + i);
          dailyData.push({
            date: format(date, 'dd/MM'),
            spend: dailyAvgSpend,
            revenue: dailyAvgRevenue,
            impressions: Math.floor(metricsData.total_impressions / days),
            clicks: Math.floor(metricsData.total_clicks / days),
            conversions: Math.floor(metricsData.total_conversions / days),
          });
        }
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
          average_ctr,
          average_cpa,
          average_roas,
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
