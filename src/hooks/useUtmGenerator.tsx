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
    queryKey: ['generated-utms', filters],
    queryFn: async () => {
      let query = supabase
        .from('generated_utms')
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
      return data as GeneratedUtm[];
    },
  });
}

export function useGeneratedUtm(id: string) {
  return useQuery({
    queryKey: ['generated-utm', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_utms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as GeneratedUtm;
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
      // Gerar URL com UTMs
      const full_url = buildUtmUrl(params);

      // Salvar no banco
      const utmData: GeneratedUtmInsert = {
        user_id,
        template_id: template_id || null,
        ad_campaign_sync_id: ad_campaign_sync_id || null,
        full_url,
        clicks: 0,
        conversions: 0,
      };

      const { data, error } = await supabase
        .from('generated_utms')
        .insert(utmData)
        .select()
        .single();

      if (error) throw error;
      return data as GeneratedUtm;
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
      // Buscar UTM atual
      const { data: currentUtm, error: fetchError } = await supabase
        .from('generated_utms')
        .select('clicks')
        .eq('id', utm_id)
        .single();

      if (fetchError) throw fetchError;

      // Incrementar cliques
      const { data, error } = await supabase
        .from('generated_utms')
        .update({ 
          clicks: (currentUtm?.clicks || 0) + 1 
        })
        .eq('id', utm_id)
        .select()
        .single();

      if (error) throw error;
      return data as GeneratedUtm;
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
      // Buscar UTM atual
      const { data: currentUtm, error: fetchError } = await supabase
        .from('generated_utms')
        .select('conversions')
        .eq('id', utm_id)
        .single();

      if (fetchError) throw fetchError;

      // Incrementar conversões
      const { data, error } = await supabase
        .from('generated_utms')
        .update({ 
          conversions: (currentUtm?.conversions || 0) + 1 
        })
        .eq('id', utm_id)
        .select()
        .single();

      if (error) throw error;
      return data as GeneratedUtm;
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
      const { data, error } = await supabase
        .from('generated_utms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GeneratedUtm;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
      queryClient.invalidateQueries({ queryKey: ['generated-utm', data.id] });
    },
  });
}

export function useDeleteGeneratedUtm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generated_utms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}


