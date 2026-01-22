import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import {
  GeneralMeeting,
  GeneralMeetingInsert,
  GeneralMeetingUpdate,
  MeetingType,
  MeetingStatus,
} from '@/types/generalMeetings';

interface UseGeneralMeetingsFilters {
  startDate?: Date;
  endDate?: Date;
  meetingType?: MeetingType | 'all';
  status?: MeetingStatus | 'all';
  isBusy?: boolean | 'all';
  viewAsUserIds?: string[];
}

// Fetch meetings
const fetchMeetings = async (
  userId: string,
  filters?: UseGeneralMeetingsFilters,
  signal?: AbortSignal
): Promise<GeneralMeeting[]> => {
  // REMOVED: ensureValidSession() - causes timeout hangs with extensions

  let query = supabase
    .from('general_meetings')
    .select('*')
    .order('start_time', { ascending: true });

  if (filters?.viewAsUserIds && filters.viewAsUserIds.length > 0) {
    query = query.in('user_id', filters.viewAsUserIds);
  } else if (userId) {
    query = query.eq('user_id', userId);
  }

  // Apply filters
  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate.toISOString());
  }

  if (filters?.meetingType && filters.meetingType !== 'all') {
    query = query.eq('meeting_type', filters.meetingType);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.isBusy !== undefined && filters.isBusy !== 'all') {
    query = query.eq('is_busy', filters.isBusy);
  }

  // Usar wrapper com timeout
  const { supabaseQueryWithTimeout } = await import('@/utils/supabaseQuery');
  const { data, error } = await supabaseQueryWithTimeout(query as any, 30000, signal);

  if (error) throw new Error(`Erro ao buscar reuniões: ${error.message}`);
  return (data as GeneralMeeting[]) || [];
};

// Create meeting
const createMeeting = async (meetingData: GeneralMeetingInsert): Promise<GeneralMeeting> => {
  const { data, error } = await supabase
    .from('general_meetings')
    .insert(meetingData as any)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar reunião: ${error.message}`);
  return data as GeneralMeeting;
};

// Update meeting
const updateMeeting = async ({
  id,
  updates,
}: {
  id: string;
  updates: GeneralMeetingUpdate;
}): Promise<GeneralMeeting> => {
  const { data, error } = await supabase
    .from('general_meetings')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar reunião: ${error.message}`);
  return data as GeneralMeeting;
};

// Delete meeting
const deleteMeeting = async (id: string): Promise<void> => {
  const { error } = await supabase.from('general_meetings').delete().eq('id', id);

  if (error) throw new Error(`Erro ao excluir reunião: ${error.message}`);
};

// Helper para serializar filtros em uma query key estável
const serializeFilters = (filters?: UseGeneralMeetingsFilters): string => {
  if (!filters) return 'no-filters';

  const parts: string[] = [];
  if (filters.startDate) parts.push(`start:${filters.startDate.toISOString()}`);
  if (filters.endDate) parts.push(`end:${filters.endDate.toISOString()}`);
  if (filters.meetingType && filters.meetingType !== 'all') parts.push(`type:${filters.meetingType}`);
  if (filters.status && filters.status !== 'all') parts.push(`status:${filters.status}`);
  if (filters.isBusy !== undefined && filters.isBusy !== 'all') parts.push(`busy:${filters.isBusy}`);
  if (filters.viewAsUserIds && filters.viewAsUserIds.length > 0) parts.push(`viewUsers:${filters.viewAsUserIds.join(',')}`);

  return parts.length > 0 ? parts.join('|') : 'no-filters';
};

// Hook principal
export function useGeneralMeetings(filters?: UseGeneralMeetingsFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['general-meetings', user?.id, serializeFilters(filters)];

  // Query: List meetings
  const {
    data: meetings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchMeetings(user?.id || '', filters, signal),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Mutation: Create meeting
  const createMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-meetings'] });
      toast({
        title: 'Reunião agendada com sucesso!',
        description: 'A reunião foi adicionada à agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao agendar reunião',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update meeting
  const updateMutation = useMutation({
    mutationFn: updateMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-meetings'] });
      toast({
        title: 'Reunião atualizada!',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar reunião',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete meeting
  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-meetings'] });
      toast({
        title: 'Reunião excluída',
        description: 'A reunião foi removida da agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir reunião',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Mark as completed
  const markAsCompleted = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({
        id,
        updates: {
          id,
          status: 'completed',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Reunião concluída',
        description: 'A reunião foi marcada como concluída.',
      });
    },
  });

  // Helper: Cancel meeting
  const cancelMeeting = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({
        id,
        updates: {
          id,
          status: 'cancelled',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Reunião cancelada',
        description: 'A reunião foi cancelada com sucesso.',
      });
    },
  });

  // Computed: Busy periods (meetings with is_busy = true)
  const busyPeriods = useMemo(() => {
    return meetings.filter((meeting) => meeting.is_busy && meeting.status === 'scheduled');
  }, [meetings]);

  // Computed: Today's meetings
  const todayMeetings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= today && meetingDate < tomorrow;
    });
  }, [meetings]);

  return {
    meetings,
    busyPeriods,
    todayMeetings,
    isLoading,
    error,
    refetch,
    createMeeting: createMutation,
    updateMeeting: updateMutation,
    deleteMeeting: deleteMutation,
    markAsCompleted,
    cancelMeeting,
  };
}













