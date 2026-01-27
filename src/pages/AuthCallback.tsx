/**
 * AuthCallback - Processa callback do OAuth (Google, etc.)
 *
 * Esta página é acionada após o usuário autorizar no provedor OAuth.
 * Responsável por:
 * 1. Verificar se a sessão foi criada pelo Supabase
 * 2. Garantir que o perfil existe (create-on-signup trigger)
 * 3. Bloquear novos usuários (modo "Apenas Login")
 * 4. Redirecionar para dashboard ou página de erro
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import dashmedLogo from '@/assets/dashmed-logo.png';

// Lista de emails permitidos (whitelisted) para login via Google
// Se vazio, BLOQUEIA todos os novos usuários
const ALLOWED_EMAILS: string[] = [];

// Lista de domínios permitidos (ex: '@seudominio.com')
// Se vazio, não permite domínios
const ALLOWED_DOMAINS: string[] = [];

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🔐 [AuthCallback] Processando callback OAuth...');

        // 1. Aguardar um momento para Supabase processar hash na URL
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Verificar se a sessão foi criada
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ [AuthCallback] Erro ao obter sessão:', sessionError);
          setStatus('error');
          setErrorMessage('Erro ao processar autenticação. Tente novamente.');

          toast({
            variant: 'destructive',
            title: 'Erro na autenticação',
            description: sessionError.message,
          });

          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!session || !session.user) {
          console.error('❌ [AuthCallback] Sessão não encontrada após callback');
          setStatus('error');
          setErrorMessage('Não foi possível autenticar. Redirecionando...');

          toast({
            variant: 'destructive',
            title: 'Sessão não encontrada',
            description: 'Tente fazer login novamente.',
          });

          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const user = session.user;
        console.log('✅ [AuthCallback] Sessão criada:', user.email);

        // 3. MODO "APENAS LOGIN" - Verificar se usuário já existe
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, is_super_admin')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Erro diferente de "not found"
          console.error('❌ [AuthCallback] Erro ao buscar perfil:', profileError);
          setStatus('error');
          setErrorMessage('Erro ao verificar perfil. Entre em contato com o administrador.');

          toast({
            variant: 'destructive',
            title: 'Erro no perfil',
            description: profileError.message,
          });

          // Fazer logout e redirecionar
          await supabase.auth.signOut();
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // 4. BLOQUEAR novos usuários (perfil não existe)
        if (!existingProfile) {
          console.warn('⚠️ [AuthCallback] Novo usuário tentou fazer login via Google:', user.email);

          // Verificar whitelist de emails
          const isEmailAllowed = ALLOWED_EMAILS.includes(user.email || '');

          // Verificar whitelist de domínios
          const userDomain = user.email?.split('@')[1];
          const isDomainAllowed = userDomain && ALLOWED_DOMAINS.some(domain =>
            domain.startsWith('@') ? userDomain === domain.slice(1) : userDomain === domain
          );

          if (!isEmailAllowed && !isDomainAllowed) {
            setStatus('error');
            setErrorMessage('Acesso negado. Seu email não está cadastrado no sistema. Entre em contato com o administrador.');

            toast({
              variant: 'destructive',
              title: 'Acesso Negado',
              description: 'Apenas usuários já cadastrados podem fazer login com Google.',
              duration: 6000,
            });

            // Fazer logout do Supabase
            await supabase.auth.signOut();

            setTimeout(() => navigate('/login'), 4000);
            return;
          }

          // Se passou pela whitelist, criar perfil básico
          console.log('✅ [AuthCallback] Email permitido, criando perfil...');

          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
              role: 'medico', // Role padrão (pode ser ajustado pelo admin depois)
              avatar_url: user.user_metadata?.avatar_url || null,
            });

          if (createError) {
            console.error('❌ [AuthCallback] Erro ao criar perfil:', createError);
            setStatus('error');
            setErrorMessage('Erro ao criar perfil. Entre em contato com o administrador.');

            toast({
              variant: 'destructive',
              title: 'Erro ao criar perfil',
              description: createError.message,
            });

            await supabase.auth.signOut();
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          console.log('✅ [AuthCallback] Perfil criado com sucesso');
        } else {
          console.log('✅ [AuthCallback] Perfil existente encontrado:', existingProfile.email);
        }

        // 5. Login bem-sucedido
        setStatus('success');

        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${existingProfile?.full_name || user.user_metadata?.name || user.email}!`,
        });

        // 6. Redirecionar para dashboard
        setTimeout(() => {
          if (existingProfile?.is_super_admin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);

      } catch (error: any) {
        console.error('❌ [AuthCallback] Erro inesperado:', error);
        setStatus('error');
        setErrorMessage('Erro inesperado durante autenticação.');

        toast({
          variant: 'destructive',
          title: 'Erro inesperado',
          description: error?.message || 'Tente novamente.',
        });

        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [navigate, toast]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto max-w-md w-full px-6 py-12 text-center space-y-6">
        <img src={dashmedLogo} alt="DashMed Pro Logo" className="w-16 h-16 mx-auto" />

        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Processando autenticação...</h1>
            <p className="text-muted-foreground">Aguarde enquanto validamos seus dados.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Autenticação bem-sucedida!</h1>
            <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Erro na autenticação</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Você será redirecionado para a página de login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
