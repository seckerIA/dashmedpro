import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import CalculadoraSelection from "./pages/CalculadoraSelection";
import CalculadoraROI from "./pages/CalculadoraROI";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import TeamManagement from "./pages/TeamManagement";
import Tasks from "./pages/Tasks";
import TasksDebug from "./pages/TasksDebug";
import CRM from "./pages/CRM";
import Calendar from "./pages/Calendar";
import Financial from "./pages/Financial";
import FinancialTransactions from "./pages/FinancialTransactions";
import TransactionForm from "./components/financial/TransactionForm";
import ProspectingGuide from "./pages/ProspectingGuide";
import { 
  TrendingUp, 
  Target, 
  PieChart, 
  Users, 
  Mail, 
  FileText, 
  BarChart3,
  Settings
} from "lucide-react";

const queryClient = new QueryClient();

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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
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
        <Route path="/tarefas-debug" element={<TasksDebug />} />
        <Route 
          path="/marketing" 
          element={
            <PlaceholderPage 
              title="Marketing" 
              description="Gestão de campanhas e estratégias de marketing digital"
              icon={TrendingUp}
            />
          } 
        />
        <Route 
          path="/comercial" 
          element={
            <PlaceholderPage 
              title="Comercial" 
              description="Gestão de vendas e relacionamento com clientes"
              icon={Target}
            />
          } 
        />
        <Route 
          path="/financeiro" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <Financial />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/financeiro/transacoes" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <FinancialTransactions />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/financeiro/nova-transacao" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <TransactionForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/financeiro/editar-transacao/:id" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'dono']}>
              <TransactionForm />
            </RoleProtectedRoute>
          } 
        />
        <Route path="/crm" element={<CRM />} />
        <Route path="/calendar" element={<Calendar />} />
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
          element={
            <PlaceholderPage 
              title="Configurações" 
              description="Configurações da plataforma e preferências"
              icon={Settings}
            />
          } 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="dashmed-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
