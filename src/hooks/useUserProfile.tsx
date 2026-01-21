import { useQuery } from '@tanstack/react-query';
import { supabase, SUPABASE_URL, CURRENT_PROJECT_REF } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  invited_by: string | null;
  doctor_id: string | null;
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async ({ signal }): Promise<Profile | null> => {
      if (!user?.id) return null;

      try {
        // Buscar perfil com timeout de 15s
        const profileQuery = supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, doctor_id')
          .eq('id', user.id)
          .single();

        const { data: profileData, error: profileError } = await supabaseQueryWithTimeout(
          profileQuery as any,
          15000, // 15 segundos
          signal
        );

        if (profileError) {
          console.error('useUserProfile - Erro ao buscar perfil:', profileError);
          throw profileError;
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        console.log('useUserProfile - Profile carregado com sucesso:', profileData);
        return profileData as Profile;

      } catch (err: any) {
        console.error('useUserProfile - Erro:', err);
        throw err;
      }
    },
    enabled: !!user?.id && !authLoading, // Aguardar auth terminar de carregar
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos para idle longo
    refetchInterval: 5 * 60 * 1000, // Refresh automático a cada 5 min
    refetchIntervalInBackground: false, // Pausa quando aba não está ativa
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';
  const isVendedor = profile?.role === 'vendedor';
  const isGestorTrafego = profile?.role === 'gestor_trafego';
  const isSecretaria = profile?.role === 'secretaria';
  const isMedico = profile?.role === 'medico';
  const canScheduleForOthers = isAdmin || isSecretaria;

  return {
    profile,
    isLoading,
    error,
    refetch,
    isAdmin,
    isVendedor,
    isGestorTrafego,
    isSecretaria,
    isMedico,
    canScheduleForOthers,
  };
}