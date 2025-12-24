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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:19',message:'useAuth useEffect iniciado',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Verificar se a sessão é do projeto correto
    const validateSession = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:22',message:'validateSession iniciado',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:24',message:'getSession resultado',data:{hasSession:!!session,hasError:!!sessionError,errorMessage:sessionError?.message,userId:session?.user?.id,tokenExpiry:session?.expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (session) {
        // Verificar se o usuário existe no perfil do banco correto
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', session.user.id)
          .single();

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:33',message:'validação perfil resultado',data:{hasProfile:!!profile,hasError:!!error,errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // Se não encontrar perfil, a sessão é inválida (de outro projeto)
        if (error || !profile) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:36',message:'sessão inválida detectada',data:{errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
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
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:54',message:'validateSession concluído',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:60',message:'onAuthStateChange evento',data:{event,hasSession:!!session,userId:session?.user?.id,tokenExpiry:session?.expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Validar sessão quando mudar
        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', session.user.id)
            .single();

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:68',message:'validação perfil no listener',data:{hasProfile:!!profile,hasError:!!error,errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          if (error || !profile) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:71',message:'sessão inválida no listener',data:{errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
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

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:87',message:'cleanup useAuth useEffect',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'signOut iniciado',data:{hasUser:!!user,hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    try {
      // Tentar fazer logout no Supabase
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'chamando supabase.auth.signOut',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { error } = await supabase.auth.signOut();
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'signOut resultado',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Ignorar erro de "session missing" - significa que já não há sessão
      if (error && !error.message.includes('session missing') && !error.message.includes('Session not found')) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'erro em signOut',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Se o erro for sobre sessão faltando, ignorar e continuar
      if (error?.message?.includes('session missing') || error?.message?.includes('Session not found')) {
        console.log('Sessão já estava ausente, continuando com logout...');
      } else {
        console.error('Erro ao fazer logout:', error);
      }
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'limpando estado e localStorage',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Sempre atualizar o estado e limpar dados locais
      setSession(null);
      setUser(null);
      
      // Limpar dados do Supabase no localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'chaves a remover',data:{keysCount:supabaseKeys.length,keys:supabaseKeys},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAuth.tsx:signOut',message:'signOut concluído',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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