import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  GeneratedUtm, 
  GeneratedUtmInsert, 
  GeneratedUtmUpdate,
  UtmGenerationParams 
} from '@/types/adPlatforms';
import { buildUtmUrl } from '@/lib/adPlatforms/utmBuilder';

// =====================================================
// QUERIES
// =====================================================

export function useGeneratedUtms(filters?: {
  template_id?: string;
  ad_campaign_sync_id?: string;
}) {
  return useQuery({
    queryKey: ['generated-utms', filters?.template_id, filters?.ad_campaign_sync_id],
    queryFn: async () => {
      let query = (supabase
        .from('generated_utms' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.template_id) {
        query = query.eq('template_id', filters.template_id);
      }
      if (filters?.ad_campaign_sync_id) {
        query = query.eq('ad_campaign_sync_id', filters.ad_campaign_sync_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as GeneratedUtm[];
    },
  });
}

export function useGeneratedUtm(id: string) {
  return useQuery({
    queryKey: ['generated-utm', id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('generated_utms' as any) as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as GeneratedUtm;
    },
    enabled: !!id,
  });
}

// =====================================================
// UTM GENERATION
// =====================================================

export function useGenerateUtm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      template_id,
      ad_campaign_sync_id,
      user_id,
    }: {
      params: UtmGenerationParams;
      template_id?: string;
      ad_campaign_sync_id?: string;
      user_id: string;
    }) => {
      const full_url = buildUtmUrl(params);

      const utmData: any = {
        user_id,
        template_id: template_id || null,
        ad_campaign_sync_id: ad_campaign_sync_id || null,
        full_url,
        clicks: 0,
        conversions: 0,
      };

      const { data, error } = await (supabase
        .from('generated_utms' as any) as any)
        .insert(utmData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as GeneratedUtm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}

// =====================================================
// UTM TRACKING
// =====================================================

export function useTrackUtmClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utm_id: string) => {
      const { data: currentUtm, error: fetchError } = await (supabase
        .from('generated_utms' as any) as any)
        .select('clicks')
        .eq('id', utm_id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await (supabase
        .from('generated_utms' as any) as any)
        .update({ 
          clicks: ((currentUtm as any)?.clicks || 0) + 1 
        })
        .eq('id', utm_id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as GeneratedUtm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}

export function useTrackUtmConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (utm_id: string) => {
      const { data: currentUtm, error: fetchError } = await (supabase
        .from('generated_utms' as any) as any)
        .select('conversions')
        .eq('id', utm_id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await (supabase
        .from('generated_utms' as any) as any)
        .update({ 
          conversions: ((currentUtm as any)?.conversions || 0) + 1 
        })
        .eq('id', utm_id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as GeneratedUtm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}

// =====================================================
// UPDATE UTM
// =====================================================

export function useUpdateGeneratedUtm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: GeneratedUtmUpdate 
    }) => {
      const { data, error } = await (supabase
        .from('generated_utms' as any) as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as GeneratedUtm;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
      queryClient.invalidateQueries({ queryKey: ['generated-utm', data.id] });
    },
  });
}

export function useDeleteGeneratedUtm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('generated_utms' as any) as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}
