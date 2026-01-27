import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useEffect } from 'react';
import {
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
    isSecretaria?: boolean; // Se true, busca TODOS os agendamentos (de todos os médicos)
    doctorIds?: string[]; // IDs dos médicos para filtrar explicitamente
}

// Tipos de estágio do pipeline para clínica médica
type MedicalPipelineStage = 'lead_novo' | 'agendado' | 'em_tratamento' | 'inadimplente' | 'follow_up' | 'fechado_ganho' | 'fechado_perdido';

// Create a client instance outside or inside. Inside is safer for Next.js client components.
const supabase = createClient();

/**
 * Função auxiliar para atualizar o pipeline automaticamente
 */
const updateDealPipeline = async (
    contactId: string,
    doctorId: string,
    appointmentData: {
        title: string;
        estimated_value?: number | null;
        sinal_amount?: number | null;
        sinal_paid?: boolean;
        status?: AppointmentStatus;
        payment_status?: PaymentStatus;
    }
): Promise<void> => {
    try {
        const supabase = createClient();
        // Determinar o estágio do pipeline baseado nos dados
        let pipelineStage: MedicalPipelineStage;
        let isDefaulting = false;

        // Lógica de determinação do estágio
        if (appointmentData.status === 'completed') {
            if (appointmentData.payment_status === 'pending' || appointmentData.payment_status === 'partial') {
                pipelineStage = 'inadimplente';
                isDefaulting = true;
            } else {
                pipelineStage = 'follow_up';
                isDefaulting = false;
            }
        } else if (appointmentData.status === 'cancelled' || appointmentData.status === 'no_show') {
            return;
        } else {
            if (appointmentData.sinal_amount && appointmentData.sinal_amount > 0) {
                if (appointmentData.sinal_paid) {
                    pipelineStage = 'agendado';
                    isDefaulting = false;
                } else {
                    pipelineStage = 'inadimplente';
                    isDefaulting = true;
                }
            } else {
                pipelineStage = 'agendado';
                isDefaulting = false;
            }
        }

        let existingDeal = null;

        const { data: dealInAgendado } = await supabase
            .from('crm_deals')
            .select('id, stage, user_id')
            .eq('contact_id', contactId)
            .eq('stage', 'agendado')
            .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
            .maybeSingle();

        if (dealInAgendado) {
            existingDeal = dealInAgendado;
        } else {
            const { data: anyActiveDeal } = await supabase
                .from('crm_deals')
                .select('id, stage, user_id')
                .eq('contact_id', contactId)
                .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (anyActiveDeal) {
                existingDeal = anyActiveDeal;
            }
        }

        const dealValue = appointmentData.estimated_value || appointmentData.sinal_amount || 0;

        if (existingDeal) {
            await supabase
                .from('crm_deals')
                .update({
                    stage: pipelineStage,
                    is_defaulting: isDefaulting,
                    value: dealValue,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingDeal.id);
        } else {
            await supabase
                .from('crm_deals')
                .insert({
                    user_id: doctorId,
                    contact_id: contactId,
                    title: appointmentData.title,
                    value: dealValue,
                    stage: pipelineStage,
                    is_defaulting: isDefaulting,
                });
        }
    } catch (error) {
        console.error('[Pipeline] Erro ao atualizar pipeline:', error);
    }
};

/**
 * Verifica se paciente deve ir para "Aguardando Retorno"
 */
export const checkAndMoveToAguardandoRetorno = async (contactId: string): Promise<void> => {
    try {
        const supabase = createClient();
        const { data: completedAppointments, error: appointmentsError } = await supabase
            .from('medical_appointments')
            .select('id, status, payment_status, start_time')
            .eq('contact_id', contactId)
            .eq('status', 'completed')
            .order('start_time', { ascending: false });

        if (appointmentsError || !completedAppointments || completedAppointments.length !== 1) return;

        const lastAppointment = completedAppointments[0];
        if (lastAppointment.payment_status !== 'paid') return;

        const now = new Date().toISOString();
        const { data: futureAppointments, error: futureError } = await supabase
            .from('medical_appointments')
            .select('id')
            .eq('contact_id', contactId)
            .gt('start_time', now)
            .in('status', ['scheduled', 'confirmed', 'in_progress'])
            .limit(1);

        if (futureError || (futureAppointments && futureAppointments.length > 0)) return;

        const { data: deal, error: dealError } = await supabase
            .from('crm_deals')
            .select('id, is_in_treatment, stage')
            .eq('contact_id', contactId)
            .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (dealError || !deal) return;
        if (deal.is_in_treatment === true) return;
        if (deal.stage === 'aguardando_retorno') return;

        await supabase
            .from('crm_deals')
            .update({
                stage: 'aguardando_retorno' as any,
                updated_at: new Date().toISOString(),
            })
            .eq('id', deal.id);

    } catch (error) {
        console.error('[Aguardando Retorno] Erro ao verificar critérios:', error);
    }
};

/**
 * Atualiza deal do contato para estágio "em_tratamento"
 */
export const updateDealToTreatment = async (contactId: string, doctorId: string): Promise<void> => {
    try {
        const supabase = createClient();
        const { data: deal, error: dealError } = await supabase
            .from('crm_deals')
            .select('id')
            .eq('contact_id', contactId)
            .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (dealError) return;

        if (deal) {
            await supabase
                .from('crm_deals')
                .update({
                    stage: 'em_tratamento' as any,
                    is_in_treatment: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', deal.id);
        } else {
            await supabase
                .from('crm_deals')
                .insert({
                    user_id: doctorId,
                    contact_id: contactId,
                    title: 'Paciente em tratamento',
                    stage: 'em_tratamento' as any,
                    is_in_treatment: true,
                });
        }
    } catch (error) {
        console.error('[Em Tratamento] Erro ao atualizar deal:', error);
    }
};

// Fetch appointments with relations
const fetchAppointments = async (
    userId: string,
    filters?: UseMedicalAppointmentsFilters,
    signal?: AbortSignal,
    doctorIds?: string[],
    canViewAll: boolean = false
): Promise<MedicalAppointmentWithRelations[]> => {
    const supabase = createClient();
    let query = supabase
        .from('medical_appointments')
        .select(`
      *,
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type),
      doctor:profiles!medical_appointments_doctor_id_profiles_fk(id, full_name, email)
    `);

    if (doctorIds && doctorIds.length > 0) {
        query = query.in('doctor_id', doctorIds);
    } else if (!canViewAll && userId) {
        query = query.or(`user_id.eq.${userId},doctor_id.eq.${userId}`);
    }

    query = query.order('start_time', { ascending: true });

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

    const { data, error } = await query; // Standard query

    if (error) throw new Error(`Erro ao buscar consultas: ${error.message}`);
    return (data as MedicalAppointmentWithRelations[]) || [];
};

// Create appointment
const createAppointment = async (
    appointmentData: MedicalAppointmentInsert
): Promise<MedicalAppointmentWithRelations> => {
    const supabase = createClient();
    // Validations ommitted for brevity, assume valid input from form

    const { data, error } = await supabase
        .from('medical_appointments')
        .insert({
            ...appointmentData,
            doctor_id: appointmentData.doctor_id || appointmentData.user_id,
            paid_in_advance: appointmentData.paid_in_advance ?? false,
        })
        .select(`
      *,
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
        .single();

    if (error) {
        throw new Error(`Erro ao criar consulta: ${error.message}`);
    }

    await updateDealPipeline(
        appointmentData.contact_id,
        appointmentData.doctor_id || appointmentData.user_id,
        {
            title: appointmentData.title,
            estimated_value: appointmentData.estimated_value,
            sinal_amount: appointmentData.sinal_amount,
            sinal_paid: appointmentData.sinal_paid,
            status: appointmentData.status || 'scheduled',
            payment_status: appointmentData.payment_status || 'pending',
        }
    );

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
    const supabase = createClient();
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
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
        .single();

    if (error) throw new Error(`Erro ao atualizar consulta: ${error.message}`);

    const appointment = data as MedicalAppointmentWithRelations;

    if (appointment.contact_id && (appointment.doctor_id || appointment.user_id)) {
        const shouldUpdatePipeline =
            updates.status !== undefined ||
            updates.payment_status !== undefined ||
            updates.sinal_paid !== undefined ||
            updates.sinal_amount !== undefined;

        if (shouldUpdatePipeline) {
            await updateDealPipeline(
                appointment.contact_id,
                appointment.doctor_id || appointment.user_id,
                {
                    title: appointment.title,
                    estimated_value: appointment.estimated_value,
                    sinal_amount: appointment.sinal_amount,
                    sinal_paid: appointment.sinal_paid,
                    status: appointment.status as AppointmentStatus,
                    payment_status: appointment.payment_status as PaymentStatus,
                }
            );

            if (updates.status === 'completed' && appointment.contact_id) {
                checkAndMoveToAguardandoRetorno(appointment.contact_id).catch((error) => {
                    console.error('[updateAppointment] Erro ao verificar aguardando retorno:', error);
                });
            }
        }
    }

    return appointment;
};

// Delete appointment
const deleteAppointment = async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
        .from('medical_appointments')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Erro ao excluir consulta: ${error.message}`);
};

// Helper para serializar filtros
const serializeFilters = (filters?: UseMedicalAppointmentsFilters): string => {
    if (!filters) return 'no-filters';
    const parts: string[] = [];
    if (filters.startDate) parts.push(`start:${filters.startDate.toISOString()}`);
    if (filters.endDate) parts.push(`end:${filters.endDate.toISOString()}`);
    if (filters.appointmentType && filters.appointmentType !== 'all') parts.push(`type:${filters.appointmentType}`);
    if (filters.status && filters.status !== 'all') parts.push(`status:${filters.status}`);
    if (filters.paymentStatus && filters.paymentStatus !== 'all') parts.push(`payment:${filters.paymentStatus}`);
    if (filters.contactId) parts.push(`contact:${filters.contactId}`);
    if (filters.isSecretaria) parts.push('secretaria:true');
    if (filters.doctorIds && filters.doctorIds.length > 0) parts.push(`doctors:${filters.doctorIds.join(',')}`);
    return parts.length > 0 ? parts.join('|') : 'no-filters';
};

// Hook principal
export function useMedicalAppointments(filters?: UseMedicalAppointmentsFilters) {
    const { user, loading: authLoading } = useAuth();
    const { data: profile } = useUserProfile();
    const isSecretaria = profile?.role === 'secretaria';
    const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const doctorIdsToUse = filters?.doctorIds && filters.doctorIds.length > 0
        ? filters.doctorIds
        : (isSecretaria ? doctorIds : []);

    const queryKey = ['medical-appointments', user?.id, doctorIdsToUse, serializeFilters(filters)];

    useEffect(() => {
        if (user?.id) {
            queryClient.invalidateQueries({
                queryKey: ['medical-appointments'],
                exact: false
            });
        }
    }, [user?.id, queryClient]);

    const canViewAll = isSecretaria || profile?.role === 'admin' || profile?.role === 'dono';

    const {
        data: appointments = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: ({ signal }) => fetchAppointments(
            user?.id || '',
            filters,
            signal,
            doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined,
            canViewAll
        ),
        enabled: !!user?.id && !authLoading && (!isSecretaria || !isLoadingDoctors),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: 1000,
    });

    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
            queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
            queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
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

    const updateMutation = useMutation({
        mutationFn: updateAppointment,
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old: MedicalAppointmentWithRelations[] | undefined) => {
                if (!old) return old;
                return old.map((appt) => (appt.id === id ? { ...appt, ...updates } : appt));
            });
            return { previousData };
        },
        onError: (error: Error, variables, context) => {
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
            queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
            queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
            queryClient.invalidateQueries({ queryKey: ['secretary-sinal-metrics'] });
        },
    });

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

    const markAsCompleted = useMutation({
        mutationFn: async (params: string | { id: string; confirmedPayment?: boolean }) => {
            const id = typeof params === 'string' ? params : params.id;
            const confirmedPayment = typeof params === 'object' ? params.confirmedPayment : undefined;

            const supabase = createClient();

            const { data: appointment, error: fetchError } = await supabase
                .from('medical_appointments')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw new Error(`Erro ao buscar consulta: ${fetchError.message}`);
            if (!appointment) throw new Error('Consulta não encontrada');

            // (Financial Transaction Logic Simplified for Porting - omitted complexity but kept basics if needed later)
            // For now, just marking as completed explicitly.

            return updateAppointment({
                id,
                updates: {
                    status: 'completed',
                    completed_at: new Date().toISOString()
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
            toast({ title: 'Consulta concluída', description: 'Status atualizado com sucesso.' });
        }
    });

    const markAsNoShow = useMutation({
        mutationFn: async (id: string) => {
            return updateAppointment({
                id,
                updates: { status: 'no_show', payment_status: 'cancelled' } // Assuming no show cancels payment expectation
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
            toast({ title: 'Marcado como não compareceu', description: 'Status atualizado.' });
        }
    });

    return {
        appointments,
        isLoading,
        error,
        refetch,
        createAppointment: createMutation,
        updateAppointment: updateMutation,
        deleteAppointment: deleteMutation,
        markAsCompleted,
        markAsNoShow
    };
}
