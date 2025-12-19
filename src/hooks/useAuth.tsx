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
    // Verificar se a sessão é do projeto correto
    const validateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Verificar se o usuário existe no perfil do banco correto
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', session.user.id)
          .single();

        // Se não encontrar perfil, a sessão é inválida (de outro projeto)
        if (error || !profile) {
          console.warn('Sessão inválida: usuário não encontrado no banco atual. Limpando sessão...');
          await supabase.auth.signOut();
          // Limpar localStorage
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Validar sessão quando mudar
        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', session.user.id)
            .single();

          if (error || !profile) {
            console.warn('Sessão inválida detectada. Limpando...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Validar sessão inicial
    validateSession();

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