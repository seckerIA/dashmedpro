import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

export interface LinkedProcedure {
    id: string;
    name: string;
    price: number;
    category: string;
    duration_minutes: number;
    user_id: string;
    doctor_name?: string;
}

export function useLinkedDoctorProcedures() {
    const { user } = useAuth();
    const { doctorIds: linkedDoctorIds, doctors } = useSecretaryDoctors();

    // Se for médico, busca seus próprios procedimentos.
    // Se for secretaria, busca dos médicos vinculados.
    // Se a lista de linkedDoctorIds estiver vazia (e for secretaria), não busca nada.

    const targetUserIds = user?.id ? [user.id, ...(linkedDoctorIds || [])] : [];

    const { data: procedures, isLoading, error } = useQuery({
        queryKey: ['linked-procedures', user?.id, linkedDoctorIds],
        queryFn: async () => {
            if (!user?.id) return [];
            if (targetUserIds.length === 0) return [];

            const { data, error } = await supabaseQueryWithTimeout(
                (supabase
                    .from('commercial_procedures' as any)
                    .select('id, name, price, category, duration_minutes, user_id')
                    .in('user_id', targetUserIds)
                    .eq('is_active', true)
                    .order('name')) as any,
                30000
            );

            if (error) {
                console.error('Erro ao buscar procedimentos vinculados:', error);
                throw error;
            }

            // Enriquecer com nome do médico
            const proceduresWithDoctorName = (data as any[])?.map(proc => {
                let doctorName = 'Você';
                if (proc.user_id !== user.id) {
                    const doc = doctors.find(d => d.id === proc.user_id);
                    doctorName = doc?.full_name || 'Médico Desconhecido';
                }
                return {
                    ...proc,
                    doctor_name: doctorName,
                };
            });

            return proceduresWithDoctorName as LinkedProcedure[];
        },
        enabled: !!user?.id && targetUserIds.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    return {
        procedures: procedures || [],
        isLoading,
        error,
    };
}
