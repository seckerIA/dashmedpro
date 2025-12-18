import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { addDays, isAfter, isBefore } from 'date-fns';
import {
  MedicalAppointment,
  MedicalAppointmentWithRelations,
  MedicalAppointmentInsert,
  MedicalAppointmentUpdate,
  AppointmentType,
  AppointmentStatus,
  PaymentStatus,
} from '@/types/medicalAppointments';
import { FinancialTransactionInsert } from '@/types/financial';

interface UseMedicalAppointmentsFilters {
  startDate?: Date;
  endDate?: Date;
  appointmentType?: AppointmentType | 'all';
  status?: AppointmentStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  contactId?: string;
}

// Fetch appointments with relations
const fetchAppointments = async (
  userId: string,
  filters?: UseMedicalAppointmentsFilters
): Promise<MedicalAppointmentWithRelations[]> => {
  let query = supabase
    .from('medical_appointments')
    .select(`
      *,
      contact:crm_contacts(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
    .order('start_time', { ascending: true });

  // Apply filters
  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate.toISOString());
  }

  if (filters?.appointmentType && filters.appointmentType !== 'all') {
    query = query.eq('appointment_type', filters.appointmentType);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Erro ao buscar consultas: ${error.message}`);
  return (data as MedicalAppointmentWithRelations[]) || [];
};

// Create appointment
const createAppointment = async (
  appointmentData: MedicalAppointmentInsert
): Promise<MedicalAppointmentWithRelations> => {
  const { data, error } = await supabase
    .from('medical_appointments')
    .insert({
      ...appointmentData,
      paid_in_advance: appointmentData.paid_in_advance || false,
    })
    .select(`
      *,
      contact:crm_contacts(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
    .single();

  if (error) throw new Error(`Erro ao criar consulta: ${error.message}`);
  return data as MedicalAppointmentWithRelations;
};

// Update appointment
const updateAppointment = async ({
  id,
  updates,
}: {
  id: string;
  updates: MedicalAppointmentUpdate;
}): Promise<MedicalAppointmentWithRelations> => {
  const updateData = {
    ...updates,
    paid_in_advance: updates.paid_in_advance !== undefined ? updates.paid_in_advance : undefined,
  };
  
  const { data, error } = await supabase
    .from('medical_appointments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      contact:crm_contacts(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
    .single();

  if (error) throw new Error(`Erro ao atualizar consulta: ${error.message}`);
  return data as MedicalAppointmentWithRelations;
};

// Delete appointment
const deleteAppointment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('medical_appointments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao excluir consulta: ${error.message}`);
};

// Hook principal
export function useMedicalAppointments(filters?: UseMedicalAppointmentsFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['medical-appointments', user?.id, filters];

  // Query: List appointments with relations
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchAppointments(user?.id || '', filters),
    enabled: !!user?.id,
  });

  // Mutation: Create appointment
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      toast({
        title: 'Consulta agendada com sucesso!',
        description: 'A consulta foi adicionada à agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao agendar consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update appointment (with optimistic updates for drag-and-drop)
  const updateMutation = useMutation({
    mutationFn: updateAppointment,
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: MedicalAppointmentWithRelations[] | undefined) => {
        if (!old) return old;
        return old.map((appt) => (appt.id === id ? { ...appt, ...updates } : appt));
      });

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: 'Erro ao atualizar consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
    },
  });

  // Mutation: Delete appointment
  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      toast({
        title: 'Consulta excluída',
        description: 'A consulta foi removida da agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Mark as completed
  const markAsCompleted = useMutation({
    mutationFn: async (id: string) => {
      // Buscar a consulta completa antes de atualizar
      const { data: appointment, error: fetchError } = await supabase
        .from('medical_appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error(`Erro ao buscar consulta: ${fetchError.message}`);
      if (!appointment) throw new Error('Consulta não encontrada');

      // Verificar se já existe transação financeira vinculada
      let financialTransactionId = appointment.financial_transaction_id;

      // Se não existe transação e tem valor estimado, criar uma transação financeira
      if (!financialTransactionId && appointment.estimated_value && appointment.estimated_value > 0) {
        // Buscar categoria padrão de entrada (consultas médicas)
        const { data: categories } = await supabase
          .from('financial_categories')
          .select('id')
          .eq('type', 'entrada')
          .limit(1);

        // Buscar primeira conta disponível
        const { data: accounts } = await supabase
          .from('financial_accounts')
          .select('id')
          .limit(1);

        const categoryId = categories && categories.length > 0 ? categories[0].id : null;
        const accountId = accounts && accounts.length > 0 ? accounts[0].id : null;

        // Criar transação financeira
        const transactionData: FinancialTransactionInsert = {
          user_id: appointment.user_id,
          account_id: accountId,
          category_id: categoryId,
          type: 'entrada',
          amount: Number(appointment.estimated_value),
          description: `Consulta: ${appointment.title}`,
          date: new Date(appointment.start_time).toISOString().split('T')[0],
          transaction_date: new Date(appointment.start_time).toISOString().split('T')[0],
          contact_id: appointment.contact_id,
          payment_method: (appointment.payment_status === 'paid' || appointment.payment_status === 'partial') ? 'pix' : null,
          status: (appointment.payment_status === 'paid' || appointment.payment_status === 'partial') ? 'concluida' : 'pendente',
          notes: `Consulta médica - ${appointment.appointment_type}`,
          tags: ['consulta-medica'],
          has_costs: false,
          total_costs: 0,
          metadata: {
            appointment_id: appointment.id,
            appointment_type: appointment.appointment_type,
          },
        };

        const { data: transaction, error: transactionError } = await supabase
          .from('financial_transactions')
          .insert(transactionData)
          .select()
          .single();

        if (transactionError) {
          console.error('Erro ao criar transação financeira:', transactionError);
          console.error('Dados da transação:', transactionData);
          toast({
            title: 'Aviso',
            description: `Consulta concluída, mas não foi possível criar a transação financeira: ${transactionError.message}`,
            variant: 'default',
          });
          // Não falha a operação principal se não conseguir criar a transação
        } else {
          financialTransactionId = transaction.id;
          console.log('Transação financeira criada com sucesso:', transaction.id);
        }
      }

      // Atualizar a consulta com status concluído e vincular transação se criada
      return updateMutation.mutateAsync({
        id,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          ...(financialTransactionId && !appointment.financial_transaction_id
            ? { financial_transaction_id: financialTransactionId }
            : {}),
        },
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
      
      // Verificar se uma transação foi criada
      const hasTransaction = data?.financial_transaction_id;
      toast({
        title: 'Consulta concluída',
        description: hasTransaction 
          ? 'A consulta foi marcada como concluída e a transação financeira foi criada automaticamente.'
          : 'A consulta foi marcada como concluída.',
      });
    },
  });

  // Helper: Mark as no-show
  const markAsNoShow = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({
        id,
        updates: { status: 'no_show' },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Falta registrada',
        description: 'O paciente foi marcado como não compareceu.',
      });
    },
  });

  // Helper: Cancel appointment
  const cancelAppointment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return updateMutation.mutateAsync({
        id,
        updates: {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Consulta cancelada',
        description: 'A consulta foi cancelada com sucesso.',
      });
    },
  });

  // Computed: Today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.start_time);
      return apptDate >= today && apptDate < tomorrow;
    });
  }, [appointments]);

  // Computed: Upcoming appointments (next 24 hours)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.start_time);
      return isAfter(apptDate, now) && isBefore(apptDate, tomorrow);
    });
  }, [appointments]);

  // Computed: Pending payments count
  const pendingPaymentsCount = useMemo(() => {
    return appointments.filter((appt) => appt.payment_status === 'pending').length;
  }, [appointments]);

  return {
    appointments,
    todayAppointments,
    upcomingAppointments,
    pendingPaymentsCount,
    isLoading,
    error,
    refetch,
    createAppointment: createMutation,
    updateAppointment: updateMutation,
    deleteAppointment: deleteMutation,
    markAsCompleted,
    markAsNoShow,
    cancelAppointment,
  };
}
