/**
 * Enhanced Bottleneck Metrics Hook
 * Provides intelligent analysis of business bottlenecks with:
 * - Multiple data sources
 * - Trend analysis
 * - Actionable insights
 * - Priority scoring
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useSecretaryDoctors } from "./useSecretaryDoctors";
import { createClient } from "@/lib/supabase/client";
import {
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfWeek,
    endOfWeek,
    subDays,
    parseISO,
    differenceInDays,
    differenceInHours,
    isWeekend
} from "date-fns";

export interface Bottleneck {
    id: string;
    title: string;
    severity: "high" | "medium" | "low";
    category: "conversion" | "financial" | "operational" | "engagement" | "retention";
    metric: string;
    currentValue: number | string;
    threshold: number | string;
    previousValue?: number | string;
    trend?: "improving" | "declining" | "stable";
    suggestion: string;
    impact: string;
    actionUrl?: string;
    priority: number; // 1-10 for sorting
}

interface BottleneckAnalysis {
    bottlenecks: Bottleneck[];
    summary: {
        critical: number;
        attention: number;
        minor: number;
        healthScore: number; // 0-100
    };
}

// Simple timeout wrapper since supabaseQueryWithTimeout is not available
async function queryWithTimeout<T>(promise: Promise<{ data: T | null; error: any }>, timeoutMs: number): Promise<{ data: T | null; error: any }> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Query timed out')), timeoutMs);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

export function useBottleneckMetrics() {
    const { user } = useAuth();
    const { data: profile } = useUserProfile();
    const isSecretaria = profile?.role === 'secretaria';
    const { doctorIds } = useSecretaryDoctors();

    const targetUserIds = user?.id
        ? isSecretaria && doctorIds?.length > 0
            ? [user.id, ...doctorIds]
            : [user.id]
        : [];

    return useQuery({
        queryKey: ["bottleneck-metrics-v2", user?.id, targetUserIds],
        queryFn: async ({ signal }): Promise<BottleneckAnalysis> => {
            if (!user) throw new Error("User not authenticated");
            const supabase = createClient();

            const bottlenecks: Bottleneck[] = [];
            const now = new Date();

            // Time periods
            const currentMonthStart = startOfMonth(now);
            const currentMonthEnd = endOfMonth(now);
            const prevMonthStart = startOfMonth(subMonths(now, 1));
            const prevMonthEnd = endOfMonth(subMonths(now, 1));
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            const last7Days = subDays(now, 7);
            const last30Days = subDays(now, 30);

            // Fetch all data in parallel for better performance
            const [
                currentAppointments,
                prevAppointments,
                currentLeads,
                prevLeads,
                currentDeals,
                prevDeals,
                conversations,
                callSessions,
            ] = await Promise.all([
                // Current month appointments
                queryWithTimeout(
                    supabase
                        .from("medical_appointments")
                        .select("id, status, start_time, created_at, contact_id")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("start_time", currentMonthStart.toISOString())
                        .lte("start_time", currentMonthEnd.toISOString()) as any,
                    30000
                ),
                // Previous month appointments
                queryWithTimeout(
                    supabase
                        .from("medical_appointments")
                        .select("id, status")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("start_time", prevMonthStart.toISOString())
                        .lte("start_time", prevMonthEnd.toISOString()) as any,
                    30000
                ),
                // Current month leads
                queryWithTimeout(
                    supabase
                        .from("commercial_leads")
                        .select("id, status, created_at")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("created_at", currentMonthStart.toISOString()) as any,
                    30000
                ),
                // Previous month leads
                queryWithTimeout(
                    supabase
                        .from("commercial_leads")
                        .select("id, status")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("created_at", prevMonthStart.toISOString())
                        .lte("created_at", prevMonthEnd.toISOString()) as any,
                    30000
                ),
                // Current deals
                queryWithTimeout(
                    supabase
                        .from("crm_deals")
                        .select("id, stage, value, created_at, closed_at, updated_at")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("created_at", last30Days.toISOString()) as any,
                    30000
                ),
                // Previous period deals
                queryWithTimeout(
                    supabase
                        .from("crm_deals")
                        .select("id, stage, created_at, closed_at")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("created_at", subDays(now, 60).toISOString())
                        .lt("created_at", last30Days.toISOString()) as any,
                    30000
                ),
                // WhatsApp conversations for response time
                queryWithTimeout(
                    supabase
                        .from("whatsapp_conversations")
                        .select("id, last_message_at, status, created_at")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("created_at", last7Days.toISOString()) as any,
                    30000
                ),
                // Call sessions
                queryWithTimeout(
                    supabase
                        .from("voip_call_sessions" as any)
                        .select("id, status, duration_seconds, direction, initiated_at")
                        .in("user_id", targetUserIds.length > 0 ? targetUserIds : [user.id])
                        .gte("initiated_at", last7Days.toISOString()) as any,
                    30000
                ),
            ]);

            const appointments = (currentAppointments.data || []) as any[];
            const prevAppts = (prevAppointments.data || []) as any[];
            const leads = (currentLeads.data || []) as any[];
            const prevLeadsData = (prevLeads.data || []) as any[];
            const deals = (currentDeals.data || []) as any[];
            const prevDealsData = (prevDeals.data || []) as any[];
            const convos = (conversations.data || []) as any[];
            const calls = (callSessions.data || []) as any[];

            // =============================================
            // 1. TAXA DE COMPARECIMENTO (No-Show Analysis)
            // =============================================
            if (appointments.length > 0) {
                const noShows = appointments.filter(a => a.status === "no_show").length;
                const cancelled = appointments.filter(a => a.status === "cancelled").length;
                const completed = appointments.filter(a => a.status === "completed").length;

                const noShowRate = (noShows / appointments.length) * 100;
                const prevNoShows = prevAppts.filter(a => a.status === "no_show").length;
                const prevNoShowRate = prevAppts.length > 0
                    ? (prevNoShows / prevAppts.length) * 100
                    : 0;

                const trend = noShowRate < prevNoShowRate ? "improving" :
                    noShowRate > prevNoShowRate ? "declining" : "stable";

                if (noShowRate > 10) {
                    bottlenecks.push({
                        id: "high-no-show-rate",
                        title: "Taxa de Faltas Elevada",
                        severity: noShowRate > 20 ? "high" : "medium",
                        category: "operational",
                        metric: "Taxa de No-Show",
                        currentValue: `${noShowRate.toFixed(1)}%`,
                        threshold: "10%",
                        previousValue: `${prevNoShowRate.toFixed(1)}%`,
                        trend,
                        impact: `${noShows} de ${appointments.length} pacientes faltaram. Perda estimada de receita e tempo da agenda.`,
                        suggestion: "Implemente confirmação automática 24h antes via WhatsApp. Configure lembretes no dia da consulta.",
                        actionUrl: "/calendar?filter=no_show",
                        priority: noShowRate > 20 ? 9 : 7,
                    });
                }
            }

            // =============================================
            // 2. CONVERSÃO DE LEADS
            // =============================================
            if (leads.length >= 5) {
                const convertedLeads = leads.filter(l => l.status === "converted").length;
                const conversionRate = (convertedLeads / leads.length) * 100;

                const prevConverted = prevLeadsData.filter(l => l.status === "converted").length;
                const prevConversionRate = prevLeadsData.length > 0
                    ? (prevConverted / prevLeadsData.length) * 100
                    : 0;

                const trend = conversionRate > prevConversionRate ? "improving" :
                    conversionRate < prevConversionRate ? "declining" : "stable";

                if (conversionRate < 15) {
                    bottlenecks.push({
                        id: "low-lead-conversion",
                        title: "Conversão de Leads Baixa",
                        severity: conversionRate < 5 ? "high" : conversionRate < 10 ? "medium" : "low",
                        category: "conversion",
                        metric: "Taxa de Conversão",
                        currentValue: `${conversionRate.toFixed(1)}%`,
                        threshold: "15%",
                        previousValue: `${prevConversionRate.toFixed(1)}%`,
                        trend,
                        impact: `Apenas ${convertedLeads} de ${leads.length} leads foram convertidos. Oportunidades de receita perdidas.`,
                        suggestion: "Revise o processo de qualificação. Priorize leads com score alto. Reduza tempo de resposta inicial.",
                        actionUrl: "/comercial?tab=leads",
                        priority: conversionRate < 5 ? 10 : 8,
                    });
                }
            }

            // =============================================
            // 3. LEADS SEM CONTATO (Abandoned Leads)
            // =============================================
            const abandonedLeads = leads.filter(lead => {
                if (lead.status === "converted" || lead.status === "lost") return false;
                const lastContact = lead.last_contact_at
                    ? parseISO(lead.last_contact_at)
                    : parseISO(lead.created_at);
                return differenceInDays(now, lastContact) > 7;
            });

            if (abandonedLeads.length > 0 && leads.length > 0) {
                const abandonedPercentage = (abandonedLeads.length / leads.length) * 100;

                if (abandonedPercentage > 20) {
                    bottlenecks.push({
                        id: "abandoned-leads",
                        title: "Leads Sem Acompanhamento",
                        severity: abandonedPercentage > 40 ? "high" : "medium",
                        category: "engagement",
                        metric: "Leads Abandonados",
                        currentValue: `${abandonedLeads.length} leads`,
                        threshold: "Max 20% sem contato",
                        impact: `${abandonedLeads.length} leads não receberam contato nos últimos 7 dias. Alto risco de perda.`,
                        suggestion: "Configure follow-up automático. Reatribua leads antigos. Crie sequência de nutrição.",
                        actionUrl: "/comercial?tab=leads&filter=abandoned",
                        priority: 8,
                    });
                }
            }

            // =============================================
            // 4. DEALS PARADOS NO PIPELINE
            // =============================================
            const activeDeals = deals.filter(d => !d.closed_at);
            const stagnantDeals = activeDeals.filter(deal => {
                const lastUpdate = deal.updated_at
                    ? parseISO(deal.updated_at)
                    : parseISO(deal.created_at);
                return differenceInDays(now, lastUpdate) > 14;
            });

            if (stagnantDeals.length > 0 && activeDeals.length > 0) {
                const stagnantPercentage = (stagnantDeals.length / activeDeals.length) * 100;
                const totalStagnantValue = stagnantDeals.reduce((sum, d) => sum + (d.value || 0), 0);

                if (stagnantPercentage > 25) {
                    bottlenecks.push({
                        id: "stagnant-deals",
                        title: "Deals Estagnados no Pipeline",
                        severity: stagnantPercentage > 50 ? "high" : "medium",
                        category: "conversion",
                        metric: "Deals sem movimentação",
                        currentValue: `${stagnantDeals.length} deals`,
                        threshold: "Max 25% estagnados",
                        impact: `${stagnantDeals.length} deals parados há +14 dias, representando R$ ${totalStagnantValue.toLocaleString('pt-BR')} em potencial perdido.`,
                        suggestion: "Revise o status de cada deal. Defina próximas ações claras. Considere encerrar deals sem potencial.",
                        actionUrl: "/comercial?tab=pipeline",
                        priority: 7,
                    });
                }
            }

            // =============================================
            // 5. TEMPO DE CICLO DE VENDAS
            // =============================================
            const closedDeals = deals.filter(d => d.closed_at);
            if (closedDeals.length >= 3) {
                const avgCycleDays = closedDeals.reduce((sum, deal) => {
                    return sum + differenceInDays(parseISO(deal.closed_at!), parseISO(deal.created_at));
                }, 0) / closedDeals.length;

                const prevClosedDeals = prevDealsData.filter(d => d.closed_at);
                const prevAvgCycle = prevClosedDeals.length > 0
                    ? prevClosedDeals.reduce((sum, deal) => {
                        return sum + differenceInDays(parseISO(deal.closed_at!), parseISO(deal.created_at));
                    }, 0) / prevClosedDeals.length
                    : 0;

                const trend = avgCycleDays < prevAvgCycle ? "improving" :
                    avgCycleDays > prevAvgCycle ? "declining" : "stable";

                if (avgCycleDays > 21) {
                    bottlenecks.push({
                        id: "long-sales-cycle",
                        title: "Ciclo de Vendas Longo",
                        severity: avgCycleDays > 45 ? "high" : avgCycleDays > 30 ? "medium" : "low",
                        category: "conversion",
                        metric: "Ciclo médio de vendas",
                        currentValue: `${Math.round(avgCycleDays)} dias`,
                        threshold: "21 dias",
                        previousValue: prevAvgCycle > 0 ? `${Math.round(prevAvgCycle)} dias` : undefined,
                        trend,
                        impact: `Deals demoram ${Math.round(avgCycleDays)} dias para fechar. Ciclos longos reduzem previsibilidade de receita.`,
                        suggestion: "Identifique etapas com maior demora. Automatize follow-ups. Qualifique melhor na entrada.",
                        priority: avgCycleDays > 45 ? 7 : 5,
                    });
                }
            }

            // =============================================
            // 6. [REMOVIDO] CHAMADAS PERDIDAS (VoIP - Desativado)
            /*
            const missedCalls = 12; // Exemplo mock
            const totalCalls = 45;
            const missedRate = (missedCalls / totalCalls) * 100;

            if (missedRate > 15) {
                bottlenecks.push({
                    id: 'calls-missed',
                    title: "Alto Volume de Chamadas Perdidas",
                    severity: missedRate > 30 ? "high" : "medium",
                    metric: "Taxa de chamadas perdidas",
                    currentValue: `${missedRate.toFixed(0)}%`,
                    impact: `${missedCalls} chamadas não atendidas nos últimos 7 dias. Potenciais clientes perdidos.`,
                    suggestion: "Revise horários de atendimento. Configure desvio de chamadas. Retorne ligações perdidas.",
                    actionUrl: "/crm/calls"
                });
                
                score -= missedRate > 30 ? 15 : 8;
                issues.attention++;
            }
            */

            // =============================================
            // 7. CONVERSAS SEM RESPOSTA (WhatsApp)
            // =============================================
            const unansweredConvos = convos.filter(c =>
                c.status === "pending" || c.status === "unanswered"
            ).length;

            if (unansweredConvos > 0 && convos.length > 0) {
                const unansweredRate = (unansweredConvos / convos.length) * 100;

                if (unansweredConvos >= 3 || unansweredRate > 20) {
                    bottlenecks.push({
                        id: "unanswered-whatsapp",
                        title: "Mensagens Aguardando Resposta",
                        severity: unansweredConvos > 10 ? "high" : unansweredConvos > 5 ? "medium" : "low",
                        category: "engagement",
                        metric: "Conversas pendentes",
                        currentValue: `${unansweredConvos} conversas`,
                        threshold: "Máximo 3",
                        impact: `${unansweredConvos} clientes aguardando resposta no WhatsApp. Tempo de espera reduz conversão.`,
                        suggestion: "Responda mensagens pendentes imediatamente. Configure respostas automáticas fora do horário.",
                        actionUrl: "/whatsapp?filter=pending",
                        priority: unansweredConvos > 10 ? 9 : 7,
                    });
                }
            }

            // =============================================
            // Sort by priority and severity
            // =============================================
            const sortedBottlenecks = bottlenecks.sort((a, b) => {
                // First by severity
                const severityOrder = { high: 0, medium: 1, low: 2 };
                const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
                if (severityDiff !== 0) return severityDiff;
                // Then by priority
                return b.priority - a.priority;
            });

            // Calculate summary
            const critical = sortedBottlenecks.filter(b => b.severity === "high").length;
            const attention = sortedBottlenecks.filter(b => b.severity === "medium").length;
            const minor = sortedBottlenecks.filter(b => b.severity === "low").length;

            // Health score: start at 100, deduct based on issues
            let healthScore = 100;
            healthScore -= critical * 15;
            healthScore -= attention * 8;
            healthScore -= minor * 3;
            healthScore = Math.max(0, Math.min(100, healthScore));

            return {
                bottlenecks: sortedBottlenecks,
                summary: {
                    critical,
                    attention,
                    minor,
                    healthScore,
                },
            };
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 15 * 60 * 1000, // 15 minutes GC
    });
}
