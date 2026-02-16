import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LeadScoreFactor, LeadScoreHistory } from '@/types/leadScoring';
import { CommercialLead } from '@/types/commercial';
import { fromTable } from '@/lib/supabaseFrom';

export function useLeadScoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: factors, isLoading: isLoadingFactors } = useQuery({
    queryKey: ['lead-scoring-factors', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await fromTable('lead_scoring_factors')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('factor_name');
      if (error) throw error;
      return (data || []) as LeadScoreFactor[];
    },
    enabled: !!user,
  });

  const calculateScore = useMutation({
    mutationFn: async (leadId: string) => {
      if (!user) throw new Error('User not authenticated');
      const session = await supabase.auth.getSession();
      const supabaseUrl = (await import('@/integrations/supabase/client')).SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/calculate-lead-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ lead_id: leadId, user_id: user.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate score');
      }
      return await response.json();
    },
    onSuccess: (data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-score-history', leadId] });
    },
  });

  const updateScoreWeights = useMutation({
    mutationFn: async (updates: Array<{ id: string; weight: number; enabled?: boolean }>) => {
      if (!user) throw new Error('User not authenticated');
      const promises = updates.map((update) =>
        fromTable('lead_scoring_factors')
          .update({
            weight: update.weight,
            enabled: update.enabled !== undefined ? update.enabled : true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id)
          .eq('user_id', user.id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r: any) => r.error);
      if (errors.length > 0) throw new Error('Failed to update some factors');
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-factors', user?.id] });
    },
  });

  const upsertScoreFactor = useMutation({
    mutationFn: async (factor: Partial<LeadScoreFactor> & { factor_name: string; weight: number }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await fromTable('lead_scoring_factors')
        .upsert({
          user_id: user.id,
          factor_name: factor.factor_name,
          weight: factor.weight,
          enabled: factor.enabled !== undefined ? factor.enabled : true,
          config: factor.config || {},
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,factor_name' })
        .select()
        .single();
      if (error) throw error;
      return data as LeadScoreFactor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-factors', user?.id] });
    },
  });

  const recalculateAllScores = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data: leads, error } = await supabase
        .from('commercial_leads')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['new', 'contacted', 'qualified']);
      if (error) throw error;
      if (!leads || leads.length === 0) return { processed: 0 };
      const batchSize = 10;
      let processed = 0;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        const promises = batch.map((lead) => calculateScore.mutateAsync(lead.id));
        await Promise.allSettled(promises);
        processed += batch.length;
      }
      return { processed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-leads'] });
    },
  });

  return {
    factors,
    isLoadingFactors,
    calculateScore: {
      mutate: (leadId: string) => calculateScore.mutate(leadId),
      mutateAsync: (leadId: string) => calculateScore.mutateAsync(leadId),
      isPending: calculateScore.isPending,
      error: calculateScore.error,
    },
    getScoreHistory: (leadId: string) => {
      return queryClient.fetchQuery({
        queryKey: ['lead-score-history', leadId],
        queryFn: async () => {
          const { data, error } = await fromTable('lead_score_history')
            .select('*')
            .eq('lead_id', leadId)
            .order('calculated_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          return (data || []) as LeadScoreHistory[];
        },
      });
    },
    updateScoreWeights: {
      mutate: (updates: Array<{ id: string; weight: number; enabled?: boolean }>) => updateScoreWeights.mutate(updates),
      mutateAsync: (updates: Array<{ id: string; weight: number; enabled?: boolean }>) => updateScoreWeights.mutateAsync(updates),
      isPending: updateScoreWeights.isPending,
      error: updateScoreWeights.error,
    },
    upsertScoreFactor: {
      mutate: (factor: Partial<LeadScoreFactor> & { factor_name: string; weight: number }) => upsertScoreFactor.mutate(factor),
      mutateAsync: (factor: Partial<LeadScoreFactor> & { factor_name: string; weight: number }) => upsertScoreFactor.mutateAsync(factor),
      isPending: upsertScoreFactor.isPending,
      error: upsertScoreFactor.error,
    },
    recalculateAllScores: {
      mutate: () => recalculateAllScores.mutate(),
      mutateAsync: () => recalculateAllScores.mutateAsync(),
      isPending: recalculateAllScores.isPending,
      error: recalculateAllScores.error,
    },
  };
}
