import { useQuery } from '@tanstack/react-query';
import { supabase, SUPABASE_PROJECT_URL, SUPABASE_PROJECT_REF } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // DEBUG: Verificar URL do Supabase antes de buscar perfil
        console.log('🔍 useUserProfile - Buscando perfil para user.id:', user.id);
        console.log('🔍 useUserProfile - Supabase URL:', SUPABASE_PROJECT_URL);
        console.log('🔍 useUserProfile - Project Ref:', SUPABASE_PROJECT_REF);
        console.log('🔍 useUserProfile - Esperado: https://adzaqkduxnpckbcuqpmg.supabase.co');
        
        // Primeiro, tentar buscar do profiles com colunas específicas para evitar erro 406
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by')
          .eq('id', user.id)
          .single();
        
        // DEBUG: Log do resultado
        console.log('🔍 useUserProfile - Resultado da query:', { profileData, profileError });

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('useUserProfile - erro ao buscar profile:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          
          // Se erro 406, tentar buscar apenas colunas básicas
          if (profileError.code === 'PGRST116' || profileError.message?.includes('406') || profileError.code === '406') {
            const { data: basicData, error: basicError } = await supabase
              .from('profiles')
              .select('id, email, full_name, role')
              .eq('id', user.id)
              .single();
            
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

  return {
    profile,
    isLoading,
    error,
    isAdmin,
    isVendedor,
    isGestorTrafego,
    role: profile?.role,
    refetch,
  };
}