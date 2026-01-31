import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase, CURRENT_PROJECT_REF } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, UserPlus, Loader2, RefreshCw, Lock } from 'lucide-react';
const dashmedLogo = '/dashmed-logo.png';

// CONFIGURAÇÃO: Definir como false para reabilitar o registro de contas
const REGISTRATION_DISABLED = true;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // NOTE: Removed automatic cache clearing on mount - this was causing:
  // 1. Unnecessary page reloads when tab focus changed
  // 2. Poor UX with constant "loading" states
  // The clearSupabaseCache() function below is still available for manual use if needed

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingResetEmail(true);

    try {
      // Force localhost in development, use window.location.origin otherwise
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectUrl = isDevelopment
        ? `http://localhost:8080/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar email',
          description: error.message,
        });
        return;
      }

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setForgotPasswordMode(false);
      setForgotPasswordEmail('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  const clearSupabaseCache = () => {
    // Limpar todas as chaves do Supabase do localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.auth.token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Limpar sessão do Supabase
    supabase.auth.signOut();

    toast({
      title: 'Cache limpo',
      description: 'Credenciais antigas foram removidas. Tente fazer login novamente.',
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 DEBUG Login - Tentando login com email:', email);
      console.log('🔍 DEBUG Login - Project Ref esperado:', CURRENT_PROJECT_REF);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro de autenticação:', error);

        // Detectar email não confirmado
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          toast({
            variant: 'destructive',
            title: 'Email não confirmado',
            description: 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada (e spam).',
          });
        }
        // Se erro de credenciais inválidas
        else if (error.message === 'Invalid login credentials' || error.status === 400) {
          toast({
            variant: 'destructive',
            title: 'Credenciais inválidas',
            description: 'Email ou senha incorretos.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no login',
            description: error.message,
          });
        }
        return;
      }

      // Verificar se o usuário existe no perfil após login bem-sucedido
      if (data?.user) {
        console.log('✅ Usuário autenticado:', data.user.email);
        console.log('✅ User ID:', data.user.id);

        // Aguardar um momento para garantir que a sessão foi totalmente estabelecida
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profileData) {
          // Usuário autenticado mas sem perfil = precisa fazer onboarding
          console.log('📝 Perfil não encontrado, redirecionando para onboarding...');
          toast({
            title: 'Bem-vindo!',
            description: 'Complete seu cadastro para continuar.',
          });
          navigate('/onboarding');
          return;
        }
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando para o dashboard...',
      });

      navigate('/');
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const redirectUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080/auth/callback'
        : `${window.location.origin}/auth/callback`;

      console.log('🔐 [Login] Iniciando Google OAuth. Redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ [Login] Erro no Google OAuth:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao iniciar login com Google',
          description: error.message,
        });
        setLoading(false);
      }

      // Não precisa setLoading(false) aqui - usuário será redirecionado para Google
    } catch (error: any) {
      console.error('❌ [Login] Erro inesperado no Google OAuth:', error);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: 'As senhas não coincidem.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        // Detectar se o problema é email não confirmado
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          toast({
            variant: 'destructive',
            title: 'Email não confirmado',
            description: 'Verifique sua caixa de entrada (e spam) para confirmar seu email antes de fazer login. Se não recebeu o email, entre em contato com o administrador.',
          });
        } else if (error.message === 'User already registered') {
          toast({
            variant: 'destructive',
            title: 'Email já cadastrado',
            description: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no cadastro',
            description: error.message,
          });
        }
        return;
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você foi automaticamente logado.',
      });

      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Mode
  if (forgotPasswordMode) {
    return (
      <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
            <Card className="border-0 shadow-none">
              <CardHeader className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  <img src={dashmedLogo} alt="DashMed Pro" className="h-10 w-auto" />
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Recuperar Senha</CardTitle>
                    <CardDescription>
                      Digite seu email para receber o link de recuperação
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendingResetEmail}
                  >
                    {sendingResetEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Enviar Link de Recuperação
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setForgotPasswordMode(false)}
                  >
                    Voltar para o Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="hidden bg-muted lg:flex items-center justify-center p-12 text-center">
          <div className="space-y-4">
            <img src={dashmedLogo} alt="DashMed Pro" className="h-20 w-auto mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">DashMed Pro</h1>
            <p className="text-muted-foreground">
              Recupere o acesso à sua conta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-left space-y-2">
              <div className="flex items-center gap-3">
                <img src={dashmedLogo} alt="DashMed Pro" className="h-10 w-auto" />
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Bem-vindo</CardTitle>
                  <CardDescription>
                    Acesse ou crie sua conta na plataforma
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup" disabled={REGISTRATION_DISABLED}>Cadastro</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="login-password">Senha</Label>
                        <button
                          type="button"
                          onClick={() => setForgotPasswordMode(true)}
                          className="ml-auto inline-block text-sm underline hover:text-primary"
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Sua senha"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      Entrar
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          ou
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Entrar com Google
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  {REGISTRATION_DISABLED ? (
                    <div className="space-y-4 text-center py-8">
                      <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">Cadastro Temporariamente Indisponível</h3>
                      <p className="text-sm text-muted-foreground">
                        O registro de novas contas está temporariamente desabilitado.
                        Entre em contato com o administrador para obter acesso.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome Completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme sua senha"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Criar Conta
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-12 text-center">
        <div className="space-y-4">
          <img src={dashmedLogo} alt="DashMed Pro" className="h-20 w-auto mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">DashMed Pro</h1>
          <p className="text-muted-foreground">
            A plataforma completa para impulsionar o seu negócio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;