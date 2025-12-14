import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      // Ignorar erro de "session missing" - significa que já não há sessão
      if (error && !error.message.includes('session missing') && !error.message.includes('Session not found')) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
    } catch (error: any) {
      // Se o erro for sobre sessão faltando, ignorar e continuar
      if (error?.message?.includes('session missing') || error?.message?.includes('Session not found')) {
        console.log('Sessão já estava ausente, continuando com logout...');
      } else {
        console.error('Erro ao fazer logout:', error);
      }
    } finally {
      // Sempre atualizar o estado e limpar dados locais
      setSession(null);
      setUser(null);
      
      // Limpar dados do Supabase no localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
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