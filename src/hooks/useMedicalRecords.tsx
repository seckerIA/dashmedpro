import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { useAuth } from './useAuth';
import {
  MedicalRecord,
  CreateMedicalRecordInput,
  Prescription,
  CreatePrescriptionInput,
  MedicationPrescription,
  RequestedExam,
  VitalSigns
} from '@/types/medicalRecords';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// HOOK: useMedicalRecords
// CRUD completo para prontuários médicos
// =====================================================

export function useMedicalRecords(contactId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar prontuários de um paciente específico
  const {
    data: records,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['medical-records', contactId],
    queryFn: async ({ signal }) => {
      if (!contactId || !user?.id) return [];

      const query = supabase
        .from('medical_records')
        .select(`
          *,
          contact:crm_contacts(id, full_name, phone, email, cpf),
          doctor:profiles!medical_records_doctor_id_fkey(id, full_name, email)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      const { data, error } = await supabaseQueryWithTimeout(query, 30000, signal);

      if (error) {
        console.error('Erro ao buscar prontuários:', error);
        throw new Error(`Erro ao buscar prontuários: ${error.message}`);
      }

      return (data || []) as MedicalRecord[];
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Criar novo prontuário
  const createRecordMutation = useMutation({
    mutationFn: async (input: CreateMedicalRecordInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const recordData = {
        contact_id: input.contact_id,
        doctor_id: user.id,
        user_id: user.id,
        appointment_id: input.appointment_id || null,

        // Anamnese
        chief_complaint: input.chief_complaint || null,
        history_current_illness: input.history_current_illness || null,
        past_medical_history: input.past_medical_history || null,
        family_history: input.family_history || null,
        social_history: input.social_history || null,
        allergies_noted: input.allergies_noted || [],

        // Exame Físico
        vital_signs: input.vital_signs || null,
        general_condition: input.general_condition || null,
        physical_exam_notes: input.physical_exam_notes || null,

        // Diagnóstico
        diagnostic_hypothesis: input.diagnostic_hypothesis || null,
        cid_codes: input.cid_codes || [],
        secondary_diagnoses: input.secondary_diagnoses || [],

        // Conduta
        treatment_plan: input.treatment_plan || null,
        patient_instructions: input.patient_instructions || null,
        follow_up_notes: input.follow_up_notes || null,
        next_appointment_date: input.next_appointment_date || null,

        // Prescrições e Exames
        prescriptions: input.prescriptions || [],
        exams_requested: input.exams_requested || [],

        // Metadados
        record_type: input.record_type || 'consultation',
        record_status: 'completed',
      };

      const { data, error } = await supabase
        .from('medical_records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar prontuário: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      toast({
        title: 'Prontuário salvo',
        description: 'O atendimento foi registrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    },
  });

  // Atualizar prontuário
  const updateRecordMutation = useMutation({
    mutationFn: async ({
      recordId,
      updates
    }: {
      recordId: string;
      updates: Partial<CreateMedicalRecordInput>;
    }) => {
      const updateData: Record<string, unknown> = {};

      // Mapear campos para atualização
      if (updates.chief_complaint !== undefined) updateData.chief_complaint = updates.chief_complaint;
      if (updates.history_current_illness !== undefined) updateData.history_current_illness = updates.history_current_illness;
      if (updates.past_medical_history !== undefined) updateData.past_medical_history = updates.past_medical_history;
      if (updates.family_history !== undefined) updateData.family_history = updates.family_history;
      if (updates.social_history !== undefined) updateData.social_history = updates.social_history;
      if (updates.allergies_noted !== undefined) updateData.allergies_noted = updates.allergies_noted;
      if (updates.vital_signs !== undefined) updateData.vital_signs = updates.vital_signs;
      if (updates.general_condition !== undefined) updateData.general_condition = updates.general_condition;
      if (updates.physical_exam_notes !== undefined) updateData.physical_exam_notes = updates.physical_exam_notes;
      if (updates.diagnostic_hypothesis !== undefined) updateData.diagnostic_hypothesis = updates.diagnostic_hypothesis;
      if (updates.cid_codes !== undefined) updateData.cid_codes = updates.cid_codes;
      if (updates.secondary_diagnoses !== undefined) updateData.secondary_diagnoses = updates.secondary_diagnoses;
      if (updates.treatment_plan !== undefined) updateData.treatment_plan = updates.treatment_plan;
      if (updates.patient_instructions !== undefined) updateData.patient_instructions = updates.patient_instructions;
      if (updates.follow_up_notes !== undefined) updateData.follow_up_notes = updates.follow_up_notes;
      if (updates.next_appointment_date !== undefined) updateData.next_appointment_date = updates.next_appointment_date;
      if (updates.prescriptions !== undefined) updateData.prescriptions = updates.prescriptions;
      if (updates.exams_requested !== undefined) updateData.exams_requested = updates.exams_requested;
      if (updates.record_type !== undefined) updateData.record_type = updates.record_type;

      const { data, error } = await supabase
        .from('medical_records')
        .update(updateData)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar prontuário: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      toast({
        title: 'Prontuário atualizado',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    },
  });

  // Deletar prontuário
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        throw new Error(`Erro ao deletar prontuário: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      toast({
        title: 'Prontuário removido',
        description: 'O registro foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error.message,
      });
    },
  });

  // Buscar prontuário por ID
  const getRecordById = async (recordId: string): Promise<MedicalRecord | null> => {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        contact:crm_contacts(id, full_name, phone, email, cpf),
        doctor:profiles!medical_records_doctor_id_fkey(id, full_name, email)
      `)
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Erro ao buscar prontuário:', error);
      return null;
    }

    return data as MedicalRecord;
  };

  return {
    records,
    isLoading,
    error,
    refetch,
    createRecord: createRecordMutation.mutate,
    updateRecord: updateRecordMutation.mutate,
    deleteRecord: deleteRecordMutation.mutate,
    getRecordById,
    isCreating: createRecordMutation.isPending,
    isUpdating: updateRecordMutation.isPending,
    isDeleting: deleteRecordMutation.isPending,
  };
}

// =====================================================
// HOOK: usePrescriptions
// Gerencia receitas médicas
// =====================================================

export function usePrescriptions(contactId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar receitas de um paciente
  const {
    data: prescriptions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['prescriptions', contactId],
    queryFn: async ({ signal }) => {
      if (!contactId || !user?.id) return [];

      const query = supabase
        .from('prescriptions')
        .select(`
          *,
          contact:crm_contacts(id, full_name, cpf),
          doctor:profiles!prescriptions_doctor_id_fkey(id, full_name, email)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      const { data, error } = await supabaseQueryWithTimeout(query, 30000, signal);

      if (error) {
        console.error('Erro ao buscar receitas:', error);
        throw new Error(`Erro ao buscar receitas: ${error.message}`);
      }

      return (data || []) as Prescription[];
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Criar nova receita
  const createPrescriptionMutation = useMutation({
    mutationFn: async (input: CreatePrescriptionInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const prescriptionData = {
        contact_id: input.contact_id,
        doctor_id: user.id,
        medical_record_id: input.medical_record_id || null,
        medications: input.medications,
        notes: input.notes || null,
        valid_until: input.valid_until || null,
        prescription_type: input.prescription_type || 'simple',
        prescription_date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar receita: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({
        title: 'Receita criada',
        description: 'A receita foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar receita',
        description: error.message,
      });
    },
  });

  // Marcar receita como impressa
  const markAsPrintedMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          is_printed: true,
          printed_at: new Date().toISOString(),
        })
        .eq('id', prescriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar receita: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  return {
    prescriptions,
    isLoading,
    error,
    refetch,
    createPrescription: createPrescriptionMutation.mutate,
    markAsPrinted: markAsPrintedMutation.mutate,
    isCreating: createPrescriptionMutation.isPending,
  };
}

// =====================================================
// HOOK: usePatientMedicalHistory
// Busca histórico completo de um paciente
// =====================================================

export function usePatientMedicalHistory(contactId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient-medical-history', contactId],
    queryFn: async ({ signal }) => {
      if (!contactId || !user?.id) return null;

      // Buscar prontuários
      const recordsQuery = supabase
        .from('medical_records')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      // Buscar consultas
      const appointmentsQuery = supabase
        .from('medical_appointments')
        .select('*')
        .eq('contact_id', contactId)
        .order('start_time', { ascending: false });

      // Buscar receitas
      const prescriptionsQuery = supabase
        .from('prescriptions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      const [recordsResult, appointmentsResult, prescriptionsResult] = await Promise.all([
        supabaseQueryWithTimeout(recordsQuery, 30000, signal),
        supabaseQueryWithTimeout(appointmentsQuery, 30000, signal),
        supabaseQueryWithTimeout(prescriptionsQuery, 30000, signal),
      ]);

      return {
        records: recordsResult.data || [],
        appointments: appointmentsResult.data || [],
        prescriptions: prescriptionsResult.data || [],
        totalRecords: recordsResult.data?.length || 0,
        totalAppointments: appointmentsResult.data?.length || 0,
        totalPrescriptions: prescriptionsResult.data?.length || 0,
      };
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

// =====================================================
// UTILITÁRIO: Calcular IMC
// =====================================================

export function calculateBMI(weight?: number, height?: number): number | null {
  if (!weight || !height || height === 0) return null;
  // Altura em metros (se vier em cm, converter)
  const heightInMeters = height > 3 ? height / 100 : height;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Arredondar para 1 casa decimal
}

// =====================================================
// UTILITÁRIO: Classificar IMC
// =====================================================

export function classifyBMI(bmi: number | null): { label: string; color: string } {
  if (bmi === null) return { label: '-', color: 'gray' };

  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'yellow' };
  if (bmi < 25) return { label: 'Peso normal', color: 'green' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'orange' };
  if (bmi < 35) return { label: 'Obesidade I', color: 'red' };
  if (bmi < 40) return { label: 'Obesidade II', color: 'red' };
  return { label: 'Obesidade III', color: 'red' };
}
