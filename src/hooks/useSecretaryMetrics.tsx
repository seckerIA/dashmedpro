import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
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

  return useQuery({
    queryKey: ['secretary-metrics', user?.id],
    queryFn: async ({ signal }): Promise<SecretaryMetrics> => {
      if (!user?.id) return emptyMetrics;

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Buscar todas as consultas (secretária pode ver todas)
      const appointmentsQuery = supabase
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
        .order('start_time', { ascending: true });

      // Buscar médicos
      const doctorsQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['dono', 'medico'])
        .eq('is_active', true);

      // Buscar contatos criados hoje
      const contactsTodayQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // Buscar contatos criados na semana
      const contactsWeekQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' })
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);

      // Buscar total de contatos
      const totalContactsQuery = supabase
        .from('crm_contacts')
        .select('id', { count: 'exact' });

      // Consultas agendadas por mim (user_id = secretária)
      const myAppointmentsQuery = supabase
        .from('medical_appointments')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', monthStart);

      // Executar todas as queries em paralelo
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

      const appointments = appointmentsResult.data || [];
      const doctors = doctorsResult.data || [];

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
        appointmentsScheduledByMe: myAppointmentsResult.data?.length || 0,
        appointmentsThisWeek,
        newContactsToday: contactsTodayResult.data?.length || 0,
        newContactsWeek: contactsWeekResult.data?.length || 0,
        totalContacts: totalContactsResult.data?.length || 0,
        upcomingAppointments,
        doctors: doctors.map(d => ({
          id: d.id,
          name: d.full_name || d.email,
          email: d.email,
        })),
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minuto - atualiza mais frequentemente
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // Secretária precisa de dados atualizados
    refetchOnWindowFocus: true, // Atualizar ao voltar para a aba
    retry: 2,
    retryDelay: 1000,
  });
}
