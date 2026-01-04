import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { SupabaseProjectValidator } from "./components/SupabaseProjectValidator";
import { CortanaProvider, CortanaButton, CortanaOverlay } from "./components/cortana";
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

// Configuração do QueryClient com tratamento global de timeouts e retries resilientes
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Log global de erros de query
      if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
        console.error(`❌ Query timeout: ${query.queryKey.join('/')}`);

        // Se a query falhou múltiplas vezes, removemos do cache para evitar estados inconsistentes
        const failureCount = (query.state as any).failureCount || 0;
        if (failureCount >= 2) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
        console.error('❌ Mutation timeout:', error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Máximo de 2 tentativas (original + 1 retry) para evitar sobrecarga
        if (failureCount >= 2) return false;

        // Se for timeout, tentamos apenas uma vez com delay longo
        if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
          return failureCount < 1;
        }

        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponencial para dar tempo ao servidor/banco de se recuperar
        return Math.min(1000 * 2 ** attemptIndex, 10000);
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Componente para detectar e cancelar queries travadas
const StuckQueryDetector = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchStartTimes = new Map<string, number>();
    let stuckCount = 0;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated') {
        const query = event.query;
        const state = query.state;

        if (state.fetchStatus === 'fetching') {
          const queryKey = query.queryKey.join('/');
          if (!fetchStartTimes.has(queryKey)) {
            fetchStartTimes.set(queryKey, Date.now());
          }
        }

        if (state.fetchStatus === 'idle' || state.fetchStatus === 'paused') {
          const queryKey = query.queryKey.join('/');
          fetchStartTimes.delete(queryKey);

          if (state.status === 'success') {
            stuckCount = 0;
          }
        }
      }
    });

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
            // Timeout de detecção aumentado para 180s (deve ser maior que o timeout de 60s/90s do fetch)
            const stuckThreshold = 180000;

            if (timeSinceStart > stuckThreshold) {
              stuckQueries.push(query);
              const queryKeyStr = query.queryKey.join('/');
              console.warn(`⚠️ [StuckQueryDetector] Cancelando query travada: ${queryKeyStr} (${Math.round(timeSinceStart / 1000)}s)`);
              queryClient.cancelQueries({ queryKey: query.queryKey });
              fetchStartTimes.delete(queryKeyStr);
            }
          } else {
            fetchStartTimes.set(queryKey, now);
          }
        } else {
          fetchStartTimes.delete(queryKey);
        }
      }

      if (stuckQueries.length > 0) {
        stuckCount += stuckQueries.length;
        if (stuckCount >= 5) {
          console.warn('⚠️ Múltiplas queries travando. Tentando recuperar estado...');
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
        <div className="text-center text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role Protected Route Component
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
        <div className="text-center text-muted-foreground animate-pulse">Verificando permissões...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground animate-pulse">Carregando aplicação...</div>
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
    <CortanaProvider>
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
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>

      {/* Cortana - Assistente de Voz IA */}
      <CortanaButton />
      <CortanaOverlay />
    </CortanaProvider>
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
