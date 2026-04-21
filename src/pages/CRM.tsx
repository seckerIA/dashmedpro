import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { TeamOverviewDashboard } from "@/components/crm/TeamOverviewDashboard";
import { TeamComparisonTable } from "@/components/crm/TeamComparisonTable";
import { TeamMetricsChart } from "@/components/crm/TeamMetricsChart";
import { MonthPicker } from "@/components/ui/month-picker";
import { useTeamMetrics } from "@/hooks/useTeamMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users, Calendar, UserPlus, CheckCircle2, Clock } from "lucide-react";
import { CRMPageSkeleton } from "@/components/ui/LoadingSkeletons";

const CRM = () => {
  const { user } = useAuth();
  const { isAdmin, isSecretaria: profileIsSecretaria } = useUserProfile();
  const isAdminOrDono = isAdmin;
  const [viewAllMode, setViewAllMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Carregar estado do localStorage ao montar (apenas para admin/dono)
  useEffect(() => {
    if (!isAdminOrDono) {
      // Medicos e secretarias nao devem ter viewAllMode ou selectedUserIds
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
  }, [isAdminOrDono]);

  // Admin/Dono: se viewAllMode esta ativo e tem usuarios selecionados, usar esses usuarios
  // Se nao tem selecao especifica mas e admin/dono, o hook buscara TODOS os usuarios automaticamente
  // Medicos/Secretarias sempre veem apenas seus proprios dados (undefined = apenas proprio usuario)
  const selectedIdsForHook = isAdminOrDono && viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined;

  const dateFilter = {
    start: startOfMonth(parseISO(selectedMonth + '-01')).toISOString(),
    end: endOfMonth(parseISO(selectedMonth + '-01')).toISOString()
  };

  const { metrics, secretaryMetrics, isLoading, isSecretaria } = useTeamMetrics(selectedIdsForHook, dateFilter);

  // Se for secretaria, mostrar dashboard especifico
  if (isSecretaria) {
    return (
      <div className="min-h-screen space-y-6">
        {/* Header Secretaria */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 backdrop-blur-sm border border-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Minhas Metricas</h1>
                <p className="text-muted-foreground text-sm font-medium">
                  {secretaryMetrics.userName || 'Secretaria'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <CRMPageSkeleton />
        ) : (
          <>
            {/* Cards de Metricas da Secretaria */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Agendamentos Hoje */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Agendamentos Hoje
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {secretaryMetrics.appointmentsScheduledToday}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {secretaryMetrics.appointmentsScheduledThisMonth} este mes
                  </p>
                </CardContent>
              </Card>

              {/* Pacientes Cadastrados */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                      Pacientes Cadastrados
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {secretaryMetrics.patientsRegisteredToday}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {secretaryMetrics.patientsRegisteredThisMonth} este mes
                  </p>
                </CardContent>
              </Card>

              {/* Confirmacoes */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      Confirmacoes Hoje
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {secretaryMetrics.confirmationsToday}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {secretaryMetrics.pendingConfirmations} pendentes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Info adicional */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Suas Metricas</p>
                    <p>
                      Este painel mostra suas metricas pessoais de trabalho. Para ver metricas
                      financeiras detalhadas, acesse o menu "Meu Financeiro" no sidebar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Metricas de Equipe</h1>
              <p className="text-muted-foreground text-sm font-medium">
                {isAdminOrDono ? "Visao Geral de Equipes" : "Minhas Metricas"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Filtro de Mes Customizado */}
        <div className="flex items-center">
          <MonthPicker 
            value={selectedMonth} 
            onChange={setSelectedMonth} 
          />
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

      {/* Dashboard de Metricas Consolidadas */}
      <TeamOverviewDashboard metrics={metrics} isLoading={isLoading} />

      {/* Tabela Comparativa - Apenas para Admin/Dono com multiplas equipes */}
      {isAdminOrDono && metrics.teamMetrics.length > 1 && (
        <TeamComparisonTable teamMetrics={metrics.teamMetrics} isLoading={isLoading} />
      )}

      {/* Graficos Comparativos - Apenas para Admin/Dono com multiplas equipes */}
      {isAdminOrDono && metrics.teamMetrics.length > 1 && (
        <TeamMetricsChart teamMetrics={metrics.teamMetrics} isLoading={isLoading} />
      )}
    </div>
  );
};

export default CRM;
