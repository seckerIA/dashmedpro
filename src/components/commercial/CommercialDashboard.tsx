import { useState, useEffect, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { ConversionFunnel } from "./ConversionFunnel";
import { RevenueChart } from "./RevenueChart";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, AlertTriangle, TrendingUp, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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
import { MonthPicker } from "@/components/ui/month-picker";
import type { PeriodRange } from "@/types/metrics";
import { useMarketingDashboard } from "@/hooks/useMarketingDashboard";

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
  const [showAllBottlenecks, setShowAllBottlenecks] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      const saved = localStorage.getItem("commercial_dashboard_month");
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch {
      /* ignore */
    }
    return format(new Date(), "yyyy-MM");
  });

  const commercialPeriod = useMemo((): PeriodRange => {
    const base = parseISO(`${selectedMonth}-01`);
    return {
      start: startOfMonth(base),
      end: endOfMonth(base),
    };
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem("commercial_dashboard_month", selectedMonth);
  }, [selectedMonth]);

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

  const { metrics, isLoading, error } = useCommercialMetrics("custom", commercialPeriod, viewAsUserIds);
  const { data: marketingDashboard, isLoading: isLoadingMarketingLeads } = useMarketingDashboard({
    startDate: commercialPeriod.start,
    endDate: commercialPeriod.end,
  });
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

  const leadsGeradosHint = useMemo(() => {
    const d = marketingDashboard;
    if (!d) return undefined;
    if (d.leadsFromAds <= 0 && d.leadsFromWhatsApp <= 0) {
      return "Igual ao Marketing: período sem leads rastreados";
    }
    if (d.leadsFromWhatsApp > 0 && d.leadsFromAds > 0) {
      return `${d.leadsFromAds} anúncios · ${d.leadsFromWhatsApp} WhatsApp (mesma base do Marketing)`;
    }
    if (d.leadsFromWhatsApp > 0) {
      return `${d.leadsFromWhatsApp} WhatsApp (mesma base do Marketing)`;
    }
    return `${d.leadsFromAds} via anúncios (mesma base do Marketing)`;
  }, [marketingDashboard]);

  /** Primeira etapa do funil = mesmo total do card (anúncios + WhatsApp); %s relativas a esse total. */
  const conversionFunnelData = useMemo(() => {
    const rows = metrics?.funnelData;
    if (!rows?.length) return [];
    const marketingTotal = marketingDashboard?.totalLeads;
    const leadsTop =
      marketingDashboard != null && marketingTotal != null && marketingTotal >= 0
        ? marketingTotal
        : rows[0].count;
    const consultas = rows[1]?.count ?? 0;
    const vendas = rows[2]?.count ?? 0;
    const pct = (n: number) => (leadsTop > 0 ? Math.min((n / leadsTop) * 100, 100) : 0);
    return [
      { stage: rows[0].stage, count: leadsTop, percentage: leadsTop > 0 ? 100 : 0 },
      { stage: rows[1].stage, count: consultas, percentage: pct(consultas) },
      { stage: rows[2].stage, count: vendas, percentage: pct(vendas) },
    ];
  }, [metrics?.funnelData, marketingDashboard]);

  /** Pacientes novos ÷ leads gerados × 100 (mesmos números dos cards Pacientes Novos e Leads Gerados). */
  const taxaConversaoVsLeadsMarketing = useMemo(() => {
    const leads = marketingDashboard?.totalLeads;
    const novos = metrics?.newPatients ?? 0;
    if (marketingDashboard == null || leads == null) return metrics?.conversionRate ?? 0;
    if (leads <= 0) return 0;
    return (novos / leads) * 100;
  }, [marketingDashboard, metrics?.newPatients, metrics?.conversionRate]);

  const metricsLoading = isLoading || isLoadingMarketingLeads;

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

      {/* Filtro de mês + equipe */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
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
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} className="sm:self-center" />
      </div>

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

      {/* Alertas de Gargalo - Compacto */}
      {!isLoadingBottlenecks && bottlenecks && bottlenecks.bottlenecks && bottlenecks.bottlenecks.length > 0 && (
        <AnimatedWrapper animationType="slideDown" delay={0.15}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                Gargalos
                <Badge variant="outline" className="text-xs">
                  {bottlenecks.bottlenecks.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {bottlenecks.summary && (
                  <Badge
                    variant={bottlenecks.summary.healthScore >= 70 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    Saúde: {bottlenecks.summary.healthScore}/100
                  </Badge>
                )}
              </div>
            </div>
            {/* Mostrar gargalos - 2 por padrão ou todos se expandido */}
            <div className={showAllBottlenecks ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex gap-3 overflow-x-auto pb-2"}>
              {bottlenecks.bottlenecks.slice(0, showAllBottlenecks ? undefined : 2).map((bottleneck, index) => (
                <div
                  key={bottleneck.id}
                  className={`${showAllBottlenecks ? '' : 'flex-shrink-0 min-w-[280px] max-w-[320px]'} p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer`}
                  onClick={() => bottleneck.actionUrl && navigate(bottleneck.actionUrl)}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      variant={bottleneck.severity === 'high' ? 'destructive' : 'outline'}
                      className="text-xs shrink-0"
                    >
                      {bottleneck.severity === 'high' ? 'Crítico' : bottleneck.severity === 'medium' ? 'Atenção' : 'Moderado'}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{bottleneck.title}</p>
                      <p className={`text-xs text-muted-foreground ${showAllBottlenecks ? '' : 'line-clamp-1'}`}>{bottleneck.suggestion}</p>
                      {showAllBottlenecks && bottleneck.impact && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Impacto: {bottleneck.impact}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Ver mais/Ver menos - sempre visível */}
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllBottlenecks(!showAllBottlenecks)}
              >
                {showAllBottlenecks ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    {bottlenecks.bottlenecks.length > 2
                      ? `Ver mais (${bottlenecks.bottlenecks.length - 2} restantes)`
                      : 'Ver detalhes'
                    }
                  </>
                )}
              </Button>
            </div>
          </div>
        </AnimatedWrapper>
      )}

      {/* Metrics Cards — Leads Gerados alinhado ao hook do Marketing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {(
          [
            {
              title: "Leads Gerados",
              value: marketingDashboard?.totalLeads ?? 0,
              icon: "trending-up" as const,
              hint: leadsGeradosHint,
            },
            {
              title: "Taxa de Conversão",
              value: taxaConversaoVsLeadsMarketing,
              icon: "target" as const,
              format: "percentage" as const,
              hint:
                marketingDashboard != null
                  ? "Pacientes novos ÷ leads gerados × 100 (cards Pacientes Novos e Leads Gerados)"
                  : undefined,
            },
            { title: "Receita Total", value: metrics?.totalRevenue || 0, icon: "dollar-sign" as const, format: "currency" as const },
            {
              title: "Pacientes Novos",
              value: metrics?.newPatients || 0,
              icon: "user-plus" as const,
              hint: "Contagem após comparecimento (consulta concluída)",
            },
          ] as const
        ).map((metric, index) => (
          <AnimatedWrapper key={metric.title} animationType="scale" delay={0.3 + index * 0.05}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <MetricCard
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                format={"format" in metric ? metric.format : undefined}
                hint={"hint" in metric ? metric.hint : undefined}
                isLoading={metricsLoading}
              />
            </motion.div>
          </AnimatedWrapper>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedWrapper animationType="slideUp" delay={0.7}>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-card shadow-card border-border transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
                <ConversionFunnel data={conversionFunnelData} />
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
    </div >
  );
}
