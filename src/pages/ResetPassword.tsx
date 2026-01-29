import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
const dashmedLogo = '/dashmed-logo.png';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Simple check: if user is on reset-password page, allow reset
    const checkRecoveryMode = async () => {
      // Check URL for errors first (expired token, etc)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      
      // If there's an error in URL (like expired token), show invalid link
      if (error || errorCode === 'otp_expired') {
        setIsRecoveryMode(false);
        return;
      }
      
      // Check URL for recovery token
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      const urlParams = new URLSearchParams(window.location.search);
      const queryType = urlParams.get('type');
      const queryToken = urlParams.get('token');
      
      const hasRecoveryToken = type === 'recovery' || queryType === 'recovery' || accessToken || queryToken;
      
      // Check if user has a session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Simple: If has recovery token OR user is logged in on reset-password page → allow reset
      // User can be logged in - we'll handle logout after password reset
      if (hasRecoveryToken || session) {
        setIsRecoveryMode(true);
        
        // Capture email for later use (if session exists)
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
        return;
      }
      
      // No token and no session = invalid
      setIsRecoveryMode(false);
    };
    
    checkRecoveryMode();

    // Listen for recovery events
    // Note: Do NOT use await inside this callback - causes deadlocks in supabase-js
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && window.location.pathname === '/reset-password')) {
        // Check for errors first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        if (error) {
          setIsRecoveryMode(false);
          return;
        }
        
        setIsRecoveryMode(true);
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao redefinir senha',
          description: error.message,
        });
        return;
      }

      // Check if updateUser created a session automatically
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      if (newSession?.user) {
        // Session was created automatically by updateUser - redirect to dashboard
        toast({
          title: 'Senha redefinida com sucesso!',
          description: 'Redirecionando para o dashboard...',
        });
        navigate('/');
        return;
      }
      
      // No automatic session - need to login manually with captured email
      const emailToUse = userEmail;
      
      if (!emailToUse) {
        // If we don't have email, redirect to login
        toast({
          title: 'Senha redefinida!',
          description: 'Faça login com sua nova senha.',
        });
        navigate('/login');
        return;
      }
      
      // Login with captured email and new password
      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Fazendo login automaticamente...',
      });
      
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });
      
      if (loginError) {
        toast({
          variant: 'destructive',
          title: 'Erro ao fazer login',
          description: 'Senha redefinida, mas houve erro no login automático. Faça login manualmente.',
        });
        navigate('/login');
        return;
      }
      
      // Success - redirect to dashboard
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

  // Check for expired/invalid token errors in URL
  const hashParamsForError = new URLSearchParams(window.location.hash.substring(1));
  const error = hashParamsForError.get('error');
  const errorCode = hashParamsForError.get('error_code');
  const isExpired = errorCode === 'otp_expired' || error === 'access_denied';
  
  if (!isRecoveryMode || isExpired) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <img src={dashmedLogo} alt="DashMed Pro" className="h-16 w-auto mx-auto" />
            <CardTitle className="text-2xl font-bold text-foreground">Link Expirado ou Inválido</CardTitle>
            <CardDescription>
              {isExpired 
                ? 'O link de redefinição de senha expirou. Links de recuperação são válidos por tempo limitado.'
                : 'O link de redefinição de senha é inválido.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Por favor, solicite um novo link de redefinição de senha na página de login.
            </p>
            <Link to="/login">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Login
              </Button>
            </Link>
          </CardContent>
        </Card>
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
                  <CardTitle className="text-2xl font-bold text-foreground">Nova Senha</CardTitle>
                  <CardDescription>
                    Digite sua nova senha abaixo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
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
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
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
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Redefinir Senha
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                    <ArrowLeft className="inline mr-1 h-3 w-3" />
                    Voltar para o Login
                  </Link>
                </div>
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
            Redefina sua senha para continuar acessando a plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
