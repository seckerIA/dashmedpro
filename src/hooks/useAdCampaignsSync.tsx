import { useRef } from 'react';
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

// Track in-flight syncs to prevent duplicate calls from re-renders
const inFlightSyncIds = new Set<string>();

export function useSyncAdCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection_id: string) => {
      // Guard: skip if this connection is already being synced
      if (inFlightSyncIds.has(connection_id)) {
        console.warn(`[useSyncAdCampaigns] Skipping duplicate sync for ${connection_id}`);
        return { duplicate: true, skipped: true };
      }

      inFlightSyncIds.add(connection_id);
      try {
        // Ensure session is fresh before invoking edge function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }

        const { data, error } = await supabase.functions.invoke('sync-ad-campaigns', {
          body: { connection_id },
        });

        if (error) throw error;

        // Edge Function retorna 200 com success: false quando sync falha
        if (data && data.success === false) {
          throw new Error(data.error || 'Erro ao sincronizar campanhas');
        }

        return data;
      } finally {
        inFlightSyncIds.delete(connection_id);
      }
    },
    onSuccess: (_data) => {
      // Skip cache invalidation for duplicate/skipped calls
      if (_data?.skipped) return;
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
      // Nota: NÃO filtramos por synced_at — os dados representam o período
      // solicitado na última sync (last_90d). Cada campanha tem um único record
      // com métricas cumulativas do período. Filtrar por synced_at excluiria
      // campanhas válidas baseado em quando foram sincronizadas, não no período dos dados.

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
