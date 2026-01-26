/**
 * Hook for AI Insights functionality
 * Uses OpenAI API key from environment (same as whatsapp-ai-analyze)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { AIInsight, AIInsightsResponse } from '@/types/aiInsights';
import { useToast } from './use-toast';

export function useAIInsights() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch existing insights
    const insightsQuery = useQuery({
        queryKey: ['ai-insights', user?.id],
        queryFn: async ({ signal }): Promise<AIInsight[]> => {
            if (!user) return [];
            if (signal?.aborted) return [];

            const { data, error } = await supabase
                .from('crm_ai_insights' as any)
                .select('*')
                .eq('user_id', user.id)
                .gt('expires_at', new Date().toISOString())
                .abortSignal(signal)
                .order('impact', { ascending: true })
                .order('generated_at', { ascending: false });

            if (error) {
                console.error('Error fetching insights:', error);
                return [];
            }

            return (data || []) as AIInsight[];
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
    });

    // Get last analysis time
    const lastAnalysisQuery = useQuery({
        queryKey: ['ai-last-analysis', user?.id],
        queryFn: async ({ signal }): Promise<string | null> => {
            if (!user) return null;
            if (signal?.aborted) return null;

            const { data } = await supabase
                .from('crm_ai_analysis_batches' as any)
                .select('created_at')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .abortSignal(signal)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            return data?.created_at || null;
        },
        enabled: !!user,
        refetchOnMount: false,
    });

    // Run AI analysis
    const runAnalysis = useMutation({
        mutationFn: async (): Promise<AIInsightsResponse> => {
            if (!user) throw new Error('User not authenticated');

            const session = await supabase.auth.getSession();
            const response = await fetch(`${SUPABASE_URL}/functions/v1/crm-ai-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erro ao executar análise');
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ai-insights', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['ai-last-analysis', user?.id] });

            if (data.cached) {
                toast({
                    title: 'Insights carregados',
                    description: `${data.insights.length} insights encontrados. Nova análise disponível em 24h.`,
                });
            } else {
                toast({
                    title: 'Análise concluída! 🎉',
                    description: `${data.insights.length} insights gerados em ${((data.processing_time_ms || 0) / 1000).toFixed(1)}s`,
                });
            }
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erro na análise',
                description: error.message || 'Não foi possível executar a análise de IA.',
            });
        },
    });

    // Mark insight as applied
    const markAsApplied = useMutation({
        mutationFn: async (insightId: string) => {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('crm_ai_insights' as any)
                .update({
                    is_applied: true,
                    applied_at: new Date().toISOString(),
                })
                .eq('id', insightId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-insights', user?.id] });
            toast({
                title: '✓ Insight aplicado',
                description: 'O insight foi marcado como aplicado.',
            });
        },
    });

    // Dismiss insight (mark as not actionable)
    const dismissInsight = useMutation({
        mutationFn: async (insightId: string) => {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('crm_ai_insights' as any)
                .update({ is_actionable: false })
                .eq('id', insightId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-insights', user?.id] });
        },
    });

    const insights = insightsQuery.data || [];

    return {
        // Insights
        insights,
        isInsightsLoading: insightsQuery.isLoading,

        // Analysis
        runAnalysis,
        isAnalyzing: runAnalysis.isPending,
        lastAnalysisTime: lastAnalysisQuery.data,

        // Actions
        markAsApplied,
        dismissInsight,

        // Stats
        insightsByCategory: insights.reduce((acc, insight) => {
            if (insight.is_actionable) {
                acc[insight.category] = (acc[insight.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>),
        highImpactCount: insights.filter(i => i.impact === 'high' && i.is_actionable).length,
    };
}
