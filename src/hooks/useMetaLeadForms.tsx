import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MetaLeadForm {
  id: string;
  user_id: string;
  meta_form_id: string;
  form_name: string;
  page_id: string;
  page_name: string | null;
  status: string;
  leads_count: number;
  questions: Array<{ key: string; label: string; type: string }>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadFormSubmission {
  id: string;
  leadgen_id: string;
  form_id: string;
  form_name: string | null;
  page_id: string;
  ad_id: string | null;
  ad_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  field_data: any;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  is_processed: boolean;
  processed_at: string | null;
  crm_contact_id: string | null;
  crm_deal_id: string | null;
  created_at: string;
}

export function useMetaLeadForms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Auto-hide success badge after 5 seconds
  useEffect(() => {
    if (!syncSuccess) return;
    const timer = setTimeout(() => setSyncSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [syncSuccess]);

  // Query: buscar todos os formulários do usuário
  // A filtragem por BM é feita no componente LeadFormsList via seletor dropdown
  const formsQuery = useQuery({
    queryKey: ['meta-lead-forms', user?.id],
    queryFn: async (): Promise<MetaLeadForm[]> => {
      const { data, error } = await (supabase.from('meta_lead_forms' as any) as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('page_name', { ascending: true })
        .order('form_name', { ascending: true });

      if (error) throw error;
      return (data || []) as MetaLeadForm[];
    },
    enabled: !!user,
  });

  // Mutation: sincronizar formulários via Edge Function
  const syncFormsMutation = useMutation({
    mutationFn: async (pageIds?: string[]) => {
      const { data, error } = await supabase.functions.invoke('sync-lead-forms', {
        body: pageIds ? { page_ids: pageIds } : {},
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao sincronizar formulários');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meta-lead-forms'] });
      queryClient.invalidateQueries({ queryKey: ['lead-form-submissions'] });
      const formCount = data.forms_synced ?? 0;
      const leadCount = data.leads_synced ?? 0;
      const parts = [`${formCount} formulário(s)`];
      if (leadCount > 0) parts.push(`${leadCount} lead(s) sincronizado(s)`);
      if (data.errors?.length) parts.push(`${data.errors.length} erro(s)`);
      setSyncSuccess(formCount > 0 || leadCount > 0);
      toast({
        title: 'Sincronização concluída',
        description: parts.join(' · '),
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao sincronizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    forms: formsQuery.data || [],
    isLoading: formsQuery.isLoading,
    syncForms: syncFormsMutation.mutate,
    isSyncing: syncFormsMutation.isPending,
    syncSuccess,
  };
}

export function useLeadFormSubmissions(formId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-form-submissions', formId, user?.id],
    queryFn: async (): Promise<LeadFormSubmission[]> => {
      const { data, error } = await (supabase.from('lead_form_submissions' as any) as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('form_id', formId!)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as LeadFormSubmission[];
    },
    enabled: !!user && !!formId,
  });
}
