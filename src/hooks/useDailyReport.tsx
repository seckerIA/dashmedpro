import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DailyReportInsert, DailyMetrics } from '@/types/prospecting';
import { useToast } from './use-toast';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useProspectingSessions } from './useProspectingSessions';
import { useMemo, useEffect } from 'react';

export function useDailyReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { todayStats } = useProspectingSessions();

  // Hook para detectar mudança de dia e limpar dados antigos
  useEffect(() => {
    if (!user?.id) return;

    const checkAndCleanOldData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Verificar se há sessões de dias anteriores que precisam ser limpas
      const { data: oldSessions, error: sessionsError } = await supabase
        .from('prospecting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .lt('ended_at', today.toISOString());

      if (sessionsError) {
        console.error('Erro ao verificar sessões antigas:', sessionsError);
        return;
      }

      // Se há sessões antigas, limpar elas
      if (oldSessions && oldSessions.length > 0) {
        console.log(`Limpando ${oldSessions.length} sessões antigas`);
        const { error: deleteError } = await supabase
          .from('prospecting_sessions')
          .delete()
          .eq('user_id', user.id)
          .lt('ended_at', today.toISOString());

        if (deleteError) {
          console.error('Erro ao limpar sessões antigas:', deleteError);
        } else {
          // Invalidar cache para atualizar a interface
          queryClient.invalidateQueries({ queryKey: ['prospecting-sessions-today', user.id] });
        }
      }
    };

    // Executar limpeza na montagem do componente
    checkAndCleanOldData();

    // Configurar um timer para verificar a cada hora se mudou o dia
    const interval = setInterval(checkAndCleanOldData, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, [user?.id, queryClient]);

  // Buscar relatório do dia atual
  const { data: todayReport, isLoading } = useQuery({
    queryKey: ['daily-report-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];

      const reportQuery = supabase
        .from('prospecting_daily_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('report_date', todayISO)
        .maybeSingle();
      
      const reportResult = await supabaseQueryWithTimeout(reportQuery, 30000);
      const { data, error } = reportResult;

      if (error && error.code !== 'PGRST116') {
        console.error('useDailyReport - erro ao buscar:', error);
        throw error;
      }

      // Verificar se o relatório é de um dia anterior e marcar como expirado
      if (data && data.report_date !== todayISO) {
        console.log('Relatório de dia anterior encontrado, não retornando dados');
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Iniciar/atualizar relatório diário (sem restrições)
  const startReport = useMutation({
    mutationFn: async (data: { goalCalls: number; goalContacts: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const today = new Date().toISOString().split('T')[0];

      const upsertData: DailyReportInsert = {
        user_id: user.id,
        report_date: today,
        calls_made: 0,
        contacts_reached: 0,
        appointments_set: 0,
        deals_closed: 0,
        revenue: 0,
        notes: null,
        is_paused: false,
        paused_at: null,
        total_paused_time: 0,
      };

      // Usar upsert para permitir criar ou atualizar
      const { data: report, error } = await supabase
        .from('prospecting_daily_reports')
        .upsert(upsertData, {
          onConflict: 'user_id,report_date'
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: async (report) => {
      // Atualiza cache imediatamente com o relatório retornado
      queryClient.setQueryData(['daily-report-today', user?.id], report);
      // Invalidar e forçar refetch para refletir imediatamente no card
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['daily-report-today'] }),
        queryClient.invalidateQueries({ queryKey: ['prospecting-sessions-today', user?.id] }),
      ]);
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['daily-report-today'] });
        queryClient.refetchQueries({ queryKey: ['prospecting-sessions-today', user?.id] });
      }, 300);
      toast({
        title: 'Expediente iniciado!',
        description: 'Suas metas foram registradas. Boa sorte!',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar expediente',
        description: error.message,
      });
    },
  });

  // Finalizar relatório diário
  const finishReport = useMutation({
    mutationFn: async () => {
      if (!todayReport?.id) throw new Error('Nenhum relatório ativo encontrado');

      // Salvar contadores finais
      const finalCalls = todayStats.total;
      const finalContacts = todayStats.contatosDecisores;

      const { data, error } = await supabase
        .from('prospecting_daily_reports')
        .update({
          calls_made: finalCalls,
          contacts_reached: finalContacts,
        })
        .eq('id', todayReport.id)
        .select()
        .single();

      if (error) throw error;

      // NOVA FUNCIONALIDADE: Limpar as sessões de prospecting do dia atual
      if (user?.id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const { error: deleteError } = await supabase
          .from('prospecting_sessions')
          .delete()
          .eq('user_id', user.id)
          .gte('ended_at', todayISO);

        if (deleteError) {
          console.error('Erro ao limpar sessões:', deleteError);
          // Não falha a operação principal se não conseguir limpar as sessões
        }
      }

      return data;
    },
    onSuccess: async () => {
      // Invalidar e refetch imediato para garantir que a UI seja atualizada
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['daily-report-today'] }),
        queryClient.invalidateQueries({ queryKey: ['prospecting-sessions-today', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['prospecting-sessions'] }),
      ]);
      
      // Aguardar um pouco para garantir que os dados foram atualizados
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['daily-report-today'] });
        queryClient.refetchQueries({ queryKey: ['prospecting-sessions-today', user?.id] });
        queryClient.refetchQueries({ queryKey: ['prospecting-sessions'] });
      }, 500);
      
      toast({
        title: 'Expediente finalizado!',
        description: 'Seu relatório foi salvo e os contadores foram resetados.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar expediente',
        description: error.message,
      });
    },
  });

  // Pausar relatório
  const pauseReport = useMutation({
    mutationFn: async () => {
      if (!todayReport?.id) throw new Error('Nenhum relatório ativo encontrado');

      const { data, error } = await supabase
        .from('prospecting_daily_reports')
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
        })
        .eq('id', todayReport.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-today'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao pausar',
        description: error.message,
      });
    },
  });

  // Retomar relatório
  const resumeReport = useMutation({
    mutationFn: async () => {
      if (!todayReport?.id) throw new Error('Nenhum relatório encontrado');

      // Calcular tempo pausado
      const pausedAt = todayReport.paused_at ? new Date(todayReport.paused_at) : new Date();
      const now = new Date();
      const pausedMs = now.getTime() - pausedAt.getTime();
      const pausedMinutes = Math.floor(pausedMs / 60000);
      const totalPausedTime = (todayReport.total_paused_time || 0) + pausedMinutes;

      const { data, error } = await supabase
        .from('prospecting_daily_reports')
        .update({
          is_paused: false,
          paused_at: null,
          total_paused_time: totalPausedTime,
        })
        .eq('id', todayReport.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-today'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao retomar',
        description: error.message,
      });
    },
  });

  // Atualizar metas do dia (atualiza user_daily_goals, não o relatório)
  const updateGoals = useMutation({
    mutationFn: async (data: { goalCalls: number; goalContacts: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Atualizar ou criar metas padrão do usuário
      const { data: updated, error } = await supabase
        .from('user_daily_goals')
        .upsert({
          user_id: user.id,
          default_goal_calls: data.goalCalls,
          default_goal_contacts: data.goalContacts,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-today'] });
      toast({
        title: 'Metas atualizadas!',
        description: 'Suas metas foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar metas',
        description: error.message,
      });
    },
  });

  // Calcular métricas em tempo real
  const todayMetrics = useMemo((): DailyMetrics | null => {
    if (!todayReport) return null;

    // Usar valores salvos do relatório
    const totalCalls = todayReport.calls_made || todayStats.total;
    const totalContacts = todayReport.contacts_reached || todayStats.contatosDecisores;
    // Nota: goal_calls e goal_contacts não existem na tabela, usar valores padrão ou do user_daily_goals
    const goalCalls = 50; // Valor padrão - pode ser buscado de user_daily_goals
    const goalContacts = 10; // Valor padrão - pode ser buscado de user_daily_goals

    // Calcular progresso (limitado a 100%)
    const callsProgress = Math.min((totalCalls / goalCalls) * 100, 100);
    const contactsProgress = Math.min((totalContacts / goalContacts) * 100, 100);

    // Calcular tempo decorrido (usar created_at como referência)
    const startTime = new Date(todayReport.created_at);
    const now = new Date();
    const elapsedMs = now.getTime() - startTime.getTime();
    
    // Subtrair tempo pausado
    const totalPausedMs = (todayReport.total_paused_time || 0) * 60000;
    
    // Se estiver pausado, adicionar tempo da pausa atual
    let currentPausedMs = 0;
    if (todayReport.is_paused && todayReport.paused_at) {
      const pausedAt = new Date(todayReport.paused_at);
      currentPausedMs = now.getTime() - pausedAt.getTime();
    }
    
    const effectiveElapsedMs = elapsedMs - totalPausedMs - currentPausedMs;
    const elapsedTimeMinutes = Math.max(0, Math.floor(effectiveElapsedMs / 60000));
    
    // Formatar tempo
    const hours = Math.floor(elapsedTimeMinutes / 60);
    const minutes = elapsedTimeMinutes % 60;
    const elapsedTimeFormatted = `${hours}h ${minutes}m`;

    return {
      totalCalls,
      totalContacts,
      goalCalls,
      goalContacts,
      callsProgress,
      contactsProgress,
      elapsedTimeMinutes,
      elapsedTimeFormatted,
      isActive: !todayReport.is_paused, // Ativo se não estiver pausado
      isPaused: todayReport.is_paused || false,
      reportId: todayReport.id,
    };
  }, [todayReport, todayStats]);

  // Helper para verificar se já existe relatório hoje
  const hasReportToday = !!todayReport;
  const isReportActive = todayReport ? !todayReport.is_paused : false;

  // Função para forçar limpeza de dados antigos
  const clearOldData = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Limpar sessões antigas
      const { error: sessionsError } = await supabase
        .from('prospecting_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('ended_at', today.toISOString());

      if (sessionsError) throw sessionsError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-sessions-today', user?.id] });
      toast({
        title: 'Dados antigos limpos!',
        description: 'Os dados de dias anteriores foram removidos.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao limpar dados antigos',
        description: error.message,
      });
    },
  });

  return {
    todayReport,
    todayMetrics,
    isLoading,
    hasReportToday,
    isReportActive,
    startReport: startReport.mutateAsync,
    finishReport: finishReport.mutateAsync,
    pauseReport: pauseReport.mutateAsync,
    resumeReport: resumeReport.mutateAsync,
    updateGoals: updateGoals.mutateAsync,
    clearOldData: clearOldData.mutateAsync,
    isStarting: startReport.isPending,
    isFinishing: finishReport.isPending,
    isPausing: pauseReport.isPending,
    isResuming: resumeReport.isPending,
    isUpdatingGoals: updateGoals.isPending,
    isClearingData: clearOldData.isPending,
  };
}
