import { useQuery } from '@tanstack/react-query';
import { supabase, SUPABASE_PROJECT_URL, SUPABASE_PROJECT_REF } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache';

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const cacheKey = CacheKeys.userProfile(user.id);

      // 1. Tentar buscar do cache Redis primeiro
      try {
        const cachedProfile = await cacheGet<any>(cacheKey);
        if (cachedProfile) {
          console.log('[useUserProfile] Cache HIT');
          return cachedProfile;
        }
        console.log('[useUserProfile] Cache MISS');
      } catch (cacheErr) {
        console.warn('[useUserProfile] Cache read error:', cacheErr);
      }

      // 2. Cache miss - buscar do Supabase
      try {
        // Verificar sessão antes da query
        const sessionCheck = await supabase.auth.getSession();

        // Primeiro, tentar buscar do profiles com colunas específicas para evitar erro 406
        const profileQuery = supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, doctor_id')
          .eq('id', user.id)
          .single();

        const profileResult = await supabaseQueryWithTimeout(profileQuery as any, undefined);
        const { data: profileData, error: profileError } = profileResult;

        // Se erro 42703 (coluna não existe) ou 406, tentar buscar sem doctor_id
        if (profileError && profileError.code !== 'PGRST116') {
          const isColumnError = profileError.code === '42703' ||
            profileError.message?.includes('does not exist') ||
            profileError.message?.includes('doctor_id');

          if (isColumnError || profileError.code === 'PGRST116' ||
            profileError.message?.includes('406') || profileError.code === '406') {
            // Tentar buscar sem doctor_id (coluna pode não existir ainda)
            const basicQuery = supabase
              .from('profiles')
              .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by')
              .eq('id', user.id)
              .single();

            const basicResult = await supabaseQueryWithTimeout(basicQuery as any, undefined);
            const { data: basicData, error: basicError } = basicResult;

            if (basicError && basicError.code !== 'PGRST116') {
              // Se ainda falhar, tentar apenas colunas essenciais
              const minimalQuery = supabase
                .from('profiles')
                .select('id, email, full_name, role')
                .eq('id', user.id)
                .single();

              const minimalResult = await supabaseQueryWithTimeout(minimalQuery as any, undefined);
              const { data: minimalData, error: minimalError } = minimalResult;

              if (minimalError && minimalError.code !== 'PGRST116') {
                throw minimalError;
              }
              // Adicionar doctor_id como undefined se não existir
              const result = { ...(minimalData as any), doctor_id: undefined };
              // Salvar no cache
              cacheSet(cacheKey, result, CacheTTL.MEDIUM).catch(() => { });
              return result;
            }
            // Adicionar doctor_id como undefined se não existir
            const result = { ...(basicData as any), doctor_id: undefined };
            // Salvar no cache
            cacheSet(cacheKey, result, CacheTTL.MEDIUM).catch(() => { });
            return result;
          }
          throw profileError;
        }

        // Se profile existe mas não tem role, tentar buscar de user_roles como fallback
        if (profileData && !(profileData as any).role) {
          console.log('useUserProfile - Profile sem role, tentando buscar de user_roles');
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (!roleError && roleData) {
            (profileData as any).role = roleData.role;
            console.log('useUserProfile - Role encontrado em user_roles:', roleData.role);
          } else if (roleError) {
            console.warn('useUserProfile - Erro ao buscar role de user_roles:', roleError);
          }
        }

        if (profileData) {
          // Garantir que doctor_id existe (pode ser undefined se coluna não existir)
          const profileWithDoctorId: any = {
            ...(profileData as any),
            doctor_id: (profileData as any).doctor_id ?? undefined
          };

          console.log('useUserProfile - Profile carregado com sucesso:', {
            id: profileWithDoctorId.id,
            email: profileWithDoctorId.email,
            fullName: profileWithDoctorId.full_name,
            role: profileWithDoctorId.role,
            doctor_id: profileWithDoctorId.doctor_id
          });

          // 3. Salvar no cache Redis (fire-and-forget)
          cacheSet(cacheKey, profileWithDoctorId, CacheTTL.MEDIUM).catch(() => { });

          return profileWithDoctorId;
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