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
}

// Fetch meetings
const fetchMeetings = async (
  userId: string,
  filters?: UseGeneralMeetingsFilters
): Promise<GeneralMeeting[]> => {
  let query = supabase
    .from('general_meetings')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

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

  const { data, error } = await query;

  if (error) throw new Error(`Erro ao buscar reuniões: ${error.message}`);
  return (data as GeneralMeeting[]) || [];
};

// Create meeting
const createMeeting = async (meetingData: GeneralMeetingInsert): Promise<GeneralMeeting> => {
  const { data, error } = await supabase
    .from('general_meetings')
    .insert(meetingData)
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
    .update(updates)
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

// Hook principal
export function useGeneralMeetings(filters?: UseGeneralMeetingsFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['general-meetings', user?.id, filters];

  // Query: List meetings
  const {
    data: meetings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchMeetings(user?.id || '', filters),
    enabled: !!user?.id,
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

