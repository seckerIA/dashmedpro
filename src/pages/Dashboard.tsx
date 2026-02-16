
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard"
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard"
import VisionDashboard from "@/components/dashboard/VisionDashboard"
import { DetailedDashboard } from "@/components/dashboard/DetailedDashboard" // Import DetailedDashboard
import { DashboardSkeleton } from "@/components/ui/LoadingSkeletons"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"

const LOADING_TIMEOUT_MS = 15000;

const Dashboard = () => {
  const { isSecretaria, isMedico, profile } = useUserProfile();
  const { isLoading, error } = useDashboardMetrics();
  // State for view mode - includes 'daily' for day-to-day view
  const [viewMode, setViewMode] = useState<'vision' | 'detailed' | 'daily'>('vision');
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTooLong(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    if (loadingTooLong) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f111a] text-white">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto" />
            <h2 className="text-xl font-semibold">Carregamento demorado</h2>
            <p className="text-muted-foreground text-sm">
              O dashboard está demorando mais que o normal. Isso pode acontecer na primeira vez após o login.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen space-y-5 bg-[#0f111a] font-sans px-3 sm:px-4 lg:px-6 pb-10 pt-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f111a] text-white">
        <div className="text-center text-red-400">
          Erro ao carregar métricas: {error.message}
        </div>
      </div>
    );
  }

  // Se for secretária, mostrar dashboard específico (TODO: Update Secretary to Vision UI)
  if (isSecretaria) {
    return <SecretaryDashboard />;
  }

  // Se for médico, mostrar nova interface focada em agenda
  if (isMedico || profile?.role === 'medico') {
    return <DashboardWrapper />;
  }

  // Vision Dashboard (New UI) for Everyone else (Admin, Vendedor)
  return (
    <div className="min-h-screen bg-background relative">
      {viewMode === 'daily' ? (
        <DoctorDashboard viewMode={viewMode} onViewModeChange={setViewMode} />
      ) : viewMode === 'vision' ? (
        <VisionDashboard viewMode={viewMode} onViewModeChange={setViewMode} />
      ) : (
        <DetailedDashboard viewMode={viewMode} onViewModeChange={setViewMode} />
      )}
    </div>
  );
}

export default Dashboard
