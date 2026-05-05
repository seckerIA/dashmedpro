import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  force_password_change: boolean | null;
}

const SELECT_FULL =
  'id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, doctor_id, organization_id, onboarding_completed, onboarding_completed_at, specialty, force_password_change';

const SELECT_BASIC =
  'id, email, full_name, role, is_active, avatar_url, created_at, updated_at, invited_by, organization_id, force_password_change';

const SELECT_MINIMAL = 'id, email, full_name, role';

function profileFromJsonRow(row: Record<string, unknown>): Profile | null {
  if (!row || typeof row.id !== 'string') return null;
  return {
    id: row.id,
    email: typeof row.email === 'string' ? row.email : '',
    full_name: row.full_name != null ? String(row.full_name) : null,
    role: row.role != null ? String(row.role) : '',
    is_active: row.is_active !== false && row.is_active !== null ? Boolean(row.is_active) : true,
    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
    created_at: row.created_at != null ? String(row.created_at) : '',
    updated_at: row.updated_at != null ? String(row.updated_at) : '',
    invited_by: row.invited_by != null ? String(row.invited_by) : null,
    doctor_id: row.doctor_id != null ? String(row.doctor_id) : null,
    organization_id: row.organization_id != null ? String(row.organization_id) : null,
    enable_agenda_alerts:
      typeof row.enable_agenda_alerts === 'boolean' ? row.enable_agenda_alerts : true,
    onboarding_completed:
      typeof row.onboarding_completed === 'boolean' ? row.onboarding_completed : null,
    onboarding_completed_at:
      row.onboarding_completed_at != null ? String(row.onboarding_completed_at) : null,
    specialty: row.specialty != null ? String(row.specialty) : null,
    force_password_change:
      typeof row.force_password_change === 'boolean' ? row.force_password_change : null,
  };
}

function isSchemaMismatchError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '42703' || error.code === 'PGRST204') return true;
  const m = error.message ?? '';
  return m.includes('does not exist') || m.includes('column');
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery<Profile | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async ({ signal }): Promise<Profile | null> => {
      if (!user?.id) return null;
      const cacheKey = CacheKeys.userProfile(user.id);

      try {
        const rpcQuery = supabase.rpc('get_my_profile');
        const rpcResult = await supabaseQueryWithTimeout<unknown>(rpcQuery as any, 15000, signal);
        if (!rpcResult.error && rpcResult.data != null && typeof rpcResult.data === 'object') {
          const fromRpc = profileFromJsonRow(rpcResult.data as Record<string, unknown>);
          if (fromRpc) {
            cacheSet(cacheKey, fromRpc, CacheTTL.MEDIUM).catch(() => {});
            console.log('useUserProfile - Profile via get_my_profile():', fromRpc.id);
            return fromRpc;
          }
        }

        const fetchRow = async (columns: string) => {
          const q = supabase.from('profiles').select(columns).eq('id', user.id).maybeSingle();
          return supabaseQueryWithTimeout<Record<string, unknown> | null>(q as any, 15000, signal);
        };

        let { data: profileData, error: profileError } = await fetchRow(SELECT_FULL);

        if (!profileData && isSchemaMismatchError(profileError)) {
          const second = await fetchRow(SELECT_BASIC);
          profileData = second.data as Record<string, unknown> | null;
          profileError = second.error;
        }

        if (!profileData && isSchemaMismatchError(profileError)) {
          const third = await fetchRow(SELECT_MINIMAL);
          profileData = third.data as Record<string, unknown> | null;
          profileError = third.error;
        }

        // maybeSingle: 0 linhas → data null, error null. Qualquer erro restante: log e segue como sem perfil (evita tela morta)
        if (!profileData) {
          if (profileError) {
            console.warn('useUserProfile: perfil não retornado', profileError.code ?? '', profileError.message ?? '');
          }
          return null;
        }

        let enableAgendaAlerts: boolean | null = true;
        try {
          const alertsQ = supabase.from('profiles').select('enable_agenda_alerts').eq('id', user.id).maybeSingle();
          const { data: alertsData, error: alertsError } = await supabaseQueryWithTimeout(alertsQ as any, 8000, signal);
          if (!alertsError && alertsData && typeof alertsData === 'object' && 'enable_agenda_alerts' in alertsData) {
            enableAgendaAlerts = (alertsData as { enable_agenda_alerts?: boolean }).enable_agenda_alerts ?? true;
          }
        } catch {
          // opcional
        }

        const merged = { ...profileData, enable_agenda_alerts: enableAgendaAlerts };
        const result = profileFromJsonRow(merged as Record<string, unknown>);
        if (!result) return null;
        cacheSet(cacheKey, result, CacheTTL.MEDIUM).catch(() => {});
        console.log('useUserProfile - Profile carregado com sucesso:', result.id);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isTimeout = msg.includes('Timeout') || msg.includes('timeout');
        const isAbort = msg.includes('cancelada') || msg.includes('Abort');
        if (isTimeout || isAbort) {
          console.warn('useUserProfile: timeout/abort ao buscar perfil — tratando como sem perfil neste ciclo');
          return null;
        }
        console.error('useUserProfile - Erro:', err);
        throw err;
      }
    },
    enabled: !!user?.id && !authLoading,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return 10 * 60 * 1000;
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
