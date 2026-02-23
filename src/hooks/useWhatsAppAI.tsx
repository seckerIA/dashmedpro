/**
 * Hook: useWhatsAppAI
 * Gerencia análise de IA para conversas do WhatsApp
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type {
  ConversationAnalysis,
  AISuggestion,
  LeadStatus,
  HotLead,
  PendingFollowup,
  AIStats,
  AnalyzeConversationResponse,
  AIConfig,
} from '@/types/whatsappAI';

interface UseWhatsAppAIOptions {
  conversationId?: string;
  autoAnalyze?: boolean;
  targetUserId?: string; // Opcional: ID explícito do dono
}

export function useWhatsAppAI(options: UseWhatsAppAIOptions = {}) {
  const { conversationId, autoAnalyze = false, targetUserId } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar o user_id dono da conversa, se conversationId for fornecido
  const { data: conversationData } = useQuery({
    queryKey: ['conversation-owner', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single();
      return data;
    },
    enabled: !!conversationId,
  });

  // Determinar quem é o dono da config
  const configOwnerId = targetUserId || conversationData?.user_id || user?.id;

  // =====================================================
  // Realtime Subscriptions
  // =====================================================

  useEffect(() => {
    if (!conversationId) return;

    console.log('[useWhatsAppAI] Subscribing to AI updates for:', conversationId);

    const channel = supabase
      .channel(`ai-analysis-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversation_analysis',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[useWhatsAppAI] Analysis updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['whatsapp-analysis', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['hot-leads'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_ai_suggestions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);



  // =====================================================
  // Query: Análise da conversa atual
  // =====================================================
  const analysisQuery = useQuery({
    queryKey: ['whatsapp-analysis', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('whatsapp_conversation_analysis')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) {
        console.error('[useWhatsAppAI] Error fetching analysis:', error);
        return null;
      }

      return data as ConversationAnalysis | null;
    },
    enabled: !!conversationId,
    staleTime: 30000, // 30 segundos
  });

  // =====================================================
  // Query: Sugestões ativas da conversa
  // =====================================================
  const suggestionsQuery = useQuery({
    queryKey: ['whatsapp-suggestions', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('whatsapp_ai_suggestions')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('was_used', false)
        .order('display_order', { ascending: true })
        .limit(3);

      if (error) {
        console.error('[useWhatsAppAI] Error fetching suggestions:', error);
        return [];
      }

      return (data || []) as AISuggestion[];
    },
    enabled: !!conversationId,
    staleTime: 30000,
  });

  // =====================================================
  // Mutation: Analisar conversa (chama Edge Function)
  // =====================================================
  const analyzeMutation = useMutation({
    mutationFn: async (forceReanalyze: boolean = false): Promise<AnalyzeConversationResponse> => {
      if (!conversationId) throw new Error('No conversation selected');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) throw new Error('Not authenticated');

      const { data, error: functionError } = await supabase.functions.invoke('whatsapp-ai-analyze', {
        body: {
          conversation_id: conversationId,
          force_reanalyze: forceReanalyze,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to analyze conversation');
      }

      const result = data;

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze conversation');
      }

      return result as AnalyzeConversationResponse;
    },
    onSuccess: (data) => {
      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['whatsapp-analysis', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });

      // Mostrar toast se lead ficou quente
      if (data.analysis.lead_status === 'quente') {
        toast({
          title: '🔥 Lead Quente!',
          description: `Probabilidade de conversão: ${data.analysis.conversion_probability}%`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('[useWhatsAppAI] Analysis error:', error);
      toast({
        title: 'Erro na análise',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Mutation: Atualizar status do lead manualmente
  // =====================================================
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, triggerPipeline = true }: { status: LeadStatus; triggerPipeline?: boolean }) => {
      if (!conversationId || !user) throw new Error('Missing required data');

      // Verificar se análise existe
      const { data: existingAnalysis } = await supabase
        .from('whatsapp_conversation_analysis')
        .select('id')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (existingAnalysis) {
        // Atualizar existente
        const { error } = await supabase
          .from('whatsapp_conversation_analysis')
          .update({
            lead_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAnalysis.id);

        if (error) throw error;
      } else {
        // Criar nova análise
        const { error } = await supabase
          .from('whatsapp_conversation_analysis')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            lead_status: status,
          });

        if (error) throw error;
      }

      return { status, triggerPipeline };
    },
    onSuccess: ({ status }) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-analysis', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });

      toast({
        title: 'Status atualizado',
        description: `Lead marcado como "${status}"`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Mutation: Marcar sugestão como usada
  // =====================================================
  const markSuggestionUsedMutation = useMutation({
    mutationFn: async ({ suggestionId, wasModified = false }: { suggestionId: string; wasModified?: boolean }) => {
      const { error } = await supabase
        .from('whatsapp_ai_suggestions')
        .update({
          was_used: true,
          was_modified: wasModified,
          used_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-suggestions', conversationId] });
    },
  });

  // =====================================================
  // Query: Hot Leads (para dashboard)
  // =====================================================
  const hotLeadsQuery = useQuery({
    queryKey: ['hot-leads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_hot_leads', {
        p_user_id: user.id,
        p_limit: 5,
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('404')) return [];
        console.error('[useWhatsAppAI] Error fetching hot leads:', error);
        return [];
      }

      return data as HotLead[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minuto
  });

  // =====================================================
  // Query: Pending Follow-ups
  // =====================================================
  const pendingFollowupsQuery = useQuery({
    queryKey: ['pending-followups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_pending_followups', {
        p_user_id: user.id,
        p_hours: 24,
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('404')) return [];
        console.error('[useWhatsAppAI] Error fetching pending followups:', error);
        return [];
      }

      return data as PendingFollowup[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // =====================================================
  // Query: AI Stats
  // =====================================================
  const aiStatsQuery = useQuery({
    queryKey: ['ai-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_ai_stats', {
        p_user_id: user.id,
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('404')) return null;
        console.error('[useWhatsAppAI] Error fetching AI stats:', error);
        return null;
      }

      return data?.[0] as AIStats | null;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutos
  });

  // =====================================================
  // Query: Configuração de IA (do Dono)
  // =====================================================
  const aiConfigQuery = useQuery({
    queryKey: ['whatsapp-ai-config', configOwnerId],
    queryFn: async () => {
      if (!configOwnerId) {
        return null;
      }

      const { data, error } = await supabase
        .from('whatsapp_ai_config')
        .select('*')
        .eq('user_id', configOwnerId)
        .maybeSingle();

      if (error) {
        console.error('[useWhatsAppAI] Error fetching config:', error);
        return null;
      }


      return data as AIConfig | null;
    },
    enabled: !!configOwnerId,
  });

  // =====================================================
  // Mutation: Atualizar configuração de IA
  // =====================================================
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<AIConfig>) => {
      if (!user || !configOwnerId) throw new Error('Not authenticated or missing config owner');

      const { data: existing } = await supabase
        .from('whatsapp_ai_config')
        .select('id')
        .eq('user_id', configOwnerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('whatsapp_ai_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_ai_config')
          .insert({
            ...updates,
            user_id: configOwnerId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-ai-config', configOwnerId] });
      toast({
        title: 'Configuração salva',
        description: 'As preferências da IA foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Helpers
  // =====================================================
  const analyzeConversation = async (forceReanalyze: boolean = false) => {
    return analyzeMutation.mutateAsync(forceReanalyze);
  };

  const updateLeadStatus = async (status: LeadStatus, triggerPipeline = true) => {
    return updateStatusMutation.mutateAsync({ status, triggerPipeline });
  };

  const markSuggestionUsed = async (suggestionId: string, wasModified = false) => {
    return markSuggestionUsedMutation.mutateAsync({ suggestionId, wasModified });
  };

  const getSuggestionByIndex = (index: number): AISuggestion | null => {
    const suggestions = suggestionsQuery.data;
    if (!suggestions || index < 0 || index >= suggestions.length) return null;
    return suggestions[index];
  };

  return {
    // Dados da conversa atual
    analysis: analysisQuery.data,
    suggestions: suggestionsQuery.data || [],
    isLoadingAnalysis: analysisQuery.isLoading,
    isLoadingSuggestions: suggestionsQuery.isLoading,

    // Estado de mutações
    isAnalyzing: analyzeMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,

    // Ações
    analyzeConversation,
    updateLeadStatus,
    markSuggestionUsed,
    getSuggestionByIndex,

    // Dados globais (dashboard)
    hotLeads: hotLeadsQuery.data || [],
    pendingFollowups: pendingFollowupsQuery.data || [],
    aiStats: aiStatsQuery.data,
    isLoadingHotLeads: hotLeadsQuery.isLoading,
    isLoadingFollowups: pendingFollowupsQuery.isLoading,

    // Configuração
    aiConfig: aiConfigQuery.data,
    updateAIConfig: updateConfigMutation.mutateAsync,
    isUpdatingConfig: updateConfigMutation.isPending,
    isLoadingConfig: aiConfigQuery.isLoading,

    // Refetch
    refetchAnalysis: analysisQuery.refetch,
    refetchSuggestions: suggestionsQuery.refetch,
    refetchHotLeads: hotLeadsQuery.refetch,
    refetchFollowups: pendingFollowupsQuery.refetch,
    refetchConfig: aiConfigQuery.refetch,
  };
}

// =====================================================
// Hook específico para dashboard (sem conversation_id)
// =====================================================
export function useWhatsAppAIDashboard() {
  return useWhatsAppAI({});
}

// =====================================================
// Hook com auto-análise ao receber mensagem
// =====================================================
export function useWhatsAppAIWithAutoAnalyze(conversationId: string | undefined) {
  const ai = useWhatsAppAI({ conversationId });

  // Auto-analisar quando conversa muda e não tem análise recente
  // (implementação do trigger real-time será feita no ChatWindow)

  return ai;
}
