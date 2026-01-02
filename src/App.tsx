import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { SupabaseProjectValidator } from "./components/SupabaseProjectValidator";
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import CalculadoraSelection from "./pages/CalculadoraSelection";
import CalculadoraROI from "./pages/CalculadoraROI";
import PlaceholderPage from "./pages/PlaceholderPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import TeamManagement from "./pages/TeamManagement";
import Tasks from "./pages/Tasks";
import CRM from "./pages/CRM";
import MedicalCalendar from "./pages/MedicalCalendar";
import Financial from "./pages/Financial";
import FinancialTransactions from "./pages/FinancialTransactions";
import FinancialSinais from "./pages/FinancialSinais";
import SecretaryFinancial from "./pages/SecretaryFinancial";
import TransactionForm from "./components/financial/TransactionForm";
import ProspectingGuide from "./pages/ProspectingGuide";
import Commercial from "./pages/Commercial";
import FollowUps from "./pages/FollowUps";
import Marketing from "./pages/Marketing";
import MedicalRecords from "./pages/MedicalRecords";
import WhatsAppInbox from "./pages/WhatsAppInbox";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import {
  TrendingUp,
  Target,
  PieChart,
  Users,
  Mail,
  FileText,
  BarChart3,
  Settings as SettingsIcon
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Limitar número máximo de retries para evitar loops infinitos
        if (failureCount >= 3) {
          return false;
        }

        // Retry mais agressivo para erros de timeout (retry imediato)
        if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
          return failureCount < 2; // Retry até 2 vezes para timeouts
        }

        // Para outros erros, retry padrão
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: any) => {
        // Retry imediato para timeouts (não esperar delay exponencial)
        if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
          return 500; // 500ms para timeouts (retry rápido)
        }

        // Delay padrão para outros erros
        return Math.min(1000 * 2 ** attemptIndex, 5000); // 1s, 2s, max 5s
      },
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 5 * 60 * 1000, // 5 minutos (anteriormente cacheTime)
      refetchOnWindowFocus: false, // Evitar refetch automático ao focar na janela
      refetchOnMount: false, // Evitar refetch automático ao montar
      refetchOnReconnect: true, // Refetch ao reconectar
      networkMode: 'online',
      // Invalidar cache de queries que falharam múltiplas vezes
      onError: (error: any, query) => {
        if (error?.message?.includes('timeout')) {
          console.error(`❌ Query timeout: ${query.queryKey.join('/')}`);

          // Se a query falhou múltiplas vezes, remover do cache
          const state = query.state;
          if (state.failureCount >= 3) {
            queryClient.removeQueries({ queryKey: query.queryKey });
          }
        }
      },
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      onError: (error: any) => {
        // Log global de erros de mutação
        if (error?.message?.includes('timeout')) {
          console.error('❌ Mutation timeout:', error);
        }
      },
    },
  },
});

// Componente para detectar e cancelar queries travadas
// REFATORADO: Agora renova a sessão ANTES de refazer queries (evita loop infinito)
// Componente para detectar e cancelar queries travadas
// CORRIGIDO: Timeout aumentado e lógica de refresh menos agressiva
const StuckQueryDetector = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchStartTimes = new Map<string, number>();
    let stuckCount = 0;

    // Monitorar queries
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated') {
        const query = event.query;
        const state = query.state;

        // Quando começa a buscar
        if (state.fetchStatus === 'fetching') {
          const queryKey = query.queryKey.join('/');
          if (!fetchStartTimes.has(queryKey)) {
            fetchStartTimes.set(queryKey, Date.now());
          }
        }

        // Quando termina (sucesso, erro ou pausa)
        if (state.fetchStatus === 'idle' || state.fetchStatus === 'paused') {
          const queryKey = query.queryKey.join('/');
          fetchStartTimes.delete(queryKey);

          // Se a query completou com sucesso, reseta contador de problemas
          if (state.status === 'success') {
            stuckCount = 0;
          }
        }
      }
    });

    // Verificação periódica
    const checkInterval = setInterval(async () => {
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      const stuckQueries: any[] = [];
      const now = Date.now();

      for (const query of allQueries) {
        const state = query.state;
        const queryKey = query.queryKey.join('/');

        if (state.fetchStatus === 'fetching') {
          const fetchStartTime = fetchStartTimes.get(queryKey);

          if (fetchStartTime) {
            const timeSinceStart = now - fetchStartTime;

            // AUMENTADO: Timeout de 45s para 90s -> 100s para dar margem aos timeouts de 60s
            // Deve ser maior que o timeout do cliente HTTP (60s) para evitar cancelar queries que estão apenas lentas
            const stuckThreshold = 100000;

            if (timeSinceStart > stuckThreshold) {
              stuckQueries.push(query);
              console.warn(`⚠️ Query considerada travada: ${queryKey} (${Math.round(timeSinceStart / 1000)}s)`);

              // Apenas cancelar a query específica
              queryClient.cancelQueries({ queryKey: query.queryKey });
              fetchStartTimes.delete(queryKey);
            }
          } else {
            // Se estava fetching mas não tinha start time, marca agora
            fetchStartTimes.set(queryKey, now);
          }
        } else {
          // Limpeza preventiva
          fetchStartTimes.delete(queryKey);
        }
      }

      // Lógica de mitigação de problemas sistêmicos
      if (stuckQueries.length > 0) {
        stuckCount += stuckQueries.length;

        // Se detecar MUITAS queries travando consecutivamente (>5), sugere problema de conexão/sessão
        if (stuckCount >= 5) {
          console.warn('⚠️ Múltiplas queries travando. Tentando recuperar estado...');

          // Apenas invalidar queries, não forçar logout/refresh agressivo que causa loop de reload
          queryClient.cancelQueries();
          stuckCount = 0;
        }
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      unsubscribe();
    };
  }, [queryClient]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role Protected Route Component - verifica permissões baseadas em roles
const RoleProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[]
}) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Verificando permissões...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário não tem permissão, redireciona para o dashboard
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/calculadora" element={<CalculadoraSelection />} />
        <Route path="/calculadora-precificacao" element={<Calculadora />} />
        <Route path="/calculadora-roi" element={<CalculadoraROI />} />
        <Route
          path="/equipe"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <TeamManagement />
            </RoleProtectedRoute>
          }
        />
        <Route path="/tarefas" element={<Tasks />} />
        <Route
          path="/marketing"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'vendedor', 'gestor_trafego', 'medico']}>
              <Marketing />
            </RoleProtectedRoute>
          }
        />
        <Route path="/comercial" element={<Commercial />} />
        <Route
          path="/financeiro"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'vendedor', 'gestor_trafego', 'medico']}>
              <Financial />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/financeiro/transacoes"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'vendedor', 'gestor_trafego', 'medico']}>
              <FinancialTransactions />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/financeiro/nova-transacao"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'vendedor', 'gestor_trafego', 'medico']}>
              <TransactionForm />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/financeiro/editar-transacao/:id"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'vendedor', 'gestor_trafego', 'medico']}>
              <TransactionForm />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/financeiro/sinais"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico', 'secretaria']}>
              <FinancialSinais />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/secretaria/financeiro"
          element={
            <RoleProtectedRoute allowedRoles={['secretaria']}>
              <SecretaryFinancial />
            </RoleProtectedRoute>
          }
        />
        <Route path="/crm" element={<CRM />} />
        <Route
          path="/whatsapp"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria']}>
              <WhatsAppInbox />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/whatsapp/settings"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria']}>
              <WhatsAppSettings />
            </RoleProtectedRoute>
          }
        />
        <Route path="/calendar" element={<MedicalCalendar />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route
          path="/prontuarios"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
              <MedicalRecords />
            </RoleProtectedRoute>
          }
        />
        <Route path="/comercial/guia-prospeccao" element={<ProspectingGuide />} />
        <Route
          path="/email-marketing"
          element={
            <PlaceholderPage
              title="E-mail Marketing"
              description="Campanhas de e-mail marketing e automação"
              icon={Mail}
            />
          }
        />
        <Route
          path="/funil-vendas"
          element={
            <PlaceholderPage
              title="Funil de Vendas"
              description="Gestão e otimização do funil de vendas"
              icon={BarChart3}
            />
          }
        />
        <Route
          path="/landing-pages"
          element={
            <PlaceholderPage
              title="Landing Pages"
              description="Criação e gestão de landing pages"
              icon={FileText}
            />
          }
        />
        <Route
          path="/relatorios"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <PlaceholderPage
                title="Relatórios"
                description="Relatórios e análises de performance"
                icon={BarChart3}
              />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={<Settings />}
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="dashmed-theme">
    <QueryClientProvider client={queryClient}>
      <SupabaseProjectValidator>
        <AuthProvider>
          <TooltipProvider>
            <StuckQueryDetector />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SupabaseProjectValidator>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
