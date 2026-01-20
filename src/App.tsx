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
import { CortanaProvider, CortanaOverlay } from "./components/cortana";
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
import Procedimentos from "./pages/Procedimentos";
import Tasks from "./pages/Tasks";
import CRM from "./pages/CRM";
import MedicalCalendar from "./pages/MedicalCalendar";
import Financial from "./pages/Financial";
import FinancialTransactions from "./pages/FinancialTransactions";
import FinancialSinais from "./pages/FinancialSinais";
import FinancialCategories from "./pages/FinancialCategories";
import FinancialRecurring from "./pages/FinancialRecurring";
import FinancialReports from "./pages/FinancialReports";
import FinancialBudgets from "./pages/FinancialBudgets";
import FinancialForecasts from "./pages/FinancialForecasts";
import SecretaryFinancial from "./pages/SecretaryFinancial";
import TransactionForm from "./components/financial/TransactionForm";
import ProspectingGuide from "./pages/ProspectingGuide";
import Commercial from "./pages/Commercial";
import FollowUps from "./pages/FollowUps";
import Marketing from "./pages/Marketing";
import MedicalRecords from "./pages/MedicalRecords";
import WhatsAppInbox from "./pages/WhatsAppInbox";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import InventoryPage from "./pages/Inventory";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import { SuperAdminLayout } from "./components/admin/SuperAdminLayout";
import {
  TrendingUp,
  Target,
  PieChart,
  Users,
  Mail,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  Phone
} from "lucide-react";
import { CallOverlay } from "@/components/voip/CallOverlay";
import { IncomingCallModal } from "@/components/voip/IncomingCallModal";
import CallsPage from "@/pages/Calls";
import VOIPSettings from "@/pages/VOIPSettings";

import { focusManager } from "@tanstack/react-query";
import { checkToken } from "@/integrations/supabase/client";

// Configuração customizada de Foco da Janela
// Cancela queries pendentes e verifica token ANTES de permitir novas queries
focusManager.setEventListener((handleFocus) => {
  if (typeof window !== "undefined" && window.addEventListener) {

    let isProcessing = false;

    const onVisibilityChange = async () => {
      // Ignore if not becoming visible or already processing
      if (document.visibilityState !== 'visible' || isProcessing) return;

      isProcessing = true;
      console.log('👁️ [FocusManager] Tab visível. Cancelando queries pendentes e verificando token...');

      try {
        // STEP 1: Cancel ALL currently fetching queries to prevent stuck state
        queryClient.cancelQueries();

        // STEP 2: Check and refresh token if needed
        // This will force page reload if token expired too long ago
        const isValid = await checkToken();

        if (isValid) {
          console.log('✅ [FocusManager] Token OK. Invalidando queries para refetch limpo.');
          // STEP 3: Invalidate to trigger fresh fetches with valid token
          queryClient.invalidateQueries();
          handleFocus();
        } else {
          console.log('⚠️ [FocusManager] Token inválido. Aguardando redirect...');
          // checkToken will handle redirect/reload
        }
      } catch (e) {
        console.error('❌ [FocusManager] Erro:', e);
        // On error, still allow focus to prevent complete lockup
        handleFocus();
      } finally {
        isProcessing = false;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange, false);
    window.addEventListener("focus", onVisibilityChange, false);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }
  return () => { };
});

// Configuração do QueryClient com tratamento global de timeouts, retries e 401 handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: async (error: any, query) => {
      // Handle 401 Unauthorized errors - trigger token refresh
      if (error?.message?.includes('401') ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('JWT') ||
        error?.message?.includes('invalid_token') ||
        error?.status === 401) {
        console.log('🔒 [QueryCache] Erro 401 detectado. Forçando refresh do token...');
        const isValid = await checkToken();
        if (isValid) {
          // Token refreshed - retry the query automatically
          console.log('🔄 [QueryCache] Token atualizado. Retentando query:', query.queryKey.join('/'));
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
        return;
      }

      // Log timeout errors
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
    onError: async (error: any) => {
      // Handle 401 in mutations too
      if (error?.message?.includes('401') ||
        error?.message?.includes('Unauthorized') ||
        error?.status === 401) {
        console.log('🔒 [MutationCache] Erro 401 em mutation. Forçando refresh...');
        await checkToken();
      }

      if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
        console.error('❌ Mutation timeout:', error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Máximo de 2 retries para fail-fast
        if (failureCount >= 2) return false;

        // Se for timeout, não retenta - fail fast
        if (error?.message?.includes('timeout') || error?.message?.includes('Query timeout')) {
          return false;
        }

        // Se for 401, não retenta aqui (será tratado pelo onError acima)
        if (error?.message?.includes('401') || error?.status === 401) {
          return false;
        }

        return true;
      },
      retryDelay: (attemptIndex) => {
        // Backoff mais rápido para fail-fast
        return Math.min(1000 * 2 ** attemptIndex, 5000);
      },
      staleTime: 5 * 60 * 1000, // 5 minutos - usar cache mais agressivamente
      gcTime: 10 * 60 * 1000, // 10 minutos - manter em cache por mais tempo
      refetchOnWindowFocus: false, // Handled by our custom focusManager
      refetchOnMount: false, // Não refetch se dados estão frescos
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

    const queryCache = queryClient.getQueryCache();

    const unsubscribe = queryCache.subscribe((event) => {
      if (event?.type === 'updated') {
        const query = event.query;
        const state = query.state;

        if (state.fetchStatus === 'fetching') {
          const queryKey = query.queryKey.join('/');
          if (!fetchStartTimes.has(queryKey)) {
            fetchStartTimes.set(queryKey, Date.now());
          }
        }

        // Se query terminou ou pausou (network offline, window hidden), remove timer
        if (state.fetchStatus === 'idle' || state.fetchStatus === 'paused') {
          const queryKey = query.queryKey.join('/');
          fetchStartTimes.delete(queryKey);

          if (state.status === 'success') {
            stuckCount = 0;
          }
        }
      }
    });

    // Monitoramento Periódico
    const checkInterval = setInterval(async () => {
      // Importante: Se a página está oculta ou o QueryClient está pausado, 
      // NÃO aplicamos timeout, pois o navegador pode ter trottled a CPU/Network.
      if (typeof document !== 'undefined' && document.hidden) {
        fetchStartTimes.clear(); // Limpa para evitar falso-positivo ao acordar
        return;
      }
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        return;
      }

      const allQueries = queryCache.getAll();
      const stuckQueries: any[] = [];
      const now = Date.now();

      for (const query of allQueries) {
        const queryKey = query.queryKey.join('/');
        const state = query.state;

        // Só considera queries ATIVAS (fetching)
        if (state.fetchStatus === 'fetching') {

          let fetchStartTime = fetchStartTimes.get(queryKey);
          if (!fetchStartTime) {
            fetchStartTime = now;
            fetchStartTimes.set(queryKey, now);
          }

          const timeSinceStart = now - fetchStartTime;

          // Timeout de detecção ajustado para 20s (tolerante a redes instáveis)
          const stuckThreshold = 20000;

          if (timeSinceStart > stuckThreshold) {
            stuckQueries.push(query);
            const queryKeyStr = query.queryKey.join('/');
            console.warn(`⚠️ [StuckQueryDetector] Cancelando query travada (>20s): ${queryKeyStr}`);

            // Forçar cancelamento - isso deve disparar o fallback/erro da query
            queryClient.cancelQueries({ queryKey: query.queryKey });
            fetchStartTimes.delete(queryKeyStr);
          }
        } else {
          // Se não está fetching, remove do tracking
          fetchStartTimes.delete(queryKey);
        }
      }

      // Reset global se muitas queries estiverem travando (sinal de problema sistêmico ou rede caindo)
      if (stuckQueries.length > 0) {
        stuckCount += stuckQueries.length;
        if (stuckCount >= 3) {
          console.warn('⚠️ Múltiplas queries travando. Resetando queries e limpando tracking...');
          queryClient.cancelQueries();
          fetchStartTimes.clear();
          stuckCount = 0;
        }
      }
    }, 5000); // Check every 5 seconds

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
  const { user, loading, isSuperAdmin } = useAuth();

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

  // Super Admin Redirection Logic - Use Custom Layout
  if (isSuperAdmin) {
    return (
      <SuperAdminLayout>
        <Routes>
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/*" element={<SuperAdminDashboard />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </SuperAdminLayout>
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
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <TeamManagement />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/procedimentos"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <Procedimentos />
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
            path="/financeiro/categorias"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <FinancialCategories />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/financeiro/recorrencias"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <FinancialRecurring />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/financeiro/relatorios"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <FinancialReports />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/financeiro/orcamentos"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <FinancialBudgets />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/financeiro/previsoes"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico']}>
                <FinancialForecasts />
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
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria', 'medico']}>
                <WhatsAppInbox />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/settings"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria', 'medico']}>
                <WhatsAppSettings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/calls"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria', 'medico', 'vendedor']}>
                <CallsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/voip/settings"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'dono', 'secretaria', 'medico']}>
                <VOIPSettings />
              </RoleProtectedRoute>
            }
          />
          <Route path="/calendar" element={<MedicalCalendar />} />
          <Route path="/inventory" element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono', 'medico', 'secretaria']}>
              <InventoryPage />
            </RoleProtectedRoute>
          } />
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
      <CortanaOverlay />

      {/* VOIP Components */}
      <CallOverlay />
      <IncomingCallModal />
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
