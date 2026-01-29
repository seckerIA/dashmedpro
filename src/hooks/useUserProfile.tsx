import { useQuery } from '@tanstack/react-query';
import { supabase, SUPABASE_URL, CURRENT_PROJECT_REF } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { supabaseQueryWithTimeout } from '@/utils/supabaseQuery';
import { cacheSet, CacheKeys, CacheTTL } from '@/lib/cache';

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
  organization_id: string | null;
  enable_agenda_alerts: boolean | null;
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
  specialty: string | null;
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async ({ signal }): Promise<Profile | null> => {
      if (!user?.id) return null;
      const cacheKey = CacheKeys.userProfile(user.id);

      try {
        // Buscar perfil com timeout de 15s
        // Nota: enable_agenda_alerts pode não existir se a migration não foi executada
        const profileQuery = supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, doctor_id, organization_id, onboarding_completed, onboarding_completed_at, specialty')
          .eq('id', user.id)
          .single();

        const { data: profileData, error: profileError } = await supabaseQueryWithTimeout(
          profileQuery as any,
          45000, // 45 segundos - mais tempo após idle longo
          signal
        );

        // Se erro 42703 (coluna não existe) ou 406, tentar buscar sem doctor_id
        if (profileError && profileError.code !== 'PGRST116') {
          const isColumnError = profileError.code === '42703' ||
            profileError.message?.includes('does not exist') ||
            profileError.message?.includes('doctor_id');

          if (isColumnError || profileError.code === 'PGRST116' ||
            profileError.message?.includes('406') || profileError.code === '406') {
            // Tentar buscar sem doctor_id mas COM organization_id
            const basicQuery = supabase
              .from('profiles')
              .select('id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, organization_id')
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
              // Adicionar campos faltantes com defaults
              const result = { ...(minimalData as any), doctor_id: undefined, enable_agenda_alerts: true };
              // Salvar no cache
              cacheSet(cacheKey, result, CacheTTL.MEDIUM).catch(() => { });
              return result;
            }
            // Adicionar campos faltantes com defaults
            const result = { ...(basicData as any), doctor_id: undefined, enable_agenda_alerts: true };
            // Salvar no cache
            cacheSet(cacheKey, result, CacheTTL.MEDIUM).catch(() => { });
            return result;
          }
          throw profileError;
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        // Tentar buscar enable_agenda_alerts separadamente (pode não existir se migration não foi executada)
        let enableAgendaAlerts: boolean | null = true; // default true
        try {
          const { data: alertsData, error: alertsError } = await supabase
            .from('profiles')
            .select('enable_agenda_alerts')
            .eq('id', user.id)
            .single();

          if (!alertsError && alertsData && 'enable_agenda_alerts' in alertsData) {
            enableAgendaAlerts = (alertsData as any).enable_agenda_alerts ?? true;
          } else if (alertsError) {
            // Coluna não existe ainda, usar default
            console.log('useUserProfile - enable_agenda_alerts column not found, using default true');
          }
        } catch {
          // Erro inesperado, usar default
          console.log('useUserProfile - enable_agenda_alerts fetch failed, using default true');
        }

        const result = { ...profileData, enable_agenda_alerts: enableAgendaAlerts } as Profile;
        console.log('useUserProfile - Profile carregado com sucesso:', result);
        return result;

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
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return 10 * 60 * 1000; // 10 minutos
    },
    refetchIntervalInBackground: false,
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