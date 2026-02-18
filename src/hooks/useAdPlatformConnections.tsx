import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import type {
  AdPlatformConnection,
  AdPlatformConnectionInsert,
  AdPlatformConnectionUpdate
} from '@/types/adPlatforms';

// =====================================================
// QUERIES
// =====================================================

export function useAdPlatformConnections() {
  return useQuery({
    queryKey: ['ad-platform-connections'],
    queryFn: async ({ signal }) => {
      const query = (supabase
        .from('ad_platform_connections' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as AdPlatformConnection[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAdPlatformConnection(id: string) {
  return useQuery({
    queryKey: ['ad-platform-connection', id],
    queryFn: async ({ signal }) => {
      const { data, error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as AdPlatformConnection;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateAdPlatformConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: AdPlatformConnectionInsert) => {
      const { data, error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .insert(connection)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as AdPlatformConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
    },
  });
}

export function useUpdateAdPlatformConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: AdPlatformConnectionUpdate
    }) => {
      const { error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connection', data.id] });
    },
  });
}

export function useDeleteAdPlatformConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns-sync'] });
    },
  });
}

// =====================================================
// TEST CONNECTION
// =====================================================

export function useTestAdPlatformConnection() {
  return useMutation({
    mutationFn: async ({
      platform,
      api_key,
      account_id
    }: {
      platform: 'google_ads' | 'meta_ads';
      api_key: string;
      account_id: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('test-ad-connection', {
        body: {
          platform,
          api_key,
          account_id,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}
