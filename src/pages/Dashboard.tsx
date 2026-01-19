import { useUserProfile } from "@/hooks/useUserProfile"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard"
import VisionDashboard from "@/components/dashboard/VisionDashboard"
import { DetailedDashboard } from "@/components/dashboard/DetailedDashboard" // Import DetailedDashboard
import { DashboardSkeleton } from "@/components/ui/LoadingSkeletons"
import { useState } from "react" // Import useState
import { Button } from "@/components/ui/button" // Import Button

const Dashboard = () => {
  const { isSecretaria } = useUserProfile();
  const { isLoading, error } = useDashboardMetrics();
  // State for view mode
  const [viewMode, setViewMode] = useState<'vision' | 'detailed'>('vision');

  if (isLoading) {
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

  // Vision Dashboard (New UI) for Everyone else (Admin, Vendedor, Medico)

  return (
    <div className="min-h-screen bg-background relative">
      {viewMode === 'vision' ? (
        <VisionDashboard viewMode={viewMode} onViewModeChange={setViewMode} />
      ) : (
        <DetailedDashboard viewMode={viewMode} onViewModeChange={setViewMode} />
      )}
    </div>
  );
}

export default Dashboard

