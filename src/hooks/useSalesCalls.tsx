import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { ensureValidSession } from '@/utils/supabaseHelpers';
import {
  SalesCall,
  SalesCallWithRelations,
  SalesCallInsert,
  SalesCallUpdate,
  SalesCallStatus
} from '@/types/salesCalls';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { format, isBefore, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Fetch sales calls with relations
const fetchSalesCalls = async (
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: SalesCallStatus;
  },
  signal?: AbortSignal
): Promise<SalesCallWithRelations[]> => {
  // Verificar e garantir sessão válida
  await ensureValidSession();

  let query = supabase
    .from('sales_calls')
    .select(`
      *,
      contact:crm_contacts(*),
      deal:crm_deals(*)
    `)
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (filters?.startDate) {
    query = query.gte('scheduled_at', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('scheduled_at', filters.endDate.toISOString());
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await supabaseQueryWithTimeout(query, undefined, signal);

  if (error) throw new Error(`Erro ao buscar calls: ${error.message}`);
  return (data || []) as unknown as SalesCallWithRelations[];
};

// Fetch single call
const fetchSalesCall = async (callId: string): Promise<SalesCallWithRelations> => {
  const { data, error } = await supabase
    .from('sales_calls')
    .select(`
      *,
      contact:crm_contacts(*),
      deal:crm_deals(*)
    `)
    .eq('id', callId)
    .single();

  if (error) throw new Error(`Erro ao buscar call: ${error.message}`);
  return data as unknown as SalesCallWithRelations;
};

// Hook principal
export function useSalesCalls(filters?: {
  startDate?: Date;
  endDate?: Date;
  status?: SalesCallStatus;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();

  // Query para listar calls
  const { data: calls, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-calls', user?.id, filters],
    queryFn: ({ signal }) => fetchSalesCalls(user!.id, filters, signal),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Mutation para criar call
  const createCall = useMutation({
    mutationFn: async (callData: SalesCallInsert) => {
      const { data, error } = await supabase
        .from('sales_calls')
        .insert(callData)
        .select(`
          *,
          contact:crm_contacts(*),
          deal:crm_deals(*)
        `)
        .single();

      if (error) throw new Error(`Erro ao criar call: ${error.message}`);
      return data as unknown as SalesCallWithRelations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });

      // Criar notificação de confirmação
      if (user?.id && data.contact) {
        const scheduledDate = new Date(data.scheduled_at);
        const formattedDate = format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

        createNotification({
          user_id: user.id,
          type: 'call_scheduled',
          title: 'Call Agendada',
          message: `Call com ${data.contact.full_name} agendada para ${formattedDate}`,
          read: false,
        });
      }
    },
  });

  // Mutation para atualizar call
  const updateCall = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SalesCallUpdate }) => {
      const { data, error } = await supabase
        .from('sales_calls')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          contact:crm_contacts(*),
          deal:crm_deals(*)
        `)
        .single();

      if (error) throw new Error(`Erro ao atualizar call: ${error.message}`);
      return data as unknown as SalesCallWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
    },
  });

  // Mutation para deletar call
  const deleteCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_calls')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Erro ao deletar call: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
    },
  });

  // Mutation para marcar como completada
  const markAsCompleted = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('sales_calls')
        .update({
          status: 'completed' as SalesCallStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          contact:crm_contacts(*),
          deal:crm_deals(*)
        `)
        .single();

      if (error) throw new Error(`Erro ao marcar call como completada: ${error.message}`);
      return data as unknown as SalesCallWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
    },
  });

  // Mutation para marcar como cancelada
  const markAsCancelled = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('sales_calls')
        .update({ status: 'cancelled' as SalesCallStatus })
        .eq('id', id)
        .select(`
          *,
          contact:crm_contacts(*),
          deal:crm_deals(*)
        `)
        .single();

      if (error) throw new Error(`Erro ao cancelar call: ${error.message}`);
      return data as unknown as SalesCallWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
    },
  });

  // Mutation para marcar como no_show
  const markAsNoShow = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('sales_calls')
        .update({ status: 'no_show' as SalesCallStatus })
        .eq('id', id)
        .select(`
          *,
          contact:crm_contacts(*),
          deal:crm_deals(*)
        `)
        .single();

      if (error) throw new Error(`Erro ao marcar call como no_show: ${error.message}`);
      return data as unknown as SalesCallWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
    },
  });

  // Helper: Obter calls próximas (próximas 2 horas)
  const upcomingCalls = calls?.filter(call => {
    if (call.status !== 'scheduled') return false;
    const callDate = new Date(call.scheduled_at);
    const twoHoursFromNow = addMinutes(new Date(), 120);
    return isBefore(callDate, twoHoursFromNow) && isBefore(new Date(), callDate);
  }) || [];

  // Helper: Obter calls de hoje
  const todayCalls = calls?.filter(call => {
    const callDate = new Date(call.scheduled_at);
    const today = new Date();
    return callDate.toDateString() === today.toDateString();
  }) || [];

  return {
    calls: calls || [],
    upcomingCalls,
    todayCalls,
    isLoading,
    error,
    refetch,
    createCall,
    updateCall,
    deleteCall,
    markAsCompleted,
    markAsCancelled,
    markAsNoShow,
  };
}

// Hook para buscar call individual
export function useSalesCall(callId: string | null) {
  const { data: call, isLoading, error } = useQuery({
    queryKey: ['sales-call', callId],
    queryFn: () => fetchSalesCall(callId!),
    enabled: !!callId,
  });

  return { call, isLoading, error };
}

