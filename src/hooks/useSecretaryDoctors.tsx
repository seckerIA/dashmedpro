import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

const EMPTY_ARRAY: any[] = [];

export interface LinkedDoctor {
  id: string;
  full_name: string | null;
  email: string;
  specialty?: string | null;
}

/**
 * Hook para buscar os medicos vinculados a uma secretaria
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
    queryFn: async ({ signal }) => {
      if (!user?.id) return { doctorIds: [], doctors: [] };

      console.log('🔍 [useSecretaryDoctors] Buscando médicos vinculados para:', user.id);

      // 1. Buscar IDs dos vínculos com timeout
      const linksQuery = supabase
        .from('secretary_doctor_links')
        .select('doctor_id')
        .eq('secretary_id', user.id);

      const { data: links, error: linkError } = await supabaseQueryWithTimeout(
        linksQuery as any, // This cast is often necessary due to Supabase's Postgrest types not perfectly aligning with generic query functions.
        30000,
        signal
      );

      console.log(`🔍 [useSecretaryDoctors] ${(links as any[])?.length || 0} links brutos encontrados.`);

      if (linkError) {
        console.error('❌ [useSecretaryDoctors] Erro links:', linkError);
        return { doctorIds: [], doctors: [] };
      }

      if (!links || (links as any[]).length === 0) {
        console.warn('⚠️ [useSecretaryDoctors] Nenhum vínculo encontrado na tabela secretary_doctor_links para:', user.id);
        return { doctorIds: [], doctors: [] };
      }

      const doctorIds = (links as any[]).map(l => l.doctor_id);

      // 2. Buscar detalhes dos perfis com timeout
      const profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', doctorIds);

      const { data: doctorsData, error: profileError } = await supabaseQueryWithTimeout(
        profilesQuery as any,
        30000,
        signal
      );

      if (profileError) {
        console.error('❌ [useSecretaryDoctors] Erro perfis:', profileError);
        return { doctorIds, doctors: [] };
      }

      const doctors: LinkedDoctor[] = (doctorsData as any[])?.map(doc => ({
        id: doc.id,
        full_name: doc.full_name,
        email: doc.email,
      })) || [];

      console.log(`✅ [useSecretaryDoctors] ${doctors.length} médicos encontrados.`);
      console.log(`✅ [useSecretaryDoctors] IDs Resolvidos:`, doctorIds);
      console.log(`✅ [useSecretaryDoctors] Perfis Detalhados:`, doctors.length);
      return { doctorIds, doctors };
    },
    enabled: !!user?.id && !isLoadingProfile && isSecretaria,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    doctorIds: data?.doctorIds || EMPTY_ARRAY,
    doctors: data?.doctors || EMPTY_ARRAY,
    isLoading: (isLoading && isSecretaria) || isLoadingProfile,
    error,
    refetch,
    isDoctorLinked: (doctorId: string) => data?.doctorIds.includes(doctorId) || false,
  };
}

/**
 * Hook para admins gerenciarem vinculos de secretarias
 */
export function useSecretaryDoctorLinks() {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  const { data: allLinks, isLoading, refetch } = useQuery({
    queryKey: ['all-secretary-doctor-links'],
    queryFn: async ({ signal }) => {
      const query = supabase
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

      const { data, error } = await supabaseQueryWithTimeout(query as any, 30000, signal);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 2 * 60 * 1000,
  });

  const createLink = async (secretaryId: string, doctorId: string) => {
    const { data, error } = await (supabase
      .from('secretary_doctor_links') as any)
      .insert({ secretary_id: secretaryId, doctor_id: doctorId } as any)
      .select()
      .single();

    if (error) throw error;
    await refetch();
    return data;
  };

  const removeLink = async (linkId: string) => {
    const { error } = await supabase
      .from('secretary_doctor_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
    await refetch();
  };

  const updateSecretaryLinks = async (secretaryId: string, doctorIds: string[]) => {
    await supabase
      .from('secretary_doctor_links')
      .delete()
      .eq('secretary_id', secretaryId);

    if (doctorIds.length > 0) {
      const links = doctorIds.map(doctorId => ({
        secretary_id: secretaryId,
        doctor_id: doctorId,
      }));

      const { error } = await (supabase
        .from('secretary_doctor_links') as any)
        .insert(links as any);

      if (error) throw error;
    }

    await refetch();
  };

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
