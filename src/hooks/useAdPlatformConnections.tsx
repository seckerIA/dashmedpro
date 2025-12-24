import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_platform_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdPlatformConnection[];
    },
  });
}

export function useAdPlatformConnection(id: string) {
  return useQuery({
    queryKey: ['ad-platform-connection', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_platform_connections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AdPlatformConnection;
    },
    enabled: !!id,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateAdPlatformConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: AdPlatformConnectionInsert) => {
      const { data, error } = await supabase
        .from('ad_platform_connections')
        .insert(connection)
        .select()
        .single();

      if (error) throw error;
      return data as AdPlatformConnection;
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
      const { data, error } = await supabase
        .from('ad_platform_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AdPlatformConnection;
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
      const { error } = await supabase
        .from('ad_platform_connections')
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
      // Chamar Edge Function para testar conexão
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

