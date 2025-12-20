import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";
import { Bottleneck } from "@/components/dashboard/BottleneckCard";
import { useCommercialMetrics } from "./useCommercialMetrics";

export function useBottleneckMetrics() {
  const { user } = useAuth();
  const { metrics: commercialMetrics } = useCommercialMetrics();

  return useQuery({
    queryKey: ["bottleneck-metrics", user?.id],
    queryFn: async (): Promise<Bottleneck[]> => {
      if (!user) throw new Error("User not authenticated");

      const bottlenecks: Bottleneck[] = [];
      const now = new Date();
      const periodStart = startOfMonth(now);
      const periodEnd = endOfMonth(now);
      const prevPeriodStart = startOfMonth(subMonths(now, 1));
      const prevPeriodEnd = endOfMonth(subMonths(now, 1));

      // 1. Verificar taxa de conversão geral
      if (commercialMetrics) {
        const conversionRate = commercialMetrics.conversionRate || 0;
        if (conversionRate < 10) {
          bottlenecks.push({
            id: "low-conversion",
            title: "Taxa de Conversão Baixa",
            severity: conversionRate < 5 ? "high" : "medium",
            metric: "Taxa de Conversão",
            currentValue: `${conversionRate.toFixed(1)}%`,
            threshold: "10%",
            impact: `Apenas ${conversionRate.toFixed(1)}% dos leads estão sendo convertidos em vendas.`,
            suggestion: "Revise o processo de qualificação de leads e melhore o acompanhamento pós-contato.",
          });
        }

        // 2. Verificar concentração de receita
        if (commercialMetrics.revenueByProcedure && commercialMetrics.revenueByProcedure.length > 0) {
          const totalRevenue = commercialMetrics.revenueByProcedure.reduce(
            (sum, p) => sum + Number(p.value || 0), 
            0
          );
          const topProcedure = commercialMetrics.revenueByProcedure[0];
          const topPercentage = totalRevenue > 0 
            ? (Number(topProcedure.value || 0) / totalRevenue) * 100 
            : 0;

          if (topPercentage > 80) {
            bottlenecks.push({
              id: "revenue-concentration",
              title: "Receita Muito Concentrada",
              severity: topPercentage > 90 ? "high" : "medium",
              metric: "Concentração de Receita",
              currentValue: `${topPercentage.toFixed(1)}%`,
              threshold: "80%",
              impact: `${topPercentage.toFixed(1)}% da receita vem de apenas um procedimento. Risco alto se houver queda na demanda.`,
              suggestion: "Diversifique a oferta de procedimentos e invista em marketing para outros serviços.",
            });
          }
        }
      }

      // 3. Verificar taxa de faltas
      const { data: appointments } = await supabase
        .from("medical_appointments")
        .select("id, status")
        .eq("user_id", user.id)
        .gte("start_time", periodStart.toISOString())
        .lte("start_time", periodEnd.toISOString());

      if (appointments && appointments.length > 0) {
        const totalAppointments = appointments.length;
        const noShows = appointments.filter(a => a.status === "no_show").length;
        const attendanceRate = ((totalAppointments - noShows) / totalAppointments) * 100;

        if (attendanceRate < 80) {
          bottlenecks.push({
            id: "low-attendance",
            title: "Alta Taxa de Faltas",
            severity: attendanceRate < 70 ? "high" : "medium",
            metric: "Taxa de Comparecimento",
            currentValue: `${attendanceRate.toFixed(1)}%`,
            threshold: "80%",
            impact: `${noShows} faltas de ${totalAppointments} consultas agendadas (${((noShows / totalAppointments) * 100).toFixed(1)}%).`,
            suggestion: "Implemente lembretes por WhatsApp/SMS 24h antes e confirmação no dia anterior.",
          });
        }
      }

      // 4. Verificar tempo médio de ciclo de vendas
      const { data: deals } = await supabase
        .from("crm_deals")
        .select("id, created_at, closed_at, stage")
        .eq("user_id", user.id)
        .gte("created_at", prevPeriodStart.toISOString())
        .lte("created_at", prevPeriodEnd.toISOString());

      if (deals && deals.length > 0) {
        const closedDeals = deals.filter(d => d.closed_at);
        if (closedDeals.length > 0) {
          const avgDays = closedDeals.reduce((sum, deal) => {
            const created = parseISO(deal.created_at);
            const closed = parseISO(deal.closed_at!);
            const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / closedDeals.length;

          if (avgDays > 30) {
            bottlenecks.push({
              id: "long-sales-cycle",
              title: "Ciclo de Vendas Muito Longo",
              severity: avgDays > 45 ? "high" : "medium",
              metric: "Tempo Médio de Ciclo",
              currentValue: `${Math.round(avgDays)} dias`,
              threshold: "30 dias",
              impact: `Deals estão levando em média ${Math.round(avgDays)} dias para fechar, acima do ideal.`,
              suggestion: "Acelere o processo de qualificação e acompanhamento. Considere automatizar follow-ups.",
            });
          }
        }

        // Verificar deals parados
        const activeDeals = deals.filter(d => !d.closed_at && d.stage !== "fechado_perdido");
        const stuckDeals = activeDeals.filter(deal => {
          const created = parseISO(deal.created_at);
          const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreated > 30;
        });

        if (stuckDeals.length > 0 && activeDeals.length > 0) {
          const stuckPercentage = (stuckDeals.length / activeDeals.length) * 100;
          if (stuckPercentage > 30) {
            bottlenecks.push({
              id: "stuck-deals",
              title: "Muitos Deals Parados",
              severity: stuckPercentage > 50 ? "high" : "medium",
              metric: "Deals Parados",
              currentValue: `${stuckDeals.length} deals`,
              threshold: `${Math.round(activeDeals.length * 0.3)} deals`,
              impact: `${stuckDeals.length} de ${activeDeals.length} deals ativos estão parados há mais de 30 dias (${stuckPercentage.toFixed(1)}%).`,
              suggestion: "Revise deals antigos e tome decisão: reativar, qualificar melhor ou fechar como perdido.",
            });
          }
        }
      }

      return bottlenecks.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}


