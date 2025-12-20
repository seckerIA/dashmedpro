import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { TeamOverviewDashboard } from "@/components/crm/TeamOverviewDashboard";
import { TeamComparisonTable } from "@/components/crm/TeamComparisonTable";
import { TeamMetricsChart } from "@/components/crm/TeamMetricsChart";
import { useTeamMetrics } from "@/hooks/useTeamMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users } from "lucide-react";

const CRM = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();
  const [viewAllMode, setViewAllMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage ao montar (apenas para admin/dono)
  useEffect(() => {
    if (!isAdmin) {
      // Médicos não devem ter viewAllMode ou selectedUserIds
      setViewAllMode(false);
      setSelectedUserIds([]);
      return;
    }

    const savedViewAllMode = localStorage.getItem('crm_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('crm_selected_user_ids');
    
    if (savedViewAllMode) {
      setViewAllMode(JSON.parse(savedViewAllMode));
    }
    if (savedSelectedUserIds) {
      try {
        setSelectedUserIds(JSON.parse(savedSelectedUserIds));
      } catch {
        setSelectedUserIds([]);
      }
    }
  }, [isAdmin]);

  // Médicos sempre veem apenas seus próprios dados (undefined = apenas próprio usuário)
  // Admin/Dono podem selecionar equipes
  const { metrics, isLoading } = useTeamMetrics(
    isAdmin && viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined
  );

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 backdrop-blur-sm border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">CRM</h1>
              <p className="text-muted-foreground text-sm font-medium">
                {isAdmin ? "Visão Geral de Equipes" : "Meu CRM"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Selector - Apenas para Admin/Dono */}
      <TeamMemberSelector
        viewAllMode={viewAllMode}
        selectedUserIds={selectedUserIds}
        currentUserId={user?.id || ''}
        onViewAllModeChange={(enabled) => {
          setViewAllMode(enabled);
          localStorage.setItem('crm_view_all_mode', JSON.stringify(enabled));
        }}
        onSelectedUserIdsChange={(ids) => {
          setSelectedUserIds(ids);
          if (ids.length > 0) {
            localStorage.setItem('crm_selected_user_ids', JSON.stringify(ids));
          } else {
            localStorage.removeItem('crm_selected_user_ids');
          }
        }}
      />

      {/* Dashboard de Métricas Consolidadas */}
      <TeamOverviewDashboard metrics={metrics} isLoading={isLoading} />

      {/* Tabela Comparativa - Apenas para Admin/Dono com múltiplas equipes */}
      {isAdmin && metrics.teamMetrics.length > 1 && (
        <TeamComparisonTable teamMetrics={metrics.teamMetrics} isLoading={isLoading} />
      )}

      {/* Gráficos Comparativos - Apenas para Admin/Dono com múltiplas equipes */}
      {isAdmin && metrics.teamMetrics.length > 1 && (
        <TeamMetricsChart teamMetrics={metrics.teamMetrics} isLoading={isLoading} />
      )}
    </div>
  );
};

export default CRM;
