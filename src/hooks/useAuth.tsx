import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';
import { sessionManager } from '@/lib/sessionManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  orgRole: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  renewSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Check for Super Admin status first (needed for global redirect)
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', currentSession.user.id)
            .single();

          if (profile?.is_super_admin) {
            setIsSuperAdmin(true);
            // Super Admin doesn't necessarily need a specific organization loaded here,
            // but we might want to load one if they choose to "impersonate".
            // For now, we leave org null or try to load one?
            // Let's assume they might be members of none.
          }

          // Fetch user's organization (only if NOT forcing null, or even if Super Admin is also a member)
          const { data: memberData, error } = await supabase
            .from('organization_members')
            .select('role, organization:organizations(*)')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();

          if (!error && memberData && memberData.organization) {
            setOrganization(memberData.organization as any);
            setOrgRole(memberData.role);
          } else {
            console.log('Usuário sem organização vinculada ou erro ao buscar organization_members');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Check Super Admin on auth change too
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', currentSession.user.id)
            .single();

          if (profile?.is_super_admin) setIsSuperAdmin(true);
          else setIsSuperAdmin(false);

          // Fetch organization on auth change (login)
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role, organization:organizations(*)')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();

          if (memberData && memberData.organization) {
            setOrganization(memberData.organization as any);
            setOrgRole(memberData.role);
          } else {
            setOrganization(null);
            setOrgRole(null);
          }
        } else {
          setOrganization(null);
          setOrgRole(null);
          setIsSuperAdmin(false);
        }

        setLoading(false);
      }
    );

    loadSession();

    return () => {
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

  /**
   * Verifica se está autenticado usando SessionManager
   */
  const checkAuth = async (): Promise<boolean> => {
    return sessionManager.isSessionValid();
  };

  /**
   * Força renovação da sessão
   */
  const renewSession = async (): Promise<boolean> => {
    return sessionManager.forceRenewal();
  };

  const value = {
    user,
    session,
    organization,
    orgRole,
    isSuperAdmin,
    loading,
    signOut,
    checkAuth,
    renewSession,
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
