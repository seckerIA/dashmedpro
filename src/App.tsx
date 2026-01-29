import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { SupabaseProjectValidator } from "./components/SupabaseProjectValidator";
import { CortanaProvider, CortanaOverlay } from "./components/cortana";
import { initHeartbeatRecovery, isPostRecoveryMode } from "@/lib/heartbeatRecovery";

// Componente para inicializar o Heartbeat de recuperação
// Componente para inicializar o Heartbeat de recuperação
const HeartbeatInitializer = () => {
  const { user } = useAuth();
  const cleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    // Só inicializa se houver usuário logado
    if (!user) {
      // Se deslogou, parar o heartbeat
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Evitar inicialização dupla
    if (cleanupRef.current) {
      return;
    }

    // Inicializar heartbeat
    import('@/integrations/supabase/client').then(({ supabase }) => {
      cleanupRef.current = initHeartbeatRecovery(queryClient, supabase);
    });

    // Cleanup no unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [user?.id]); // Usar user.id para evitar re-renders desnecessários

  return null;
};
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import CalculadoraSelection from "./pages/CalculadoraSelection";
import CalculadoraROI from "./pages/CalculadoraROI";
import PlaceholderPage from "./pages/PlaceholderPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
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
import AdminClinics from "./pages/admin/AdminClinics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMetrics from "./pages/admin/AdminMetrics";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminDatabase from "./pages/admin/AdminDatabase";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminSettings from "./pages/admin/AdminSettings";
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
import { checkToken, supabase, wasRecentlyAuthenticated } from "@/integrations/supabase/client";
import { recoverStuckQueries } from "@/lib/queryUtils";

// Configuração customizada de Foco da Janela (não-bloqueante mas segura)
// Configuração customizada de Foco da Janela (não-bloqueante mas segura)
focusManager.setEventListener((handleFocus) => {
  if (typeof window === "undefined") return () => { };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [App] Tab visível');

      // Resetar fetch tracking SEMPRE
      import("@/lib/queryUtils").then(({ resetFetchTracking }) => {
        resetFetchTracking();
      }).catch(() => { });

      // Notificar TanStack Query
      handleFocus();
    }
  };

  const onFocus = () => {
    // Backup: algumas extensões bloqueiam visibilitychange
    import("@/lib/queryUtils").then(({ resetFetchTracking }) => {
      resetFetchTracking();
    }).catch(() => { });
    handleFocus();
  };

  const onOnline = () => {
    console.log('🌐 [App] Online');
    import("@/lib/queryUtils").then(({ resetFetchTracking }) => {
      resetFetchTracking();
    }).catch(() => { });
    handleFocus();
  };

  document.addEventListener("visibilitychange", onVisibilityChange, false);
  window.addEventListener("focus", onFocus, false);
  window.addEventListener("online", onOnline, false);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
  };
});

// Configuração do QueryClient com tratamento global de timeouts, retries e 401 handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onSuccess: () => {
      // Resetar contador de timeouts quando uma query tem sucesso
      (window as any).__consecutiveTimeouts = 0;
    },
    onError: async (error: any, query) => {
      const errorMsg = error?.message || String(error);

      // Detectar erros de autenticação
      const isAuthError =
        errorMsg.includes('401') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('JWT') ||
        errorMsg.includes('invalid_token') ||
        errorMsg.includes('Refresh Token') ||  // <-- NOVO
        errorMsg.includes('Invalid Refresh Token') ||  // <-- NOVO
        error?.status === 401;

      if (isAuthError) {
        console.log('🔒 [QueryCache] Erro de autenticação:', errorMsg.substring(0, 50));

        // Importar supabase e tentar refresh
        const { supabase, checkToken } = await import('@/integrations/supabase/client');

        // Se for erro de refresh token, fazer logout
        if (errorMsg.includes('Refresh Token') || errorMsg.includes('Invalid Refresh Token')) {
          console.log('🚪 [QueryCache] Refresh token inválido - fazendo logout');
          await supabase.auth.signOut();
          window.location.href = '/login';
          return;
        }

        // Tentar renovar token
        const isValid = await checkToken();
        if (isValid) {
          console.log('🔄 [QueryCache] Token renovado, retentando query');
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
        return;
      }

      // Log timeout errors e detectar conexão morta
      if (errorMsg.includes('timeout') || errorMsg.includes('Query timeout')) {
        console.error(`❌ Query timeout: ${query.queryKey.slice(0, 2).join('/')}`);

        // Resetar query travada
        queryClient.resetQueries({ queryKey: query.queryKey });

        // Contar timeouts consecutivos para detectar conexão morta
        const timeoutCount = ((window as any).__consecutiveTimeouts || 0) + 1;
        (window as any).__consecutiveTimeouts = timeoutCount;
        (window as any).__lastTimeoutAt = Date.now();

        // Se muitos timeouts consecutivos, conexão pode estar morta
        if (timeoutCount >= 3) {
          console.error('🔴 [QueryClient] Múltiplos timeouts detectados - conexão pode estar morta');

          // Mostrar toast sugerindo reload
          import('@/components/ui/use-toast').then(({ toast }) => {
            toast({
              title: 'Conexão instável',
              description: 'Problemas de conexão detectados. Recarregue a página se os dados não carregarem.',
              variant: 'destructive',
              duration: 10000,
            });
          }).catch(() => { });

          // Resetar contador após mostrar toast
          (window as any).__consecutiveTimeouts = 0;
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
        const errorMsg = error?.message?.toLowerCase() || '';
        const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('excedido');

        // POST-RECOVERY MODE: permitir até 3 retries rápidos para timeout
        // Isso permite queries se recuperarem após idle longo
        if (isTimeout && isPostRecoveryMode() && failureCount < 3) {
          console.log(`🔄 [QueryClient] Retry #${failureCount + 1} (post-recovery timeout)`);
          return true;
        }

        // Se for timeout FORA do post-recovery, NÃO retenta
        // Isso evita loops infinitos quando extensões bloqueiam requests
        if (isTimeout) {
          console.warn('🚫 [QueryClient] Timeout detectado, não fazendo retry');
          return false;
        }

        // Se for 401, não retenta aqui (será tratado pelo onError acima)
        if (errorMsg.includes('401') || error?.status === 401) {
          return false;
        }

        // Se for erro de extensão, NÃO retenta mais - apenas falha
        // Isso evita retry × retry = loop infinito
        if (errorMsg.includes('message channel closed') ||
          errorMsg.includes('extension context')) {
          console.warn('🚫 [QueryClient] Erro de extensão detectado, não fazendo retry');
          return false;
        }

        // Máximo de 1 retry para outros erros (era 2)
        if (failureCount >= 1) return false;

        return true;
      },
      retryDelay: (attemptIndex) => {
        // POST-RECOVERY MODE: retry mais rápido (500ms, 1s, 1.5s)
        if (isPostRecoveryMode()) {
          return Math.min(500 * (attemptIndex + 1), 2000);
        }
        // Normal: backoff mais rápido para fail-fast
        return Math.min(500 * 2 ** attemptIndex, 3000);
      },
      staleTime: 5 * 60 * 1000, // 5 minutos (era 10min) - dados mais frescos
      gcTime: 15 * 60 * 1000, // 15 minutos (era 30min) - menos memória
      refetchOnWindowFocus: false, // Handled by our custom focusManager
      refetchOnMount: false, // Respeitar cache - individual hooks podem override
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Usar cache imediato enquanto busca (era 'online')
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
    },
  },
});



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

// Route Change Handler - Gracefully handles navigation and data refresh
const RouteChangeHandler = ({ queryClient }: { queryClient: QueryClient }) => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = React.useState(location.pathname);

  React.useEffect(() => {
    if (location.pathname !== prevLocation) {
      // Get idle time from idleDetector
      const now = Date.now();
      const lastActivity = (window as any).lastActivityTime || now;
      const currentIdleTime = now - lastActivity;

      // CRITICAL FIX: Use the stored "long idle" duration if it exists
      // This handles the case where user moves mouse (resetting currentIdle) 
      // just before clicking a link.
      const lastLongIdle = (window as any).lastLongIdleDuration || 0;
      const effectiveIdleTime = Math.max(currentIdleTime, lastLongIdle);

      const idleMinutes = Math.floor(effectiveIdleTime / 60000);
      const idleSeconds = Math.floor(effectiveIdleTime / 1000);

      console.log(`🔄 [RouteChange] ${prevLocation} → ${location.pathname}. Idle: ${idleMinutes}m ${idleSeconds % 60}s (Effective)`);

      // ALWAYS reset fetch slots on navigation to prevent slot leaks from stuck queries
      import("@/lib/queryUtils").then(({ resetFetchTracking }) => {
        resetFetchTracking();
        console.log('🔓 [RouteChange] Fetch slots resetados');
      }).catch(() => { });

      // If idle for more than 30 seconds, recover stuck queries (not cancel all)
      if (effectiveIdleTime > 30000) {
        console.log('🧹 [RouteChange] Verificando queries travadas após idle...');

        // Only cancel queries that are actually stuck (>45s fetching)
        // Instead of cancelling ALL queries indiscriminately
        recoverStuckQueries(queryClient, 45000);

        // Reset persistent idle state so it doesn't trigger again immediately
        (window as any).lastLongIdleDuration = 0;

        // CRITICAL v7.1: Activate post-recovery mode for navigation after idle
        // This handles the case where user stays in same tab but doesn't interact,
        // so visibilitychange never fires and heartbeat recovery doesn't trigger.
        // Without post-recovery mode, queries may hang due to dead TCP connections.
        if (effectiveIdleTime > 60000 && typeof window !== 'undefined') {
          console.log('⚡ [RouteChange] Ativando post-recovery mode (idle >1min)');
          (window as any).__postRecoveryMode = true;
          (window as any).__postRecoveryModeUntil = Date.now() + 30000; // 30 segundos
        }

        // If very idle (>5 min), also invalidate stale queries to refresh
        if (effectiveIdleTime > 300000) {
          console.log('📊 [RouteChange] Invalidando queries muito stale...');
          // Small delay to let recovery complete
          setTimeout(() => {
            // Only invalidate queries that are actually stale
            queryClient.invalidateQueries({
              predicate: (query) => query.isStale(),
            });
          }, 100);
        }
      }

      setPrevLocation(location.pathname);
    }
  }, [location.pathname, prevLocation, queryClient]);

  return null;
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
  const location = useLocation();

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
        <Route path="/auth/callback" element={<AuthCallback />} />
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
          <Route path="/admin/clinicas" element={<AdminClinics />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/financeiro" element={<AdminFinancial />} />
          <Route path="/admin/metricas" element={<AdminMetrics />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/database" element={<AdminDatabase />} />
          <Route path="/admin/seguranca" element={<AdminSecurity />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </SuperAdminLayout>
    );
  }

  // Auth Callback Route - Needs to be accessible for authenticated users too
  // (User is already signed in by Supabase when they land here after Google OAuth)
  if (location.pathname === '/auth/callback') {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    );
  }

  // Onboarding Route - Separate from main app layout
  // Uses its own full-screen layout with dedicated styling
  if (location.pathname === '/onboarding') {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
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
          <HeartbeatInitializer />
          <TooltipProvider>

            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteChangeHandler queryClient={queryClient} />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SupabaseProjectValidator>
    </QueryClientProvider>
  </ThemeProvider >
);

export default App;
