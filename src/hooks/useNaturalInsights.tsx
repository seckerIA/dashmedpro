/**
 * useNaturalInsights - Hook para gerar insights em linguagem natural
 * 
 * Transforma métricas numéricas em frases contextuais e amigáveis.
 */

import { useMemo } from "react";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { useFinancialMetrics } from "./useFinancialMetrics";
import { useEnhancedDashboardMetrics } from "./useEnhancedDashboardMetrics";
import { formatCurrency } from "@/lib/currency";

export interface NaturalInsight {
    id: string;
    category: "financial" | "conversion" | "engagement" | "operational";
    emoji: string;
    message: string;
    tone: "positive" | "neutral" | "warning" | "critical";
    priority: number; // 1-10
}

export function useNaturalInsights() {
    const { data: dashboardMetrics, isLoading: isLoadingDashboard } = useDashboardMetrics();
    const { metrics: financialMetrics, isLoading: isLoadingFinancial } = useFinancialMetrics();
    const { data: enhancedMetrics, isLoading: isLoadingEnhanced } = useEnhancedDashboardMetrics();

    const isLoading = isLoadingDashboard || isLoadingFinancial || isLoadingEnhanced;

    const insights = useMemo((): NaturalInsight[] => {
        if (!dashboardMetrics || !financialMetrics) return [];

        const result: NaturalInsight[] = [];

        // 1. Insight de Lucro
        const monthProfit = financialMetrics.monthNetProfit || 0;
        const profitMargin = financialMetrics.netProfitMargin || 0;

        if (monthProfit > 0) {
            if (profitMargin >= 30) {
                result.push({
                    id: "profit-excellent",
                    category: "financial",
                    emoji: "🚀",
                    message: `Lucro de ${formatCurrency(monthProfit)} com margem de ${profitMargin.toFixed(0)}%. Excelente resultado!`,
                    tone: "positive",
                    priority: 9,
                });
            } else if (profitMargin >= 15) {
                result.push({
                    id: "profit-good",
                    category: "financial",
                    emoji: "💰",
                    message: `Este mês você lucrou ${formatCurrency(monthProfit)}. Margem saudável de ${profitMargin.toFixed(0)}%.`,
                    tone: "positive",
                    priority: 7,
                });
            } else {
                result.push({
                    id: "profit-low-margin",
                    category: "financial",
                    emoji: "📊",
                    message: `Lucro de ${formatCurrency(monthProfit)}, mas margem de ${profitMargin.toFixed(0)}% pode melhorar.`,
                    tone: "neutral",
                    priority: 6,
                });
            }
        } else if (monthProfit < 0) {
            result.push({
                id: "profit-negative",
                category: "financial",
                emoji: "⚠️",
                message: `Atenção: prejuízo de ${formatCurrency(Math.abs(monthProfit))} este mês. Revise custos e despesas.`,
                tone: "critical",
                priority: 10,
            });
        }

        // 2. Insight de Conversão
        const conversionRate = dashboardMetrics.conversionRate || 0;
        const wonDeals = dashboardMetrics.wonDeals || 0;
        const totalDeals = dashboardMetrics.activeDeals + wonDeals + (dashboardMetrics.lostDeals || 0);

        if (conversionRate >= 25) {
            result.push({
                id: "conversion-high",
                category: "conversion",
                emoji: "🎯",
                message: `Taxa de ${conversionRate.toFixed(0)}%! Você converte 1 a cada 4 leads. Continue assim!`,
                tone: "positive",
                priority: 8,
            });
        } else if (conversionRate >= 15) {
            result.push({
                id: "conversion-average",
                category: "conversion",
                emoji: "📈",
                message: `Convertendo ${conversionRate.toFixed(0)}% dos leads. ${wonDeals} negócios fechados.`,
                tone: "neutral",
                priority: 5,
            });
        } else if (conversionRate > 0 && conversionRate < 15) {
            result.push({
                id: "conversion-low",
                category: "conversion",
                emoji: "🔍",
                message: `Taxa de ${conversionRate.toFixed(0)}% está abaixo do ideal. Revise o processo de vendas.`,
                tone: "warning",
                priority: 7,
            });
        }

        // 3. Insight de Pacientes em Tratamento
        const activeTreatments = enhancedMetrics?.activeTreatments || 0;
        if (activeTreatments > 0) {
            result.push({
                id: "active-treatments",
                category: "engagement",
                emoji: "🏥",
                message: `${activeTreatments} paciente${activeTreatments > 1 ? 's' : ''} em tratamento ativo. Mantenha o acompanhamento!`,
                tone: "positive",
                priority: 6,
            });
        }

        // 4. Insight de Inadimplência
        const defaultRate = enhancedMetrics?.defaultRate || 0;
        if (defaultRate > 20) {
            result.push({
                id: "default-high",
                category: "financial",
                emoji: "🚨",
                message: `Inadimplência em ${defaultRate.toFixed(0)}%. Considere revisar políticas de cobrança.`,
                tone: "critical",
                priority: 9,
            });
        } else if (defaultRate > 10) {
            result.push({
                id: "default-medium",
                category: "financial",
                emoji: "💳",
                message: `${defaultRate.toFixed(0)}% de inadimplência. Monitore os pagamentos pendentes.`,
                tone: "warning",
                priority: 6,
            });
        }

        // 5. Insight de Follow-ups
        const pendingFollowUps = enhancedMetrics?.pendingFollowUps || 0;
        if (pendingFollowUps > 5) {
            result.push({
                id: "followups-many",
                category: "engagement",
                emoji: "📞",
                message: `${pendingFollowUps} follow-ups pendentes. Não deixe leads esfriarem!`,
                tone: "warning",
                priority: 8,
            });
        } else if (pendingFollowUps > 0) {
            result.push({
                id: "followups-pending",
                category: "engagement",
                emoji: "📋",
                message: `${pendingFollowUps} follow-up${pendingFollowUps > 1 ? 's' : ''} para fazer hoje.`,
                tone: "neutral",
                priority: 5,
            });
        }

        // 6. Insight de Ticket Médio
        const avgTicket = enhancedMetrics?.averageDealValue || 0;
        if (avgTicket > 0) {
            result.push({
                id: "avg-ticket",
                category: "financial",
                emoji: "🎫",
                message: `Ticket médio de ${formatCurrency(avgTicket)} por negócio.`,
                tone: "neutral",
                priority: 4,
            });
        }

        // 7. Insight de Consultas
        const appointmentsThisMonth = enhancedMetrics?.appointmentsThisMonth || 0;
        const completedAppointments = enhancedMetrics?.completedAppointmentsThisMonth || 0;
        const completionRate = enhancedMetrics?.appointmentCompletionRate || 0;

        if (appointmentsThisMonth > 0) {
            if (completionRate >= 80) {
                result.push({
                    id: "appointments-great",
                    category: "operational",
                    emoji: "✅",
                    message: `${completedAppointments} de ${appointmentsThisMonth} consultas realizadas. Taxa de ${completionRate.toFixed(0)}%!`,
                    tone: "positive",
                    priority: 6,
                });
            } else if (completionRate >= 60) {
                result.push({
                    id: "appointments-ok",
                    category: "operational",
                    emoji: "📅",
                    message: `${completedAppointments}/${appointmentsThisMonth} consultas concluídas. Verifique as ausências.`,
                    tone: "neutral",
                    priority: 5,
                });
            } else {
                result.push({
                    id: "appointments-low",
                    category: "operational",
                    emoji: "⚠️",
                    message: `Apenas ${completionRate.toFixed(0)}% das consultas realizadas. Muitas faltas ou cancelamentos.`,
                    tone: "warning",
                    priority: 7,
                });
            }
        }

        // Ordenar por prioridade
        return result.sort((a, b) => b.priority - a.priority);
    }, [dashboardMetrics, financialMetrics, enhancedMetrics]);

    // Retornar apenas os top insights
    const topInsights = insights.slice(0, 5);
    const criticalInsights = insights.filter(i => i.tone === "critical");
    const warningInsights = insights.filter(i => i.tone === "warning");

    return {
        insights,
        topInsights,
        criticalInsights,
        warningInsights,
        isLoading,
        hasIssues: criticalInsights.length > 0 || warningInsights.length > 0,
    };
}

export default useNaturalInsights;
