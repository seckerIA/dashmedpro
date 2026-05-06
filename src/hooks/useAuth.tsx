import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  orgRole: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to refresh organization data (called after onboarding completes)
  const refreshOrganization = useCallback(async () => {
    if (!user) return;

    try {
      const { data: memberData } = await (supabase
        .from('organization_members' as any) as any)
        .select('role, organization:organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData && (memberData as any).organization) {
        setOrganization((memberData as any).organization as any);
        setOrgRole((memberData as any).role);
        console.log('[useAuth] Organization refreshed successfully');
      }
    } catch (err) {
      console.error('[useAuth] Error refreshing organization:', err);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const uid = currentSession.user.id;
          /** Só colunas que existem no baseline antigo/Lovable — evita 400 ao pedir `is_super_admin`. */
          const prof = await (supabase.from('profiles') as any)
            .select('role, organization_id')
            .eq('id', uid)
            .maybeSingle();
          if (cancelled) return;
          const row = prof.data as { role?: string; organization_id?: string | null } | null;
          setIsSuperAdmin(
            row?.role === 'admin' && (row.organization_id == null || row.organization_id === ''),
          );

          const { data: memberData, error } = await (supabase
            .from('organization_members' as any) as any)
            .select('role, organization:organizations(*)')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          if (cancelled) return;

          if (!error && memberData && (memberData as any).organization) {
            setOrganization((memberData as any).organization as any);
            setOrgRole((memberData as any).role);
          } else {
            console.log('Usuário sem organização vinculada ou erro ao buscar organization_members');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    /** Evita deadlock: getSession competindo com INITIAL_SESSION no mesmo tick (GoTrue + Web Locks). */
    let loadSessionTimer = window.setTimeout(() => void loadSession(), 0);

    /** Se auth travar por rede/cliente, nunca ficar eternamente em “Carregando…”. */
    const safetyRelease = window.setTimeout(() => {
      setLoading((was) => {
        if (was) {
          console.warn('[useAuth] Timeout de segurança: liberando loading após espera pela sessão');
        }
        return false;
      });
    }, 15000);

    // IMPORTANT: Do NOT use await inside onAuthStateChange callback!
    // This causes deadlocks in supabase-js due to Web Locks API.
    // See: https://github.com/supabase/gotrue-js/issues/762
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(async () => {
            try {
              const uid = currentSession.user.id;
              const prof = await (supabase.from('profiles') as any)
                .select('role, organization_id')
                .eq('id', uid)
                .maybeSingle();
              const row = prof.data as { role?: string; organization_id?: string | null } | null;
              setIsSuperAdmin(
                row?.role === 'admin' &&
                  (row.organization_id == null || row.organization_id === ''),
              );

              const { data: memberData } = await (supabase
                .from('organization_members' as any) as any)
                .select('role, organization:organizations(*)')
                .eq('user_id', currentSession.user.id)
                .maybeSingle();

              if (memberData && (memberData as any).organization) {
                setOrganization((memberData as any).organization as any);
                setOrgRole((memberData as any).role);
              } else {
                setOrganization(null);
                setOrgRole(null);
              }
            } catch (err) {
              console.error('[useAuth] Error fetching user data:', err);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setOrganization(null);
          setOrgRole(null);
          setIsSuperAdmin(false);
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      window.clearTimeout(loadSessionTimer);
      window.clearTimeout(safetyRelease);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error && !error.message.includes('session missing') && !error.message.includes('Session not found')) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
    } catch (error: any) {
      if (error?.message?.includes('session missing') || error?.message?.includes('Session not found')) {
        console.log('Sessão já estava ausente, continuando com logout...');
      } else {
        console.error('Erro ao fazer logout:', error);
      }
    } finally {
      setSession(null);
      setUser(null);
      setOrganization(null);
      setOrgRole(null);
      setIsSuperAdmin(false);

      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') || key.includes('supabase')
      );

      supabaseKeys.forEach(key => localStorage.removeItem(key));
    }
  };

  const value = {
    user,
    session,
    organization,
    orgRole,
    isSuperAdmin,
    loading,
    signOut,
    refreshOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
