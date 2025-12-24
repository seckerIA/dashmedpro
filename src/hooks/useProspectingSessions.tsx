import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';
import { ProspectingSessionInsert, SessionResult } from '@/types/prospecting';
import { useToast } from './use-toast';

export function useProspectingSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar sessões do dia atual
  const { data: todaySessions = [], isLoading } = useQuery({
    queryKey: ['prospecting-sessions-today', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];

      // Verificar e garantir sessão válida
      await ensureValidSession();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const queryPromise = supabase
        .from('prospecting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('ended_at', todayISO)
        .order('ended_at', { ascending: false });

      const { data, error } = await supabaseQueryWithTimeout(queryPromise, 30000, signal);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch a cada 1 minuto
    retry: 2,
    retryDelay: 1000,
  });

  // Registrar nova sessão
  const createSession = useMutation({
    mutationFn: async (sessionData: {
      scriptId?: string;
      result: SessionResult;
      contactId?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('prospecting_sessions')
        .insert({
          user_id: user.id,
          script_id: sessionData.scriptId || null,
          result: sessionData.result,
          contact_id: sessionData.contactId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-sessions-today', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['daily-report-today', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar atendimento',
        description: error.message,
      });
    },
  });

  // Estatísticas do dia
  const todayStats = {
    total: todaySessions.length,
    atendimentosEncerrados: todaySessions.filter(s => s.result === 'atendimento_encerrado').length,
    contatosDecisores: todaySessions.filter(s => s.result === 'contato_decisor').length,
  };

  return {
    todaySessions,
    todayStats,
    isLoading,
    createSession: createSession.mutateAsync,
    isCreating: createSession.isPending,
  };
}





