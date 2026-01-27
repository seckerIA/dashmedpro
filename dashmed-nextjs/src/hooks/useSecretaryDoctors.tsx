'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

interface SecretaryDoctorRelation {
    id: string;
    secretary_id: string;
    doctor_id: string;
    created_at: string;
}

export function useSecretaryDoctors() {
    const { user } = useAuth();
    const { data: profile } = useUserProfile();
    const supabase = createClient();

    const isSecretaria = profile?.role === 'secretaria';
    const isMedico = profile?.role === 'medico';

    // Se sou secretaria, busco meus médicos
    // Se sou médico, busco minhas secretárias
    const { data: relations, isLoading } = useQuery({
        queryKey: ['secretary-doctors-relations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            let query = supabase.from('secretary_doctors').select('*');

            if (isSecretaria) {
                query = query.eq('secretary_id', user.id);
            } else if (isMedico) {
                query = query.eq('doctor_id', user.id);
            } else {
                return [];
            }

            const { data, error } = await query;
            if (error) {
                console.error('Erro ao buscar relações secretaria-médico:', error);
                throw error;
            }

            return data as SecretaryDoctorRelation[];
        },
        enabled: !!user?.id && (isSecretaria || isMedico),
        staleTime: 1000 * 60 * 30, // 30 min
    });

    const doctorIds = isSecretaria ? relations?.map(r => r.doctor_id) || [] : [user?.id || ''];
    const secretaryIds = isMedico ? relations?.map(r => r.secretary_id) || [] : [];

    return {
        relations,
        doctorIds,
        secretaryIds,
        isLoading
    };
}
