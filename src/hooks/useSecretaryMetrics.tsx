import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays } from 'date-fns';

export interface SecretaryMetrics {
  // Métricas de Agendamentos
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  confirmedToday: number;
  pendingConfirmation: number;

  // Métricas de Atendimento
  appointmentsScheduledByMe: number;
  appointmentsThisWeek: Array<{
    date: string;
    count: number;
  }>;

  // Métricas de Contatos/Leads
  newContactsToday: number;
  newContactsWeek: number;
  totalContacts: number;

  // Próximos Atendimentos
  upcomingAppointments: Array<{
    id: string;
    title: string;
    patientName: string;
    doctorName: string;
    startTime: string;
    status: string;
  }>;

  // Médicos disponíveis
  doctors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

const emptyMetrics: SecretaryMetrics = {
  todayAppointments: 0,
  weekAppointments: 0,
  monthAppointments: 0,
  confirmedToday: 0,
  pendingConfirmation: 0,
  appointmentsScheduledByMe: 0,
  appointmentsThisWeek: [],
  newContactsToday: 0,
  newContactsWeek: 0,
  totalContacts: 0,
  upcomingAppointments: [],
  doctors: [],
};

export function useSecretaryMetrics() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  return useQuery({
    queryKey: ['secretary-metrics', user?.id, profile?.doctor_id],
    queryFn: async ({ signal }): Promise<SecretaryMetrics> => {
      if (!user?.id) return emptyMetrics;

      // Se secretária estiver vinculada a um médico, usar doctor_id para filtrar
      const doctorIdFilter = profile?.role === 'secretaria' && profile?.doctor_id 
        ? profile.doctor_id 
        : null;

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Buscar consultas - filtrar por doctor_id se secretária estiver vinculada
      let appointmentsQuery = supabase
        .from('medical_appointments')
        .select(`
          id,
          title,
          start_time,
          end_time,
          status,
          user_id,
          doctor_id,
          contact:crm_contacts(id, full_name, phone, email)
        `)
        .gte('start_time', todayStart)
        .lte('start_time', monthEnd) // Limitar até o fim do mês
        .limit(500) // Limitar resultados para evitar queries pesadas
        .order('start_time', { ascending: true });

      // Se secretária estiver vinculada, mostrar apenas consultas do médico vinculado
      if (doctorIdFilter) {
        appointmentsQuery = appointmentsQuery.eq('doctor_id', doctorIdFilter);
      }

      // Buscar médicos - se vinculada, mostrar apenas o médico vinculado
      let doctorsQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['dono', 'medico'])
        .eq('is_active', true);

      if (doctorIdFilter) {
        doctorsQuery = doctorsQuery.eq('id', doctorIdFilter);
      }

      // Buscar contatos - filtrar por user_id do médico vinculado se houver
      // Nota: contatos não têm doctor_id direto, então filtramos pelos contatos
      // que estão vinculados a deals/consultas do médico
      let contactsTodayQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      let contactsWeekQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' })
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);

      let totalContactsQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' });

      // Se secretária estiver vinculada, filtrar contatos por user_id do médico
      if (doctorIdFilter) {
        contactsTodayQuery = contactsTodayQuery.eq('user_id', doctorIdFilter);
        contactsWeekQuery = contactsWeekQuery.eq('user_id', doctorIdFilter);
        totalContactsQuery = totalContactsQuery.eq('user_id', doctorIdFilter);
      }

      // Consultas agendadas por mim (user_id = secretária)
      const myAppointmentsQuery = supabase
        .from('medical_appointments')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', monthStart);

      // Executar todas as queries em paralelo
      let appointments: any[] = [];
      let doctors: any[] = [];
      let contactsTodayCount = 0;
      let contactsWeekCount = 0;
      let totalContactsCount = 0;
      let myAppointmentsCount = 0;

      try {
        const [
          appointmentsResult,
          doctorsResult,
          contactsTodayResult,
          contactsWeekResult,
          totalContactsResult,
          myAppointmentsResult,
        ] = await Promise.all([
          supabaseQueryWithTimeout(appointmentsQuery as any, 30000, signal),
          supabaseQueryWithTimeout(doctorsQuery as any, 30000, signal),
          supabaseQueryWithTimeout(contactsTodayQuery as any, 30000, signal),
          supabaseQueryWithTimeout(contactsWeekQuery as any, 30000, signal),
          supabaseQueryWithTimeout(totalContactsQuery as any, 30000, signal),
          supabaseQueryWithTimeout(myAppointmentsQuery as any, 30000, signal),
        ]);

        // Tratar erros individualmente para não quebrar toda a query se uma falhar
        if (appointmentsResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar consultas:', appointmentsResult.error);
        } else {
          appointments = appointmentsResult.data || [];
        }

        if (doctorsResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar médicos:', doctorsResult.error);
        } else {
          doctors = doctorsResult.data || [];
        }

        if (contactsTodayResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar contatos de hoje:', contactsTodayResult.error);
        } else {
          contactsTodayCount = contactsTodayResult.data?.length || 0;
        }

        if (contactsWeekResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar contatos da semana:', contactsWeekResult.error);
        } else {
          contactsWeekCount = contactsWeekResult.data?.length || 0;
        }

        if (totalContactsResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar total de contatos:', totalContactsResult.error);
        } else {
          totalContactsCount = totalContactsResult.data?.length || 0;
        }

        if (myAppointmentsResult.error) {
          console.error('[useSecretaryMetrics] Erro ao buscar consultas agendadas por mim:', myAppointmentsResult.error);
        } else {
          myAppointmentsCount = myAppointmentsResult.data?.length || 0;
        }
      } catch (error) {
        console.error('[useSecretaryMetrics] Erro geral ao buscar métricas:', error);
        // Retornar métricas vazias em caso de erro crítico
        return emptyMetrics;
      }

      // Criar mapa de médicos para lookup rápido
      const doctorsMap = new Map(doctors.map(d => [d.id, d]));

      // Filtrar consultas por período
      const todayAppointments = appointments.filter(a => {
        const startTime = new Date(a.start_time);
        return startTime >= new Date(todayStart) && startTime <= new Date(todayEnd);
      });

      const weekAppointments = appointments.filter(a => {
        const startTime = new Date(a.start_time);
        return startTime >= new Date(weekStart) && startTime <= new Date(weekEnd);
      });

      const monthAppointments = appointments.filter(a => {
        const startTime = new Date(a.start_time);
        return startTime >= new Date(monthStart) && startTime <= new Date(monthEnd);
      });

      // Contar confirmadas e pendentes de hoje
      const confirmedToday = todayAppointments.filter(a =>
        a.status === 'confirmed' || a.status === 'completed'
      ).length;

      const pendingConfirmation = todayAppointments.filter(a =>
        a.status === 'scheduled'
      ).length;

      // Preparar próximos atendimentos (próximas 10 consultas de hoje em diante)
      const upcomingAppointments = appointments
        .filter(a => new Date(a.start_time) >= now)
        .slice(0, 10)
        .map(a => {
          const doctor = a.doctor_id ? doctorsMap.get(a.doctor_id) : null;
          return {
            id: a.id,
            title: a.title,
            patientName: a.contact?.full_name || 'Paciente não informado',
            doctorName: doctor?.full_name || 'Médico não definido',
            startTime: a.start_time,
            status: a.status,
          };
        });

      // Calcular consultas por dia da semana (últimos 7 dias)
      const appointmentsThisWeek: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = appointments.filter(a =>
          format(new Date(a.start_time), 'yyyy-MM-dd') === dateStr
        ).length;
        appointmentsThisWeek.push({
          date: format(date, 'EEE', { locale: undefined }),
          count,
        });
      }

      return {
        todayAppointments: todayAppointments.length,
        weekAppointments: weekAppointments.length,
        monthAppointments: monthAppointments.length,
        confirmedToday,
        pendingConfirmation,
        appointmentsScheduledByMe: myAppointmentsCount,
        appointmentsThisWeek,
        newContactsToday: contactsTodayCount,
        newContactsWeek: contactsWeekCount,
        totalContacts: totalContactsCount,
        upcomingAppointments,
        doctors: doctors.map(d => ({
          id: d.id,
          name: d.full_name || d.email,
          email: d.email,
        })),
      };
    },
    enabled: !!user?.id && !!profile && profile?.role === 'secretaria',
    // TODO: Migrar para CACHE_TIMES.NORMAL e GC_TIMES.NORMAL de queryConstants.ts
    staleTime: 5 * 60 * 1000, // 5 minutos - dados normais que mudam ocasionalmente
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    refetchOnMount: false, // Não refetch automático ao montar
    refetchOnWindowFocus: false, // Não refetch ao voltar para a aba
    refetchOnReconnect: false,
    retry: 1, // Reduzir retries para evitar sobrecarga
    retryDelay: 2000,
  });
}
