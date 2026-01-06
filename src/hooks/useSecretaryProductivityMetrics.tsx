/**
 * Hook for additional secretary productivity metrics
 * Includes: response time, call metrics, confirmation rates
 * @module hooks/useSecretaryProductivityMetrics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, subDays, differenceInMinutes, parseISO } from 'date-fns';

export interface ProductivityMetrics {
    // Response Time
    avgResponseTimeMinutes: number;
    responsesUnder5Min: number;
    responsesOver30Min: number;
    totalResponses: number;

    // Call Metrics
    callsToday: number;
    callsThisWeek: number;
    avgCallDuration: number;
    missedCalls: number;

    // Confirmation Rates
    confirmationRate: number;
    noShowRate: number;
    cancellationRate: number;

    // Productivity
    appointmentsScheduledToday: number;
    appointmentsScheduledThisWeek: number;
    messagesHandledToday: number;

    // Performance Score (0-100)
    performanceScore: number;
}

const emptyMetrics: ProductivityMetrics = {
    avgResponseTimeMinutes: 0,
    responsesUnder5Min: 0,
    responsesOver30Min: 0,
    totalResponses: 0,
    callsToday: 0,
    callsThisWeek: 0,
    avgCallDuration: 0,
    missedCalls: 0,
    confirmationRate: 0,
    noShowRate: 0,
    cancellationRate: 0,
    appointmentsScheduledToday: 0,
    appointmentsScheduledThisWeek: 0,
    messagesHandledToday: 0,
    performanceScore: 0,
};

export function useSecretaryProductivityMetrics() {
    const { user } = useAuth();
    const { doctorIds } = useSecretaryDoctors();

    return useQuery({
        queryKey: ['secretary-productivity-metrics', user?.id, doctorIds],
        queryFn: async (): Promise<ProductivityMetrics> => {
            if (!user?.id) return emptyMetrics;

            const now = new Date();
            const todayStart = startOfDay(now);
            const todayEnd = endOfDay(now);
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            const monthStart = startOfMonth(now);

            const targetUserIds = doctorIds?.length > 0
                ? [user.id, ...doctorIds]
                : [user.id];

            // 1. Fetch WhatsApp message response times (from AI analysis or manual)
            const { data: messages } = await supabase
                .from('whatsapp_messages' as any)
                .select('created_at, direction')
                .in('user_id', targetUserIds)
                .gte('created_at', monthStart.toISOString())
                .order('created_at', { ascending: true });

            // Calculate response times by pairing inbound with outbound
            let responseTimes: number[] = [];
            let lastInbound: Date | null = null;

            (messages || []).forEach((msg: any) => {
                if (msg.direction === 'inbound') {
                    lastInbound = parseISO(msg.created_at);
                } else if (msg.direction === 'outbound' && lastInbound) {
                    const responseTime = differenceInMinutes(parseISO(msg.created_at), lastInbound);
                    if (responseTime > 0 && responseTime < 1440) { // Within 24h
                        responseTimes.push(responseTime);
                    }
                    lastInbound = null;
                }
            });

            const avgResponseTimeMinutes = responseTimes.length > 0
                ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                : 0;
            const responsesUnder5Min = responseTimes.filter(t => t <= 5).length;
            const responsesOver30Min = responseTimes.filter(t => t > 30).length;

            // Messages handled today
            const messagesHandledToday = (messages || []).filter((m: any) =>
                m.direction === 'outbound' && parseISO(m.created_at) >= todayStart
            ).length;

            // 2. Fetch call metrics (gracefully handle if table doesn't exist)
            let calls: any[] = [];
            try {
                const { data: callData, error: callError } = await supabase
                    .from('voip_call_sessions' as any)
                    .select('initiated_at, duration_seconds, status, direction')
                    .in('user_id', targetUserIds)
                    .gte('initiated_at', weekStart.toISOString());

                if (!callError) {
                    calls = callData || [];
                }
            } catch (e) {
                // Table doesn't exist yet, skip call metrics
                console.log('[ProductivityMetrics] VOIP tables not available');
            }

            const callsToday = calls.filter((c: any) =>
                parseISO(c.initiated_at) >= todayStart
            ).length;
            const callsThisWeek = calls.length;

            const completedCalls = calls.filter((c: any) => c.status === 'completed');
            const avgCallDuration = completedCalls.length > 0
                ? completedCalls.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0) / completedCalls.length
                : 0;

            const missedCalls = calls.filter((c: any) =>
                c.direction === 'inbound' && ['no_answer', 'busy', 'cancelled'].includes(c.status)
            ).length;

            // 3. Fetch appointment confirmation stats
            const { data: appointments } = await supabase
                .from('medical_appointments' as any)
                .select('status, created_at, user_id')
                .in('user_id', targetUserIds)
                .gte('start_time', monthStart.toISOString());

            const totalAppointments = (appointments || []).length;
            const confirmedAppointments = (appointments || []).filter((a: any) =>
                ['confirmed', 'completed'].includes(a.status)
            ).length;
            const noShowAppointments = (appointments || []).filter((a: any) => a.status === 'no_show').length;
            const cancelledAppointments = (appointments || []).filter((a: any) => a.status === 'cancelled').length;

            const confirmationRate = totalAppointments > 0
                ? (confirmedAppointments / totalAppointments) * 100
                : 0;
            const noShowRate = totalAppointments > 0
                ? (noShowAppointments / totalAppointments) * 100
                : 0;
            const cancellationRate = totalAppointments > 0
                ? (cancelledAppointments / totalAppointments) * 100
                : 0;

            // 4. Appointments scheduled by this user
            const appointmentsScheduledToday = (appointments || []).filter((a: any) =>
                parseISO(a.created_at) >= todayStart && parseISO(a.created_at) <= todayEnd
            ).length;
            const appointmentsScheduledThisWeek = (appointments || []).filter((a: any) =>
                parseISO(a.created_at) >= weekStart && parseISO(a.created_at) <= weekEnd
            ).length;

            // 5. Calculate performance score (0-100)
            let score = 50; // Base score

            // Response time bonus (up to +20)
            if (avgResponseTimeMinutes <= 5) score += 20;
            else if (avgResponseTimeMinutes <= 15) score += 10;
            else if (avgResponseTimeMinutes <= 30) score += 5;

            // Confirmation rate bonus (up to +15)
            if (confirmationRate >= 90) score += 15;
            else if (confirmationRate >= 80) score += 10;
            else if (confirmationRate >= 70) score += 5;

            // No-show penalty (up to -15)
            if (noShowRate > 20) score -= 15;
            else if (noShowRate > 10) score -= 10;
            else if (noShowRate > 5) score -= 5;

            // Activity bonus (up to +15)
            if (appointmentsScheduledThisWeek >= 20) score += 15;
            else if (appointmentsScheduledThisWeek >= 10) score += 10;
            else if (appointmentsScheduledThisWeek >= 5) score += 5;

            const performanceScore = Math.max(0, Math.min(100, score));

            return {
                avgResponseTimeMinutes,
                responsesUnder5Min,
                responsesOver30Min,
                totalResponses: responseTimes.length,
                callsToday,
                callsThisWeek,
                avgCallDuration,
                missedCalls,
                confirmationRate,
                noShowRate,
                cancellationRate,
                appointmentsScheduledToday,
                appointmentsScheduledThisWeek,
                messagesHandledToday,
                performanceScore,
            };
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });
}
