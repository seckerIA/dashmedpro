import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

const EMPTY_ARRAY: any[] = [];

export interface LinkedDoctor {
  id: string;
  full_name: string | null;
  email: string;
  specialty?: string | null;
}

interface SecretaryDoctorLink {
  id: string;
  secretary_id: string;
  doctor_id: string;
  created_at: string;
  doctor: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

/**
 * Hook para buscar os medicos vinculados a uma secretaria
 * Retorna lista de IDs e dados dos medicos
 */
export function useSecretaryDoctors() {
  const { user } = useAuth();
  const { isSecretaria, isLoading: isLoadingProfile } = useUserProfile();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['secretary-doctors', user?.id],
    queryFn: async () => {
      if (!user?.id) return { doctorIds: [], doctors: [] };

      // Buscar vinculos da secretaria com os dados do medico
      const { data: links, error } = await supabase
        .from('secretary_doctor_links')
        .select(`
          id,
          secretary_id,
          doctor_id,
          created_at,
          doctor:profiles!secretary_doctor_links_doctor_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('secretary_id', user.id);

      if (error) {
        console.error('Erro ao buscar medicos vinculados:', error);
        throw error;
      }

      const doctorIds = links?.map(link => link.doctor_id) || [];
      const doctors: LinkedDoctor[] = links?.map(link => ({
        id: link.doctor_id,
        full_name: (link.doctor as any)?.full_name || null,
        email: (link.doctor as any)?.email || '',
      })).filter(d => d.id) || [];

      return { doctorIds, doctors };
    },
    enabled: !!user?.id && !isLoadingProfile && isSecretaria,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
  });

  return {
    doctorIds: data?.doctorIds || EMPTY_ARRAY,
    doctors: data?.doctors || EMPTY_ARRAY,
    isLoading: isLoading || isLoadingProfile,
    error,
    refetch,
    // Helper para verificar se um medico esta vinculado
    isDoctorLinked: (doctorId: string) => data?.doctorIds.includes(doctorId) || false,
  };
}

/**
 * Hook para admins gerenciarem vinculos de secretarias
 */
export function useSecretaryDoctorLinks() {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  // Buscar todos os vinculos (admin only)
  const { data: allLinks, isLoading, refetch } = useQuery({
    queryKey: ['all-secretary-doctor-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_doctor_links')
        .select(`
          id,
          secretary_id,
          doctor_id,
          created_at,
          secretary:profiles!secretary_doctor_links_secretary_id_fkey (
            id,
            full_name,
            email
          ),
          doctor:profiles!secretary_doctor_links_doctor_id_fkey (
            id,
            full_name,
            email
          )
        `);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 2 * 60 * 1000,
  });

  // Criar vinculo
  const createLink = async (secretaryId: string, doctorId: string) => {
    const { data, error } = await supabase
      .from('secretary_doctor_links')
      .insert({ secretary_id: secretaryId, doctor_id: doctorId })
      .select()
      .single();

    if (error) throw error;
    await refetch();
    return data;
  };

  // Remover vinculo
  const removeLink = async (linkId: string) => {
    const { error } = await supabase
      .from('secretary_doctor_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
    await refetch();
  };

  // Atualizar todos os vinculos de uma secretaria
  const updateSecretaryLinks = async (secretaryId: string, doctorIds: string[]) => {
    // Remover vinculos existentes
    await supabase
      .from('secretary_doctor_links')
      .delete()
      .eq('secretary_id', secretaryId);

    // Criar novos vinculos
    if (doctorIds.length > 0) {
      const links = doctorIds.map(doctorId => ({
        secretary_id: secretaryId,
        doctor_id: doctorId,
      }));

      const { error } = await supabase
        .from('secretary_doctor_links')
        .insert(links);

      if (error) throw error;
    }

    await refetch();
  };

  // Buscar vinculos de uma secretaria especifica
  const getLinksForSecretary = (secretaryId: string) => {
    return allLinks?.filter(link => link.secretary_id === secretaryId) || [];
  };

  return {
    allLinks: allLinks || [],
    isLoading,
    createLink,
    removeLink,
    updateSecretaryLinks,
    getLinksForSecretary,
    refetch,
  };
}
