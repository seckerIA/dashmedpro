import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  UtmTemplate, 
  UtmTemplateInsert, 
  UtmTemplateUpdate 
} from '@/types/adPlatforms';

// =====================================================
// QUERIES
// =====================================================

export function useUtmTemplates(activeOnly?: boolean) {
  return useQuery({
    queryKey: ['utm-templates', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('utm_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as UtmTemplate[];
    },
  });
}

export function useUtmTemplate(id: string) {
  return useQuery({
    queryKey: ['utm-template', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utm_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as UtmTemplate;
    },
    enabled: !!id,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateUtmTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: UtmTemplateInsert) => {
      const { data, error } = await supabase
        .from('utm_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data as UtmTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-templates'] });
    },
  });
}

export function useUpdateUtmTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: UtmTemplateUpdate 
    }) => {
      const { data, error } = await supabase
        .from('utm_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UtmTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['utm-templates'] });
      queryClient.invalidateQueries({ queryKey: ['utm-template', data.id] });
    },
  });
}

export function useDeleteUtmTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('utm_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-templates'] });
      queryClient.invalidateQueries({ queryKey: ['generated-utms'] });
    },
  });
}

