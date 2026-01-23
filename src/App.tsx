import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { SupabaseProjectValidator } from "./components/SupabaseProjectValidator";
import { CortanaProvider, CortanaOverlay } from "./components/cortana";
import { initHeartbeatRecovery } from "@/lib/heartbeatRecovery";
import { useIdleDetector } from "@/lib/idleDetector";
import { queryClient, cancelOngoingQueries, resetFetchTracking } from "@/lib/queryUtils";

// Componente para inicializar o Heartbeat de recuperação (NÃO-BLOQUEANTE)
const HeartbeatInitializer = () => {
  const { user } = useAuth();
  const cleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    // Só inicializa se houver usuário logado
    if (!user) {
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
import { checkToken } from "@/integrations/supabase/client";

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

// ============================================================================
// V3: Configuração de Error Handlers no QueryClient importado
// ============================================================================
let consecutiveTimeouts = 0;
let lastReloadCheck = 0;

// Subscreve aos eventos de erro do QueryCache
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action?.type === 'success') {
    consecutiveTimeouts = 0;
  }

  if (event.type === 'updated' && event.action?.type === 'error') {
    const error = event.action.error as any;
    const query = event.query;
    const errorMsg = error?.message || String(error);

    // Detectar erros de autenticação
    const isAuthError =
      errorMsg.includes('401') ||
      errorMsg.includes('Unauthorized') ||
      errorMsg.includes('JWT') ||
      errorMsg.includes('invalid_token') ||
      errorMsg.includes('Refresh Token') ||
      errorMsg.includes('Invalid Refresh Token') ||
      error?.status === 401;

    if (isAuthError) {
      console.log('🔒 [QueryCache] Erro de autenticação:', errorMsg.substring(0, 50));

      // Importar supabase e tentar refresh
      import('@/integrations/supabase/client').then(async ({ supabase, checkToken }) => {
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
      }).catch(console.error);
      return;
    }

    // Detectar timeouts consecutivos (apenas log, não recarrega)
    if (errorMsg.includes('timeout') || errorMsg.includes('Timeout') || errorMsg.includes('excedido')) {
      consecutiveTimeouts++;
      console.warn(`⚠️ Query timeout (${consecutiveTimeouts}x): ${query.queryKey.slice(0, 2).join('/')}`);

      // Resetar query travada
      queryClient.resetQueries({ queryKey: query.queryKey });

      // V3: Apenas loga, não faz reload automático
      if (consecutiveTimeouts >= 3) {
        console.warn('⚠️ [App] Muitos timeouts consecutivos (' + consecutiveTimeouts + '). Considere verificar a conexão.');
      }
    }
  }
});

// Subscreve aos eventos de erro do MutationCache
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.action?.type === 'error') {
    const error = event.action.error as any;
    const errorMsg = error?.message || '';

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || error?.status === 401) {
      console.log('🔒 [MutationCache] Erro 401 em mutation. Forçando refresh...');
      import('@/integrations/supabase/client').then(({ checkToken }) => {
        checkToken();
      }).catch(console.error);
    }

    if (errorMsg.includes('timeout') || errorMsg.includes('Query timeout')) {
      console.error('❌ Mutation timeout:', error);
    }
  }
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

// Route Change Handler V3 - Simplified, no deadlock
const RouteChangeHandler = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = React.useState(location.pathname);

  React.useEffect(() => {
    if (location.pathname !== prevLocation) {
      console.log(`🔄 [RouteChange] ${prevLocation} → ${location.pathname}`);

      // Cancela queries em andamento (não bloqueia novas)
      cancelOngoingQueries();

      // Atualiza referência
      setPrevLocation(location.pathname);
    }
  }, [location.pathname, prevLocation]);


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

  // V3: Ativa detecção de idle (não bloqueia queries)
  useIdleDetector();

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
              <RouteChangeHandler />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SupabaseProjectValidator>
    </QueryClientProvider>
  </ThemeProvider >
);

export default App;
