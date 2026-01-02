/**
 * Hook: useFollowUpAlerts
 * Gerencia alertas e notificações de follow-up e leads quentes
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { useNavigate } from 'react-router-dom';
import type { HotLead, PendingFollowup, LeadStatus } from '@/types/whatsappAI';

interface UseFollowUpAlertsOptions {
  enableNotifications?: boolean;
  enableSound?: boolean;
  checkIntervalMs?: number;
}

export function useFollowUpAlerts(options: UseFollowUpAlertsOptions = {}) {
  const {
    enableNotifications = true,
    enableSound = false,
    checkIntervalMs = 60000, // 1 minuto
  } = options;

  const { user } = useAuth();
  const { isSecretaria } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Referências para tracking
  const previousHotLeadsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // =====================================================
  // Query: Hot Leads
  // =====================================================
  const hotLeadsQuery = useQuery({
    queryKey: ['hot-leads-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_hot_leads' as any, {
        p_user_id: user.id,
        p_limit: 10,
      });

      if (error) {
        // Ignorar erro 404 se a migração ainda não foi aplicada
        if ((error as any).code === 'PGRST202' || (error as any).message?.includes('404')) {
          return [];
        }
        console.error('[useFollowUpAlerts] Error fetching hot leads:', error);
        return [];
      }

      return (data as any) as HotLead[];
    },
    enabled: !!user,
    refetchInterval: checkIntervalMs,
    staleTime: 30000,
  });

  // =====================================================
  // Query: Pending Follow-ups
  // =====================================================
  const pendingFollowupsQuery = useQuery({
    queryKey: ['pending-followups-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_pending_followups' as any, {
        p_user_id: user.id,
        p_hours: 24,
      });

      if (error) {
        // Ignorar erro 404 se a migração ainda não foi aplicada
        if ((error as any).code === 'PGRST202' || (error as any).message?.includes('404')) {
          return [];
        }
        console.error('[useFollowUpAlerts] Error fetching followups:', error);
        return [];
      }

      return (data as any) as PendingFollowup[];
    },
    enabled: !!user,
    refetchInterval: checkIntervalMs,
    staleTime: 30000,
  });

  // =====================================================
  // Query: Contagem de conversas não lidas
  // =====================================================
  const unreadCountQuery = useQuery({
    queryKey: ['unread-count-alerts', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const targetUserIds = isSecretaria ? [user.id, ...(doctorIds || [])] : [user.id];

      const { data, error } = await supabase
        .from('whatsapp_conversations' as any)
        .select('unread_count')
        .in('user_id', targetUserIds)
        .gt('unread_count', 0);

      if (error || !data) {
        console.error('[useFollowUpAlerts] Error fetching unread count:', error);
        return 0;
      }

      const conversations = data as any[];
      return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    },
    enabled: !!user,
    refetchInterval: checkIntervalMs,
    staleTime: 15000,
  });

  // =====================================================
  // Detectar novos leads quentes
  // =====================================================
  useEffect(() => {
    if (!enableNotifications || !hotLeadsQuery.data) return;

    const currentHotLeads = new Set(hotLeadsQuery.data.map(l => l.conversation_id));
    const previousHotLeads = previousHotLeadsRef.current;

    // Encontrar novos leads quentes
    const newHotLeads = hotLeadsQuery.data.filter(
      lead => !previousHotLeads.has(lead.conversation_id)
    );

    // Mostrar toast para cada novo lead quente
    newHotLeads.forEach(lead => {
      toast({
        title: '🔥 Novo Lead Quente!',
        description: `${lead.contact_name || lead.phone_number} - ${lead.conversion_probability}% de chance`,
        action: (
          <button
            onClick={() => navigate(`/whatsapp?conversation=${lead.conversation_id}`)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Responder
          </button>
        ),
        duration: 10000, // 10 segundos
      });

      // Tocar som se habilitado
      if (enableSound) {
        playNotificationSound();
      }
    });

    // Atualizar referência
    previousHotLeadsRef.current = currentHotLeads;
  }, [hotLeadsQuery.data, enableNotifications, enableSound, toast, navigate]);

  // =====================================================
  // Tocar som de notificação
  // =====================================================
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        // Criar elemento de áudio (som simples)
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleX98hYuAe3Z7gH1+gYSAe3t7fX9/fn9/gYGBgYGAgYGAgH9/f4CAgICAgICAgH+AgICAgICA');
      }
      audioRef.current.play().catch(console.error);
    } catch (error) {
      console.error('[useFollowUpAlerts] Error playing sound:', error);
    }
  }, []);

  // =====================================================
  // Navegar para conversa
  // =====================================================
  const goToConversation = useCallback((conversationId: string) => {
    navigate(`/whatsapp?conversation=${conversationId}`);
  }, [navigate]);

  // =====================================================
  // Calcular métricas
  // =====================================================
  const hotLeadsCount = hotLeadsQuery.data?.length || 0;
  const pendingFollowupsCount = pendingFollowupsQuery.data?.length || 0;
  const unreadCount = unreadCountQuery.data || 0;

  // Total de alertas (para badge no menu)
  const totalAlerts = hotLeadsCount + pendingFollowupsCount;

  // =====================================================
  // Priorização de leads
  // =====================================================
  const sortedHotLeads = [...(hotLeadsQuery.data || [])].sort((a, b) => {
    // Ordenar por probabilidade (desc), depois por tempo desde última mensagem (asc)
    if (b.conversion_probability !== a.conversion_probability) {
      return b.conversion_probability - a.conversion_probability;
    }
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  const sortedPendingFollowups = [...(pendingFollowupsQuery.data || [])].sort((a, b) => {
    // Ordenar por tempo desde última mensagem (desc - mais antigo primeiro)
    return b.hours_since_last_message - a.hours_since_last_message;
  });

  // =====================================================
  // Subscriptions em tempo real
  // =====================================================
  useEffect(() => {
    if (!user) return;

    // Escutar mudanças na tabela de análise
    const analysisChannel = supabase
      .channel('analysis-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_conversation_analysis',
          // Removido filtro fixo para permitir que secretárias recebam eventos dos médicos vinculados via RLS
        },
        (payload) => {
          const newStatus = payload.new?.lead_status as LeadStatus;
          const oldStatus = payload.old?.lead_status as LeadStatus;

          // Notificar quando lead muda para quente
          if (newStatus === 'quente' && oldStatus !== 'quente') {
            queryClient.invalidateQueries({ queryKey: ['hot-leads-alerts'] });
          }

          // Notificar quando lead converte
          if (newStatus === 'convertido' && oldStatus !== 'convertido') {
            toast({
              title: '✅ Lead Convertido!',
              description: 'Um lead foi marcado como convertido.',
            });
          }
        }
      )
      .subscribe();

    // Escutar novas mensagens (para atualizar unread count)
    const messagesChannel = supabase
      .channel('messages-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          if (payload.new?.direction === 'inbound') {
            queryClient.invalidateQueries({ queryKey: ['unread-count-alerts'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analysisChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, queryClient, toast]);

  return {
    // Dados
    hotLeads: sortedHotLeads,
    pendingFollowups: sortedPendingFollowups,

    // Contagens
    hotLeadsCount,
    pendingFollowupsCount,
    unreadCount,
    totalAlerts,

    // Estados
    isLoading: hotLeadsQuery.isLoading || pendingFollowupsQuery.isLoading,
    isLoadingHotLeads: hotLeadsQuery.isLoading,
    isLoadingFollowups: pendingFollowupsQuery.isLoading,

    // Ações
    goToConversation,
    playNotificationSound,

    // Refetch
    refetch: () => {
      hotLeadsQuery.refetch();
      pendingFollowupsQuery.refetch();
      unreadCountQuery.refetch();
    },
  };
}

// =====================================================
// Hook simplificado para badge do menu
// =====================================================
export function useAlertsBadge() {
  const { totalAlerts, unreadCount, isLoading } = useFollowUpAlerts({
    enableNotifications: false, // Só contagem, sem toasts
  });

  return {
    count: totalAlerts + unreadCount,
    isLoading,
  };
}
