import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { ConversionFunnel } from "./ConversionFunnel";
import { RevenueChart } from "./RevenueChart";
import { RevenueDistributionCard } from "./RevenueDistributionCard";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { useBottleneckMetrics } from "@/hooks/useBottleneckMetrics";
import { AnimatedWrapper } from "@/components/shared/AnimatedWrapper";
import { BottleneckCard } from "@/components/dashboard/BottleneckCard";
import { motion } from "framer-motion";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { getScoreLevel } from "@/types/leadScoring";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export function CommercialDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  // Admin/Dono inicia com viewAllMode=true por padrão
  const [viewAllMode, setViewAllMode] = useState(() => {
    const saved = localStorage.getItem('commercial_dashboard_view_all_mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage detalhado
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('commercial_dashboard_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('commercial_dashboard_selected_user_ids');

    if (isAdmin && savedViewAllMode === null) {
      setViewAllMode(true);
    } else if (savedViewAllMode !== null) {
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

  const viewAsUserIds = viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined;

  const { metrics, isLoading, error } = useCommercialMetrics('month', undefined, viewAsUserIds);
  const { data: bottlenecks, isLoading: isLoadingBottlenecks } = useBottleneckMetrics();
  // Passar viewAsUserIds para useCommercialLeads também para filtrar os leads prioritários
  const { leads } = useCommercialLeads(undefined, viewAsUserIds);

  // Filtrar leads prioritários (score alto)
  const priorityLeads = leads
    .filter((lead: any) => {
      const score = lead.conversion_score;
      return score !== null && score !== undefined && getScoreLevel(score) === 'high';
    })
    .sort((a: any, b: any) => (b.conversion_score || 0) - (a.conversion_score || 0))
    .slice(0, 5);

  // Handle navigation with query params
  const handleNewLead = () => {
    navigate("/comercial?tab=dashboard&action=new");
  };


  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <AnimatedWrapper animationType="slideDown" delay={0.1}>
        <div className="flex flex-wrap gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleNewLead}
              className="bg-primary hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => navigate("/calendar")}
              variant="outline"
              className="transition-all"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Consulta
            </Button>
          </motion.div>
        </div>
      </AnimatedWrapper>

      {/* Team Filter for Admin */}
      <TeamMemberSelector
        viewAllMode={viewAllMode}
        selectedUserIds={selectedUserIds}
        currentUserId={user?.id || ''}
        onViewAllModeChange={(enabled) => {
          setViewAllMode(enabled);
          localStorage.setItem('commercial_dashboard_view_all_mode', JSON.stringify(enabled));
        }}
        onSelectedUserIdsChange={(ids) => {
          setSelectedUserIds(ids);
          if (ids.length > 0) {
            localStorage.setItem('commercial_dashboard_selected_user_ids', JSON.stringify(ids));
          } else {
            localStorage.removeItem('commercial_dashboard_selected_user_ids');
          }
        }}
      />

      {/* Leads Prioritários */}
      {priorityLeads.length > 0 && (
        <AnimatedWrapper animationType="slideDown" delay={0.12}>
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-lg">Leads para Responder Agora</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/comercial?tab=leads")}
                >
                  Ver Todos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {priorityLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/comercial?tab=leads&leadId=${lead.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{lead.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {lead.phone || lead.email || 'Sem contato'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeadScoreBadge score={lead.conversion_score} size="sm" />
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/comercial?tab=leads&leadId=${lead.id}&action=respond`);
                        }}
                      >
                        Responder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Alertas de Gargalo */}
      {!isLoadingBottlenecks && bottlenecks && bottlenecks.bottlenecks && bottlenecks.bottlenecks.length > 0 && (
        <AnimatedWrapper animationType="slideDown" delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                Gargalos Identificados
                <Badge variant="outline" className="ml-2">
                  {bottlenecks.bottlenecks.length}
                </Badge>
              </div>
              {bottlenecks.summary && (
                <Badge
                  variant={bottlenecks.summary.healthScore >= 70 ? "default" : "destructive"}
                  className="text-sm"
                >
                  Saúde: {bottlenecks.summary.healthScore}/100
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bottlenecks.bottlenecks.slice(0, 4).map((bottleneck, index) => (
                <AnimatedWrapper key={bottleneck.id} animationType="slideUp" delay={0.2 + index * 0.05}>
                  <BottleneckCard bottleneck={bottleneck} />
                </AnimatedWrapper>
              ))}
            </div>
          </div>
        </AnimatedWrapper>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: "Leads do Mês", value: metrics?.totalLeads || 0, icon: "trending-up" as const },
          { title: "Taxa de Conversão", value: metrics?.conversionRate || 0, icon: "target" as const, format: "percentage" as const },
          { title: "Receita Total", value: metrics?.totalRevenue || 0, icon: "dollar-sign" as const, format: "currency" as const },
          { title: "Receita Média", value: metrics?.averageRevenue || 0, icon: "bar-chart" as const, format: "currency" as const },
          { title: "Pacientes Novos", value: metrics?.newPatients || 0, icon: "user-plus" as const },
          { title: "Procedimentos", value: metrics?.scheduledProcedures || 0, icon: "calendar" as const },
        ].map((metric, index) => (
          <AnimatedWrapper key={metric.title} animationType="scale" delay={0.3 + index * 0.05}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <MetricCard
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                format={metric.format}
                isLoading={isLoading}
              />
            </motion.div>
          </AnimatedWrapper>
        ))}
      </div>

      {/* Card de Distribuição de Receita */}
      <AnimatedWrapper animationType="slideUp" delay={0.6}>
        <RevenueDistributionCard />
      </AnimatedWrapper>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedWrapper animationType="slideUp" delay={0.7}>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-card shadow-card border-border transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
                <ConversionFunnel data={metrics?.funnelData || []} />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatedWrapper>

        <AnimatedWrapper animationType="slideUp" delay={0.75}>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-card shadow-card border-border transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Receita por Procedimento</h3>
                <RevenueChart data={metrics?.revenueByProcedure || []} />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatedWrapper>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedWrapper animationType="slideUp" delay={0.8}>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-card shadow-card border-border transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tendência de Leads</h3>
                <RevenueChart data={metrics?.leadsTrend || []} type="line" />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatedWrapper>

        <AnimatedWrapper animationType="slideUp" delay={0.85}>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-card shadow-card border-border transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Comparativo Mensal</h3>
                <RevenueChart data={metrics?.monthlyComparison || []} type="bar" />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatedWrapper>
      </div>
    </div>
  );
}
