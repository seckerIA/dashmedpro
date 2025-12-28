import { useQuery } from '@tanstack/react-query';
import { supabase, SUPABASE_PROJECT_URL, SUPABASE_PROJECT_REF } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // Verificar sessão antes da query
        const sessionCheck = await supabase.auth.getSession();

        // Primeiro, tentar buscar do profiles com colunas específicas para evitar erro 406
        const profileQuery = supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by')
          .eq('id', user.id)
          .single();

        const profileResult = await supabaseQueryWithTimeout(profileQuery, 30000);
        const { data: profileData, error: profileError } = profileResult;

        if (profileError && profileError.code !== 'PGRST116') {
          // Se erro 406, tentar buscar apenas colunas básicas
          if (profileError.code === 'PGRST116' || profileError.message?.includes('406') || profileError.code === '406') {
            const basicQuery = supabase
              .from('profiles')
              .select('id, email, full_name, role')
              .eq('id', user.id)
              .single();
            
            const basicResult = await supabaseQueryWithTimeout(basicQuery, 30000);
            const { data: basicData, error: basicError } = basicResult;
            
            if (basicError && basicError.code !== 'PGRST116') {
              throw basicError;
            }
            return basicData;
          }
          throw profileError;
        }

        // Se profile existe mas não tem role, tentar buscar de user_roles como fallback
        if (profileData && !profileData.role) {
          console.log('useUserProfile - Profile sem role, tentando buscar de user_roles');
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (!roleError && roleData) {
            profileData.role = roleData.role;
            console.log('useUserProfile - Role encontrado em user_roles:', roleData.role);
          } else if (roleError) {
            console.warn('useUserProfile - Erro ao buscar role de user_roles:', roleError);
          }
        }

        if (profileData) {
          console.log('useUserProfile - Profile carregado com sucesso:', {
            id: profileData.id,
            email: profileData.email,
            fullName: profileData.full_name,
            role: profileData.role
          });
        }

        return profileData;
      } catch (err: any) {
        console.error('useUserProfile - erro completo:', err);
        throw err;
      }
    },
    enabled: !!user?.id && !authLoading, // Aguardar auth terminar de carregar
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,
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
    isAdmin,
    isVendedor,
    isGestorTrafego,
    isSecretaria,
    isMedico,
    canScheduleForOthers,
    role: profile?.role,
    refetch,
  };
}