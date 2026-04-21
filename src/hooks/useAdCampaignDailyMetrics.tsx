import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AdCampaignDailyMetric } from '@/types/adPlatforms';

export interface DailyMetricsFilters {
  start_date: string;
  end_date: string;
  campaign_sync_ids?: string[];
}

export function useAdCampaignDailyMetrics(filters: DailyMetricsFilters) {
  return useQuery({
    queryKey: ['ad-campaign-daily-metrics', filters],
    queryFn: async () => {
      let query = (supabase
        .from('ad_campaign_daily_metrics' as any) as any)
        .select(`
          *,
          campaign:ad_campaigns_sync(id, platform_campaign_name, platform, connection_id, status)
        `)
        .gte('metric_date', filters.start_date)
        .lte('metric_date', filters.end_date)
        .order('metric_date', { ascending: true });

      if (filters.campaign_sync_ids && filters.campaign_sync_ids.length > 0) {
        query = query.in('campaign_sync_id', filters.campaign_sync_ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as (AdCampaignDailyMetric & {
        campaign?: {
          id: string;
          platform_campaign_name: string;
          platform: string;
          connection_id: string;
          status: string;
        };
      })[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Verifica se o sistema de métricas diárias está ativo (pelo menos 1 sync feito)
// Usado para decidir: mostrar R$ 0 (sem dados no período) vs fallback cumulativo (nunca sincronizou)
export function useHasDailyMetrics() {
  return useQuery({
    queryKey: ['ad-campaign-daily-metrics-exists'],
    queryFn: async () => {
      const { data } = await (supabase
        .from('ad_campaign_daily_metrics' as any) as any)
        .select('id')
        .limit(1);
      return !!(data && data.length > 0);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Agregar métricas diárias por período
export function aggregateDailyMetrics(rows: AdCampaignDailyMetric[]) {
  return {
    total_spend: rows.reduce((sum, r) => sum + (Number(r.spend) || 0), 0),
    total_impressions: rows.reduce((sum, r) => sum + (Number(r.impressions) || 0), 0),
    total_clicks: rows.reduce((sum, r) => sum + (Number(r.clicks) || 0), 0),
    total_conversions: rows.reduce((sum, r) => sum + (Number(r.conversions) || 0), 0),
    total_conversion_value: rows.reduce((sum, r) => sum + (Number(r.conversion_value) || 0), 0),
    total_reach: rows.reduce((sum, r) => sum + (Number(r.reach) || 0), 0),
  };
}
