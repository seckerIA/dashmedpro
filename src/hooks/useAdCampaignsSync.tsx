import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import type {
  AdCampaignWithConnection
} from '@/types/adPlatforms';

// =====================================================
// QUERIES
// =====================================================

export function useAdCampaignsSync(filters?: {
  connection_id?: string;
  platform?: 'google_ads' | 'meta_ads';
  status?: string;
}) {
  return useQuery({
    queryKey: ['ad-campaigns-sync', filters],
    queryFn: async ({ signal }) => {
      let query = (supabase
        .from('ad_campaigns_sync' as any) as any)
        .select(`
          *,
          connection:ad_platform_connections(*)
        `)
        .order('synced_at', { ascending: false });

      if (filters?.connection_id) {
        query = query.eq('connection_id', filters.connection_id);
      }
      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdCampaignWithConnection[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAdCampaignSync(id: string) {
  return useQuery({
    queryKey: ['ad-campaign-sync', id],
    queryFn: async ({ signal }) => {
      const { data, error } = await (supabase
        .from('ad_campaigns_sync' as any) as any)
        .select(`
          *,
          connection:ad_platform_connections(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AdCampaignWithConnection;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

// =====================================================
// SYNC OPERATIONS
// =====================================================

export function useSyncAdCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection_id: string) => {
      const { data, error } = await supabase.functions.invoke('sync-ad-campaigns', {
        body: { connection_id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
    },
  });
}

// =====================================================
// CAMPAIGN MANAGEMENT
// =====================================================

export function usePauseAdCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-ad-campaign', {
        body: {
          campaign_id,
          action: 'pause',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns-sync'] });
    },
  });
}

export function useActivateAdCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-ad-campaign', {
        body: {
          campaign_id,
          action: 'activate',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns-sync'] });
    },
  });
}

// =====================================================
// METRICS
// =====================================================

export function useAdCampaignMetrics(filters?: {
  connection_id?: string;
  platform?: 'google_ads' | 'meta_ads';
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['ad-campaign-metrics', filters],
    queryFn: async ({ signal }) => {
      let query = (supabase
        .from('ad_campaigns_sync' as any) as any)
        .select('spend, impressions, clicks, ctr, conversions, conversion_value, cpa, roas');

      if (filters?.connection_id) {
        query = query.eq('connection_id', filters.connection_id);
      }
      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters?.start_date) {
        query = query.gte('synced_at', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('synced_at', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular métricas agregadas
      const metrics = {
        total_spend: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_conversion_value: 0,
        average_ctr: 0,
        average_cpa: 0,
        average_roas: 0,
      };

      if (data && data.length > 0) {
        const ctrs: number[] = [];
        const cpas: number[] = [];
        const roases: number[] = [];

        data.forEach((campaign) => {
          metrics.total_spend += Number(campaign.spend) || 0;
          metrics.total_impressions += Number(campaign.impressions) || 0;
          metrics.total_clicks += Number(campaign.clicks) || 0;
          metrics.total_conversions += Number(campaign.conversions) || 0;
          metrics.total_conversion_value += Number(campaign.conversion_value) || 0;

          if (campaign.ctr) ctrs.push(Number(campaign.ctr));
          if (campaign.cpa) cpas.push(Number(campaign.cpa));
          if (campaign.roas) roases.push(Number(campaign.roas));
        });

        metrics.average_ctr = ctrs.length > 0
          ? ctrs.reduce((a, b) => a + b, 0) / ctrs.length
          : 0;
        metrics.average_cpa = cpas.length > 0
          ? cpas.reduce((a, b) => a + b, 0) / cpas.length
          : 0;
        metrics.average_roas = roases.length > 0
          ? roases.reduce((a, b) => a + b, 0) / roases.length
          : 0;
      }

      return metrics;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}
