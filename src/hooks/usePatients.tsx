import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import { Patient, UpdatePatientMedicalInfoInput, EmergencyContact } from '@/types/medicalRecords';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// HOOK: usePatients
// Gerencia busca e atualização de pacientes (crm_contacts com campos médicos)
// =====================================================

export function usePatients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os pacientes (apenas os que têm consultas marcadas)
  const {
    data: patients,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];

      try {
        // 1. Buscar todos os appointments (usando cast para contornar problema de tipos)
        const appointmentsQuery = (supabase.from as any)('medical_appointments')
          .select('contact_id, start_time')
          .order('start_time', { ascending: false });
        
        const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

        if (appointmentsError) {
          console.error('Erro ao buscar appointments:', appointmentsError);
          throw new Error(`Erro ao buscar consultas: ${appointmentsError.message}`);
        }

        if (!appointmentsData || appointmentsData.length === 0) return [];

        // 2. Extrair contact_ids únicos que têm consultas
        const contactIdsSet = new Set<string>();
        appointmentsData.forEach((apt: any) => {
          if (apt.contact_id) {
            contactIdsSet.add(apt.contact_id);
          }
        });

        const contactIds = Array.from(contactIdsSet);
        if (contactIds.length === 0) return [];

        // 3. Buscar informações dos contatos que têm consultas
        const query = supabase
          .from('crm_contacts')
          .select(`
            id,
            full_name,
            email,
            phone,
            custom_fields,
            created_at,
            updated_at
          `)
          .in('id', contactIds)
          .order('full_name', { ascending: true })
          .limit(500);

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar pacientes:', error);
          throw new Error(`Erro ao buscar pacientes: ${error.message}`);
        }

        // 4. Mapear estatísticas de consultas
        const appointmentsMap = new Map<string, { count: number; lastDate: string }>();
        appointmentsData.forEach((apt: any) => {
          const existing = appointmentsMap.get(apt.contact_id);
          if (!existing || new Date(apt.start_time) > new Date(existing.lastDate)) {
            appointmentsMap.set(apt.contact_id, {
              count: (existing?.count || 0) + 1,
              lastDate: apt.start_time,
            });
          } else {
            appointmentsMap.set(apt.contact_id, {
              count: existing.count + 1,
              lastDate: existing.lastDate,
            });
          }
        });

        // 5. Adicionar estatísticas aos pacientes
        return (data || []).map((patient: any) => {
          const stats = appointmentsMap.get(patient.id);
          return {
            ...patient,
            total_appointments: stats?.count || 0,
            last_appointment: stats?.lastDate || null,
          } as Patient;
        });
      } catch (error) {
        console.error('Erro ao buscar pacientes com consultas:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Buscar paciente por ID
  const getPatientById = async (patientId: string): Promise<Patient | null> => {
    if (!patientId) return null;

    const { data, error } = await supabase
      .from('crm_contacts')
      .select(`
        id,
        full_name,
        email,
        phone,
        custom_fields,
        created_at,
        updated_at
      `)
      .eq('id', patientId)
      .single();

    if (error) {
      console.error('Erro ao buscar paciente:', error);
      return null;
    }

    return data as Patient;
  };

  // Mutation para atualizar informações médicas do paciente
  const updatePatientMedicalInfoMutation = useMutation({
    mutationFn: async ({
      patientId,
      updates
    }: {
      patientId: string;
      updates: UpdatePatientMedicalInfoInput;
    }) => {
      // Converter emergency_contact para JSON se necessário
      const updateData: Record<string, unknown> = {};

      if (updates.birth_date !== undefined) {
        updateData.birth_date = updates.birth_date || null;
      }
      if (updates.blood_type !== undefined) {
        updateData.blood_type = updates.blood_type || null;
      }
      if (updates.allergies !== undefined) {
        updateData.allergies = updates.allergies || [];
      }
      if (updates.chronic_conditions !== undefined) {
        updateData.chronic_conditions = updates.chronic_conditions || [];
      }
      if (updates.current_medications !== undefined) {
        updateData.current_medications = updates.current_medications || [];
      }
      if (updates.emergency_contact !== undefined) {
        updateData.emergency_contact = updates.emergency_contact || null;
      }

      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updateData)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar paciente: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'Sucesso',
        description: 'Informações do paciente atualizadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    },
  });

  // Buscar pacientes com estatísticas (consultas, prontuários)
  const getPatientsWithStats = async (): Promise<Patient[]> => {
    if (!user?.id) return [];

    // Buscar pacientes
    const { data: patientsData, error: patientsError } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('full_name', { ascending: true })
      .limit(500);

    if (patientsError) {
      console.error('Erro ao buscar pacientes:', patientsError);
      return [];
    }

    // Buscar contagem de consultas por paciente (usando cast para contornar problema de tipos)
    const appointmentsCountQuery = (supabase.from as any)('medical_appointments')
      .select('contact_id')
      .in('contact_id', patientsData?.map(p => p.id) || []);
    const { data: appointmentsCount } = await appointmentsCountQuery;

    // Buscar última consulta por paciente
    const lastAppointmentsQuery = (supabase.from as any)('medical_appointments')
      .select('contact_id, start_time')
      .in('contact_id', patientsData?.map(p => p.id) || [])
      .order('start_time', { ascending: false });
    const { data: lastAppointments } = await lastAppointmentsQuery;

    // Mapear estatísticas
    const appointmentsByPatient = new Map<string, number>();
    const lastAppointmentByPatient = new Map<string, string>();

    (appointmentsCount || []).forEach((apt: any) => {
      const count = appointmentsByPatient.get(apt.contact_id) || 0;
      appointmentsByPatient.set(apt.contact_id, count + 1);
    });

    (lastAppointments || []).forEach((apt: any) => {
      if (!lastAppointmentByPatient.has(apt.contact_id)) {
        lastAppointmentByPatient.set(apt.contact_id, apt.start_time);
      }
    });

    return (patientsData || []).map(patient => ({
      ...patient,
      total_appointments: appointmentsByPatient.get(patient.id) || 0,
      last_appointment: lastAppointmentByPatient.get(patient.id) || null,
    })) as Patient[];
  };

  // Buscar pacientes por termo de busca
  const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
    if (!searchTerm || searchTerm.length < 2) return patients || [];

    const term = searchTerm.toLowerCase();

    // Filtrar localmente se já temos os dados
    if (patients && patients.length > 0) {
      return patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
      );
    }

    // Buscar do banco se não temos dados locais
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('full_name', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erro na busca:', error);
      return [];
    }

    return (data || []) as Patient[];
  };

  return {
    patients,
    isLoading,
    error,
    refetch,
    getPatientById,
    searchPatients,
    getPatientsWithStats,
    updatePatientMedicalInfo: updatePatientMedicalInfoMutation.mutate,
    isUpdating: updatePatientMedicalInfoMutation.isPending,
  };
}

// =====================================================
// HOOK: usePatient (singular)
// Busca um paciente específico por ID
// =====================================================

export function usePatient(patientId: string | null) {
  const { user } = useAuth();

  const {
    data: patient,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async ({ signal }) => {
      if (!patientId || !user?.id) return null;

      const query = supabase
        .from('crm_contacts')
        .select(`
          id,
          full_name,
          email,
          phone,
          custom_fields,
          created_at,
          updated_at
        `)
        .eq('id', patientId)
        .single();

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Paciente não encontrado
        }
        throw new Error(`Erro ao buscar paciente: ${error.message}`);
      }

      return data as Patient;
    },
    enabled: !!patientId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    patient,
    isLoading,
    error,
    refetch,
  };
}
