import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from 'date-fns';

export interface SecretarySinalMetrics {
  // Totais
  totalPending: number;
  totalPaid: number;
  totalSinal: number;
  
  // Contadores
  pendingCount: number;
  paidCount: number;
  totalCount: number;

  // Por período
  paidToday: number;
  paidThisWeek: number;
  pendingToday: number;
  pendingThisWeek: number;

  // Lista de consultas com sinal
  appointments: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    estimatedValue: number;
    sinalAmount: number;
    sinalPaid: boolean;
    sinalPaidAt: string | null;
    sinalReceiptUrl: string | null;
    paymentStatus: string;
    remainingAmount: number;
  }>;
}

const emptyMetrics: SecretarySinalMetrics = {
  totalPending: 0,
  totalPaid: 0,
  totalSinal: 0,
  pendingCount: 0,
  paidCount: 0,
  totalCount: 0,
  paidToday: 0,
  paidThisWeek: 0,
  pendingToday: 0,
  pendingThisWeek: 0,
  appointments: [],
};

export function useSecretarySinalMetrics() {
  const { user } = useAuth();
  const { profile, isSecretaria } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();

  return useQuery({
    queryKey: ['secretary-sinal-metrics', user?.id, doctorIds],
    queryFn: async ({ signal }): Promise<SecretarySinalMetrics> => {
      if (!user?.id) return emptyMetrics;

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).toISOString();

      // Construir query base
      let appointmentsQuery = (supabase as any)
        .from('medical_appointments')
        .select(`
          id,
          title,
          start_time,
          estimated_value,
          sinal_amount,
          sinal_paid,
          sinal_paid_at,
          sinal_receipt_url,
          payment_status,
          doctor_id,
          contact:crm_contacts(id, full_name),
          doctor:profiles!medical_appointments_doctor_id_profiles_fk(id, full_name)
        `)
        .not('sinal_amount', 'is', null)
        .gt('sinal_amount', 0)
        .order('start_time', { ascending: false });

      // Secretária vê consultas de todos os médicos vinculados
      if (isSecretaria && doctorIds.length > 0) {
        appointmentsQuery = appointmentsQuery.in('doctor_id', doctorIds);
      } else if (isSecretaria && doctorIds.length === 0) {
        // Secretária sem médicos vinculados - não mostra nada
        console.log('[useSecretarySinalMetrics] Secretária sem médicos vinculados');
        return emptyMetrics;
      }

      const { data: appointments, error } = await supabaseQueryWithTimeout(
        appointmentsQuery as any,
        30000,
        signal
      );

      if (error) {
        console.error('Erro ao buscar sinais:', error);
        // Se erro for relacionado a coluna não existir, retornar métricas vazias mas não quebrar
        if (error.code === '42703' || error.message?.includes('does not exist')) {
          console.warn('Coluna doctor_id não existe ainda, retornando métricas vazias');
          return emptyMetrics;
        }
        return emptyMetrics;
      }

      const appointmentsData = (appointments || []) as Array<{
        id: string;
        sinal_amount: number;
        sinal_paid: boolean;
        sinal_paid_at: string | null;
        start_time: string;
        estimated_value: number;
        contact?: { full_name: string | null } | null;
        doctor?: { full_name: string | null } | null;
      }>;

      // Calcular métricas
      const pendingAppointments = appointmentsData.filter(a => !a.sinal_paid);
      const paidAppointments = appointmentsData.filter(a => a.sinal_paid);

      const totalPending = pendingAppointments.reduce(
        (sum, a) => sum + (a.sinal_amount || 0),
        0
      );

      const totalPaid = paidAppointments.reduce(
        (sum, a) => sum + (a.sinal_amount || 0),
        0
      );

      // Filtrar por período
      const paidToday = paidAppointments.filter(a => {
        if (!a.sinal_paid_at) return false;
        const paidDate = new Date(a.sinal_paid_at);
        return paidDate >= new Date(todayStart) && paidDate <= new Date(todayEnd);
      }).reduce((sum, a) => sum + (a.sinal_amount || 0), 0);

      const paidThisWeek = paidAppointments.filter(a => {
        if (!a.sinal_paid_at) return false;
        const paidDate = new Date(a.sinal_paid_at);
        return paidDate >= new Date(weekStart) && paidDate <= new Date(weekEnd);
      }).reduce((sum, a) => sum + (a.sinal_amount || 0), 0);

      const pendingToday = pendingAppointments.filter(a => {
        const apptDate = new Date(a.start_time);
        return apptDate >= new Date(todayStart) && apptDate <= new Date(todayEnd);
      }).reduce((sum, a) => sum + (a.sinal_amount || 0), 0);

      const pendingThisWeek = pendingAppointments.filter(a => {
        const apptDate = new Date(a.start_time);
        return apptDate >= new Date(weekStart) && apptDate <= new Date(weekEnd);
      }).reduce((sum, a) => sum + (a.sinal_amount || 0), 0);

      // Preparar lista de consultas
      const appointmentsList = appointmentsData.map((a: any) => {
        const estimatedValue = a.estimated_value || 0;
        const sinalAmount = a.sinal_amount || 0;
        const remainingAmount = estimatedValue - (a.sinal_paid ? sinalAmount : 0);

        return {
          id: a.id,
          patientName: a.contact?.full_name || 'Paciente não informado',
          doctorName: a.doctor?.full_name || 'Médico não definido',
          appointmentDate: a.start_time,
          estimatedValue,
          sinalAmount,
          sinalPaid: a.sinal_paid || false,
          sinalPaidAt: a.sinal_paid_at,
          sinalReceiptUrl: a.sinal_receipt_url || null,
          paymentStatus: a.payment_status || 'pending',
          remainingAmount,
        };
      });

      return {
        totalPending,
        totalPaid,
        totalSinal: totalPending + totalPaid,
        pendingCount: pendingAppointments.length,
        paidCount: paidAppointments.length,
        totalCount: appointmentsData?.length || 0,
        paidToday,
        paidThisWeek,
        pendingToday,
        pendingThisWeek,
        appointments: appointmentsList,
      };
    },
    enabled: !!user?.id && !!profile && isSecretaria && !isLoadingDoctors,
    staleTime: 5 * 60 * 1000, // 5 minutos - aumentar staleTime
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false, // Não refetch automático
    refetchOnWindowFocus: false, // Desabilitar refetch automático para melhorar performance
    refetchOnReconnect: false,
    retry: 1, // Reduzir retries
    retryDelay: 2000,
  });
}

