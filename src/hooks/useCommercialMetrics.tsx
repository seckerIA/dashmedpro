import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useSecretaryDoctors } from "./useSecretaryDoctors";
import { supabase } from "@/integrations/supabase/client";
import { supabaseQueryWithTimeout } from "@/utils/supabaseQuery";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  format,
  parseISO,
  differenceInDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommercialMetrics, PeriodFilter, PeriodRange } from "@/types/metrics";

// Função para calcular o período baseado no filtro
function getPeriodRange(filter: PeriodFilter, customRange?: PeriodRange): PeriodRange {
  const now = new Date();

  switch (filter) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case 'custom':
      return customRange || {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
}

// Função para calcular período anterior
function getPreviousPeriod(current: PeriodRange): PeriodRange {
  const daysDiff = differenceInDays(current.end, current.start);
  return {
    start: subDays(current.start, daysDiff + 1),
    end: subDays(current.start, 1),
  };
}

export function useCommercialMetrics(filter: PeriodFilter = 'month', customRange?: PeriodRange) {
  const { user, loading } = useAuth();
  const { isSecretaria } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();
  const period = getPeriodRange(filter, customRange);
  const previousPeriod = getPreviousPeriod(period);

  const targetUserIds = useMemo(() => {
    if (!user?.id) return [];
    return isSecretaria && doctorIds.length > 0
      ? [user.id, ...doctorIds]
      : [user.id];
  }, [user?.id, isSecretaria, doctorIds]);

  const queryResult = useQuery({
    queryKey: [
      "commercial-metrics",
      user?.id,
      filter,
      period.start.toDateString(),
      period.end.toDateString(),
      targetUserIds
    ],
    queryFn: async ({ signal }): Promise<CommercialMetrics> => {
      if (!user) throw new Error("User not authenticated");

      const periodStartISO = period.start.toISOString();
      const periodEndISO = period.end.toISOString();
      const prevStartISO = previousPeriod.start.toISOString();
      const prevEndISO = previousPeriod.end.toISOString();

      // 1. Buscar consultas médicas com transações financeiras
      const appointmentsQuery = supabase
        .from("medical_appointments" as any)
        .select(`
          id,
          title,
          appointment_type,
          status,
          start_time,
          end_time,
          duration_minutes,
          estimated_value,
          financial_transaction_id,
          completed_at,
          contact_id,
          contact:crm_contacts!medical_appointments_contact_id_fkey(id, full_name)
        `)
        .in("user_id", targetUserIds)
        .gte("start_time", periodStartISO)
        .lte("start_time", periodEndISO);

      // console.log('📡 [useCommercialMetrics] Buscando appointments...');
      const appointmentsResult = await supabaseQueryWithTimeout(appointmentsQuery as any, 90000, signal);
      const { data: appointments, error: appointmentsError } = appointmentsResult as { data: any[], error: any };

      if (appointmentsError) {
        console.error('❌ [useCommercialMetrics] Erro appointments:', appointmentsError);
        throw appointmentsError;
      }
      // console.log(`✅ [useCommercialMetrics] ${appointments?.length || 0} appointments encontrados.`);

      // Preparar IDs de transações para busca paralela
      const transactionIds = appointments
        ?.map(a => a.financial_transaction_id)
        .filter((id): id is string => id !== null && id !== undefined) || [];

      // 2. Buscar transações financeiras do período
      const transactionsQuery = supabase
        .from("financial_transactions")
        .select(`
          id,
          amount,
          type,
          total_costs,
          has_costs,
          transaction_date,
          contact_id,
          description,
          metadata
        `)
        .in("user_id", targetUserIds)
        .eq("type", "entrada")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      // console.log('📡 [useCommercialMetrics] Buscando transactions...');
      const transactionsResult = await supabaseQueryWithTimeout(transactionsQuery as any, 90000, signal);
      const { data: transactions, error: transactionsError } = transactionsResult as { data: any[], error: any };

      if (transactionsError) {
        console.error('❌ [useCommercialMetrics] Erro transactions:', transactionsError);
        throw transactionsError;
      }
      // console.log(`✅ [useCommercialMetrics] ${transactions?.length || 0} transactions encontradas.`);

      // Atualizar transactionIds com as transações encontradas
      const allTransactionIds = transactions?.map(t => t.id) || [];

      // 3-5. Executar queries em paralelo (que não dependem de transactionIds)
      const [
        costsResult,
        leadsResult,
        campaignsResult,
      ] = await Promise.all([
        // 3. Buscar custos detalhados das transações
        allTransactionIds.length > 0
          ? supabaseQueryWithTimeout(
            supabase
              .from("transaction_costs")
              .select("*")
              .in("transaction_id", allTransactionIds) as any,
            30000,
            signal
          )
          : Promise.resolve({ data: [], error: null }),

        supabaseQueryWithTimeout(
          supabase
            .from("commercial_leads")
            .select("*")
            .in("user_id", targetUserIds)
            .gte("created_at", periodStartISO)
            .lte("created_at", periodEndISO) as any,
          30000,
          signal
        ),

        // 5. Buscar campanhas
        supabaseQueryWithTimeout(
          supabase
            .from("commercial_campaigns")
            .select("*")
            .in("user_id", targetUserIds) as any,
          30000,
          signal
        ),
      ]);

      const { data: costs, error: costsError } = costsResult as { data: any[], error: any };
      const { data: leads, error: leadsError } = leadsResult as { data: any[], error: any };
      const { data: campaigns, error: campaignsError } = campaignsResult as { data: any[], error: any };

      if (costsError) throw costsError;
      if (leadsError) {
        console.error('❌ Erro ao buscar leads comerciais:', leadsError);
        throw leadsError;
      }
      if (campaignsError) throw campaignsError;

      // console.log('📊 useCommercialMetrics - Leads encontrados:', {
      //   total: leads?.length || 0,
      //   periodStart: periodStartISO,
      //   periodEnd: periodEndISO,
      //   leads: leads?.slice(0, 3).map(l => ({ id: l.id, name: l.name, created_at: l.created_at })),
      // });

      // 6-8. Executar queries restantes em paralelo
      const [
        salesResult,
        dealsResult,
        prevTransactionsResult,
        prevAppointmentsResult,
      ] = await Promise.all([
        // 6. Buscar vendas comerciais
        supabaseQueryWithTimeout(
          supabase
            .from("commercial_sales")
            .select("*")
            .in("user_id", targetUserIds)
            .gte("sale_date", format(period.start, "yyyy-MM-dd"))
            .lte("sale_date", format(period.end, "yyyy-MM-dd")) as any,
          30000,
          signal
        ),

        // 7. Buscar deals do CRM
        supabaseQueryWithTimeout(
          supabase
            .from("crm_deals")
            .select(`
              id,
              title,
              stage,
              value,
              created_at,
              closed_at,
              contact_id
            `)
            .in("user_id", targetUserIds)
            .gte("created_at", periodStartISO)
            .lte("created_at", periodEndISO) as any,
          30000,
          signal
        ),

        // 8a. Buscar transações do período anterior
        supabaseQueryWithTimeout(
          supabase
            .from("financial_transactions")
            .select("amount, type, total_costs")
            .in("user_id", targetUserIds)
            .eq("type", "entrada")
            .eq("status", "concluida")
            .gte("transaction_date", format(previousPeriod.start, "yyyy-MM-dd"))
            .lte("transaction_date", format(previousPeriod.end, "yyyy-MM-dd")) as any,
          30000,
          signal
        ),

        // 8b. Buscar appointments do período anterior
        supabaseQueryWithTimeout(
          supabase
            .from("medical_appointments")
            .select("id")
            .in("user_id", targetUserIds)
            .gte("start_time", prevStartISO)
            .lte("start_time", prevEndISO) as any,
          30000,
          signal
        ),
      ]);

      const { data: sales, error: salesError } = salesResult as { data: any[], error: any };
      const { data: deals, error: dealsError } = dealsResult as { data: any[], error: any };
      const { data: prevTransactions } = prevTransactionsResult as { data: any[], error: any };
      const { data: prevAppointments } = prevAppointmentsResult as { data: any[], error: any };

      if (salesError) throw salesError;
      if (dealsError) throw dealsError;

      // ========== CÁLCULOS DE MÉTRICAS ==========

      // Mapear transações por appointment
      const transactionMap = new Map(
        transactions?.map(t => [t.id, t]) || []
      );

      const costsMap = new Map<string, number>();
      costs?.forEach(cost => {
        const current = costsMap.get(cost.transaction_id) || 0;
        costsMap.set(cost.transaction_id, current + Number(cost.amount));
      });

      // Custo por consulta - incluir TODAS as consultas completadas (com ou sem transação financeira)
      const completedAppointments = appointments?.filter(a =>
        a.status === 'completed'
      ) || [];

      const appointmentCosts = completedAppointments.map(apt => {
        const transaction = apt.financial_transaction_id ? transactionMap.get(apt.financial_transaction_id) : null;
        // Usar valor da transação financeira se existir, senão usar estimated_value da consulta
        const revenue = transaction?.amount || apt.estimated_value || 0;
        const costs = transaction ? (transaction.total_costs || costsMap.get(apt.financial_transaction_id!) || 0) : 0;
        const netProfit = revenue - costs;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
          appointmentId: apt.id,
          appointmentTitle: apt.title,
          appointmentDate: apt.start_time,
          revenue: Number(revenue),
          costs: Number(costs),
          netProfit: Number(netProfit),
          margin: Number(margin),
        };
      });

      const totalCosts = appointmentCosts.reduce((sum, a) => sum + a.costs, 0);

      // Receita de consultas completadas - usar estimated_value se não houver transação
      const appointmentsRevenue = appointmentCosts.reduce((sum, a) => sum + a.revenue, 0);

      // Também incluir consultas agendadas/confirmadas que ainda não foram completadas mas têm valor estimado
      const pendingAppointments = appointments?.filter(a =>
        (a.status === 'scheduled' || a.status === 'confirmed') && a.estimated_value
      ) || [];
      const pendingRevenue = pendingAppointments.reduce((sum, apt) => sum + Number(apt.estimated_value || 0), 0);

      // Receita de vendas comerciais
      const salesRevenue = sales?.reduce((sum, s) => sum + Number(s.value || 0), 0) || 0;

      // Receita total (consultas completadas + consultas agendadas com valor estimado + vendas)
      const totalRevenue = appointmentsRevenue + pendingRevenue + salesRevenue;
      const avgCostPerAppointment = completedAppointments.length > 0
        ? totalCosts / completedAppointments.length
        : 0;

      // ROI
      const totalROI = totalCosts > 0
        ? ((totalRevenue - totalCosts) / totalCosts) * 100
        : 0;

      // ROI por campanha
      const campaignROI = campaigns?.map(campaign => {
        const campaignLeads = leads?.filter(l =>
          l.origin === campaign.name || l.notes?.includes(campaign.id)
        ) || [];
        const campaignSales = sales?.filter(s =>
          s.campaign_id === campaign.id
        ) || [];
        const campaignRevenue = campaignSales.reduce((sum, s) => sum + (s.value || 0), 0);
        const campaignCost = campaign.budget || 0;
        const roi = campaignCost > 0 ? ((campaignRevenue - campaignCost) / campaignCost) * 100 : 0;

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          revenue: campaignRevenue,
          costs: campaignCost,
          roi: roi,
        };
      }) || [];

      // Margem de lucro
      const grossMargin = totalRevenue > 0
        ? ((totalRevenue - totalCosts) / totalRevenue) * 100
        : 0;

      // Calcular despesas gerais (saídas) do período
      const expensesQuery = supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      const expensesResult = await supabaseQueryWithTimeout(expensesQuery as any, 60000, signal);
      const { data: expenses } = expensesResult as { data: any[], error: any };

      const totalExpenses = (expenses as any[])?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const netMargin = totalRevenue > 0
        ? ((totalRevenue - totalCosts - totalExpenses) / totalRevenue) * 100
        : 0;

      // Receita por hora
      const totalMinutes = completedAppointments.reduce((sum, apt) => {
        return sum + (apt.duration_minutes || 30);
      }, 0);
      const totalHours = totalMinutes / 60;
      const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;

      // Receita por hora do dia
      const revenueByHour = Array.from({ length: 24 }, (_, hourIndex) => {
        const hourAppointments = completedAppointments.filter(apt => {
          const appointmentHour = new Date(apt.start_time).getHours();
          return appointmentHour === hourIndex;
        });
        const hourRevenue = hourAppointments.reduce((sum, apt) => {
          const transaction = transactionMap.get(apt.financial_transaction_id!);
          return sum + Number(transaction?.amount || apt.estimated_value || 0);
        }, 0);
        return {
          hour: hourIndex,
          revenue: hourRevenue,
          appointments: hourAppointments.length,
        };
      });

      // Ticket médio - usar total de appointments (completadas + agendadas) se houver receita
      const totalAppointmentsForAverage = completedAppointments.length + pendingAppointments.length;
      const avgTicketPerAppointment = totalAppointmentsForAverage > 0
        ? totalRevenue / totalAppointmentsForAverage
        : 0;

      // LTV por paciente
      const patientRevenueMap = new Map<string, { revenue: number; costs: number; appointments: number; name: string }>();
      completedAppointments.forEach(apt => {
        if (!apt.contact_id) return;
        const transaction = transactionMap.get(apt.financial_transaction_id!);
        const revenue = transaction?.amount || apt.estimated_value || 0;
        const costs = transaction?.total_costs || costsMap.get(apt.financial_transaction_id!) || 0;

        const current = patientRevenueMap.get(apt.contact_id) || {
          revenue: 0,
          costs: 0,
          appointments: 0,
          name: apt.contact?.full_name || 'Desconhecido',
        };

        patientRevenueMap.set(apt.contact_id, {
          revenue: current.revenue + Number(revenue),
          costs: current.costs + Number(costs),
          appointments: current.appointments + 1,
          name: current.name,
        });
      });

      const ltvByPatient = Array.from(patientRevenueMap.entries()).map(([id, data]) => ({
        patientId: id,
        patientName: data.name,
        totalRevenue: data.revenue,
        totalCosts: data.costs,
        netValue: data.revenue - data.costs,
        appointments: data.appointments,
      }));

      const avgLTV = ltvByPatient.length > 0
        ? ltvByPatient.reduce((sum, p) => sum + p.netValue, 0) / ltvByPatient.length
        : 0;

      // CAC
      const totalCampaignCost = campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const avgCAC = convertedLeads > 0 ? totalCampaignCost / convertedLeads : 0;

      // Taxa de conversão
      const totalLeads = leads?.length || 0;
      const leadsToAppointments = totalLeads > 0
        ? (completedAppointments.length / totalLeads) * 100
        : 0;
      const appointmentsToSales = completedAppointments.length > 0
        ? ((sales?.length || 0) / completedAppointments.length) * 100
        : 0;
      const overallConversion = totalLeads > 0
        ? ((sales?.length || 0) / totalLeads) * 100
        : 0;

      // Buscar procedimentos do catálogo (total de procedimentos ativos cadastrados) - MOVER PARA ANTES DO LOG
      const proceduresQuery = supabase
        .from("commercial_procedures")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const proceduresResult = await supabaseQueryWithTimeout(proceduresQuery as any, 60000, signal);
      const { data: procedures, error: proceduresError } = proceduresResult as { data: any[], error: any };

      // Contar procedimentos ativos no catálogo
      const scheduledProcedures = (procedures as any[])?.length || 0;

      // console.log('📊 useCommercialMetrics - Métricas calculadas:', {
      //   totalLeads,
      //   leadsData: leads?.slice(0, 3).map(l => ({ id: l.id, name: l.name, created_at: l.created_at })),
      //   completedAppointments: completedAppointments.length,
      //   appointmentsData: completedAppointments.slice(0, 3).map(a => ({ id: a.id, title: a.title, estimated_value: a.estimated_value, status: a.status })),
      //   sales: sales?.length || 0,
      //   overallConversion: overallConversion.toFixed(2),
      //   totalRevenue,
      //   appointmentsRevenue,
      //   pendingRevenue,
      //   salesRevenue,
      //   avgTicketPerAppointment: avgTicketPerAppointment.toFixed(2),
      //   scheduledProcedures,
      //   proceduresCount: procedures?.length || 0,
      // });

      // Taxa de ocupação
      const workDays = differenceInDays(period.end, period.start) + 1;
      const workHoursPerDay = 8; // Assumindo 8 horas de trabalho por dia
      const totalAvailableSlots = workDays * workHoursPerDay * 4; // 4 slots de 15min por hora
      const scheduledSlots = completedAppointments.length;
      const occupancyRate = totalAvailableSlots > 0
        ? (scheduledSlots / totalAvailableSlots) * 100
        : 0;

      // Tempo médio de ciclo de vendas
      const closedDeals = deals?.filter(d => d.closed_at) || [];
      const avgSalesCycle = closedDeals.length > 0
        ? closedDeals.reduce((sum, deal) => {
          const created = parseISO(deal.created_at);
          const closed = parseISO(deal.closed_at!);
          return sum + differenceInDays(closed, created);
        }, 0) / closedDeals.length
        : 0;

      // Eficiência por procedimento
      const procedureMap = new Map<string, { revenue: number; minutes: number; count: number }>();
      completedAppointments.forEach(apt => {
        const transaction = transactionMap.get(apt.financial_transaction_id!);
        const revenue = transaction?.amount || apt.estimated_value || 0;
        const type = apt.appointment_type || 'other';

        const current = procedureMap.get(type) || { revenue: 0, minutes: 0, count: 0 };
        procedureMap.set(type, {
          revenue: current.revenue + Number(revenue),
          minutes: current.minutes + Number(apt.duration_minutes || 30),
          count: current.count + 1,
        });
      });

      const procedureEfficiency = Array.from(procedureMap.entries()).map(([type, data]) => ({
        procedureType: type,
        averageDuration: data.count > 0 ? data.minutes / data.count : 0,
        averageRevenue: data.count > 0 ? data.revenue / data.count : 0,
        revenuePerMinute: data.minutes > 0 ? data.revenue / data.minutes : 0,
        count: data.count,
      }));

      // Comparações com período anterior
      const prevRevenue = prevTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const prevCosts = prevTransactions?.reduce((sum, t) => sum + Number(t.total_costs || 0), 0) || 0;
      const prevProfit = prevRevenue - prevCosts;
      const prevAppointmentsCount = prevAppointments?.length || 0;

      const revenueChange = prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : 0;
      const costsChange = prevCosts > 0
        ? ((totalCosts - prevCosts) / prevCosts) * 100
        : 0;
      const profitChange = prevProfit !== 0
        ? (((totalRevenue - totalCosts) - prevProfit) / Math.abs(prevProfit)) * 100
        : 0;
      const appointmentsChange = prevAppointmentsCount > 0
        ? ((completedAppointments.length - prevAppointmentsCount) / prevAppointmentsCount) * 100
        : 0;

      // Calcular pacientes novos (contatos criados no período)
      const newContactsQuery = supabase
        .from("crm_contacts")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", periodStartISO)
        .lte("created_at", periodEndISO);

      const newContactsResult = await supabaseQueryWithTimeout(newContactsQuery as any, 60000, signal);
      const { data: newContacts } = newContactsResult as { data: any[], error: any };

      const newPatients = (newContacts as any[])?.length || 0;

      // Preparar dados do funil - Fix: Handle when leads=0 but appointments exist
      // If there are no formal leads but there are appointments, treat appointments as 100%
      const funnelBaseCount = totalLeads > 0 ? totalLeads : completedAppointments.length;
      const funnelData = [
        {
          stage: 'Leads',
          count: totalLeads,
          percentage: totalLeads > 0 ? 100 : 0
        },
        {
          stage: 'Consultas',
          count: completedAppointments.length,
          percentage: funnelBaseCount > 0
            ? Math.min((completedAppointments.length / funnelBaseCount) * 100, 100)
            : (completedAppointments.length > 0 ? 100 : 0)
        },
        {
          stage: 'Vendas',
          count: sales?.length || 0,
          percentage: funnelBaseCount > 0
            ? Math.min(((sales?.length || 0) / funnelBaseCount) * 100, 100)
            : (sales?.length > 0 ? 100 : 0)
        },
      ];

      // Preparar receita por procedimento
      const revenueByProcedure = procedureEfficiency.map(p => ({
        name: p.procedureType,
        value: p.averageRevenue * p.count,
      }));

      // Preparar tendência de leads (últimos 6 meses)
      const leadsTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(period.end);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        leadsTrend.push({
          name: format(monthStart, 'MMM', { locale: ptBR }),
          value: (leads as any[])?.filter(l => {
            const leadDate = parseISO(l.created_at);
            return leadDate >= monthStart && leadDate <= monthEnd;
          }).length || 0,
        });
      }

      // Preparar comparação mensal
      const monthlyComparison = [
        {
          name: 'Atual',
          value: totalRevenue,
        },
        {
          name: 'Anterior',
          value: prevRevenue,
        },
      ];

      const result = {
        period,
        previousPeriod,
        // Propriedades simplificadas para o dashboard
        totalLeads,
        conversionRate: overallConversion,
        totalRevenue,
        averageRevenue: avgTicketPerAppointment,
        newPatients,
        scheduledProcedures,
        funnelData,
        revenueByProcedure,
        leadsTrend,
        monthlyComparison,
        financial: {
          costPerAppointment: {
            average: avgCostPerAppointment,
            total: totalCosts,
            count: completedAppointments.length,
            individual: appointmentCosts,
          },
          roi: {
            overall: totalROI,
            byCampaign: campaignROI,
            byPeriod: [], // Pode ser preenchido com dados históricos
          },
          profitMargin: {
            gross: grossMargin,
            net: netMargin,
            byAppointment: procedureEfficiency.map(p => {
              const avgCostsPerAppointment = completedAppointments.length > 0
                ? totalCosts / completedAppointments.length
                : 0;
              const avgExpensesPerAppointment = completedAppointments.length > 0
                ? totalExpenses / completedAppointments.length
                : 0;
              return {
                appointmentType: p.procedureType,
                grossMargin: p.averageRevenue > 0
                  ? ((p.averageRevenue - avgCostsPerAppointment) / p.averageRevenue) * 100
                  : 0,
                netMargin: p.averageRevenue > 0
                  ? ((p.averageRevenue - avgCostsPerAppointment - avgExpensesPerAppointment) / p.averageRevenue) * 100
                  : 0,
                revenue: p.averageRevenue,
                costs: avgCostsPerAppointment,
              };
            }),
          },
          revenuePerHour: {
            average: revenuePerHour,
            byHour: revenueByHour,
            totalHours: totalHours,
          },
          averageTicket: {
            perAppointment: avgTicketPerAppointment,
            perProcedure: sales?.length > 0
              ? sales.reduce((sum, s) => sum + (s.value || 0), 0) / sales.length
              : 0,
            byType: procedureEfficiency.map(p => ({
              type: p.procedureType,
              average: p.averageRevenue,
              count: p.count,
            })),
          },
        },
        customer: {
          ltv: {
            average: avgLTV,
            byPatient: ltvByPatient,
          },
          cac: {
            average: avgCAC,
            byChannel: campaignROI.map(c => ({
              channel: c.campaignName,
              cost: c.costs,
              acquisitions: convertedLeads,
              cac: avgCAC,
            })),
          },
          retentionRate: {
            overall: 0, // Precisa de cálculo mais complexo
            byPeriod: [],
          },
          costPerConvertedLead: {
            average: avgCAC,
            byOrigin: leads?.reduce((acc, lead) => {
              const existing = acc.find(a => a.origin === lead.origin);
              if (existing) {
                existing.converted += lead.status === 'converted' ? 1 : 0;
              } else {
                acc.push({
                  origin: lead.origin,
                  cost: 0, // Precisa mapear custo por origem
                  converted: lead.status === 'converted' ? 1 : 0,
                  costPerLead: 0,
                });
              }
              return acc;
            }, [] as Array<{ origin: string; cost: number; converted: number; costPerLead: number }>) || [],
          },
        },
        operational: {
          conversionRate: {
            leadsToAppointments: leadsToAppointments,
            appointmentsToSales: appointmentsToSales,
            overall: overallConversion,
            funnel: [
              { stage: 'Leads', count: totalLeads, percentage: 100 },
              { stage: 'Consultas', count: completedAppointments.length, percentage: leadsToAppointments },
              { stage: 'Vendas', count: sales?.length || 0, percentage: overallConversion },
            ],
          },
          occupancyRate: {
            overall: occupancyRate,
            byDay: [],
            byWeek: [],
          },
          salesCycle: {
            averageDays: avgSalesCycle,
            byStage: [],
          },
          procedureEfficiency: procedureEfficiency,
        },
        marketing: {
          campaignROI: campaignROI.map(c => ({
            campaignId: c.campaignId,
            campaignName: c.campaignName,
            campaignType: campaigns?.find(camp => camp.id === c.campaignId)?.type || 'other',
            investment: c.costs,
            revenue: c.revenue,
            roi: c.roi,
            leads: leads?.filter(l => l.notes?.includes(c.campaignId)).length || 0,
            conversions: sales?.filter(s => s.campaign_id === c.campaignId).length || 0,
          })),
          acquisitionCostByChannel: campaignROI.map(c => ({
            channel: c.campaignName,
            totalCost: c.costs,
            acquisitions: convertedLeads,
            costPerAcquisition: avgCAC,
          })),
        },
        comparisons: {
          revenue: {
            current: totalRevenue,
            previous: prevRevenue,
            change: revenueChange,
          },
          costs: {
            current: totalCosts,
            previous: prevCosts,
            change: costsChange,
          },
          profit: {
            current: totalRevenue - totalCosts,
            previous: prevProfit,
            change: profitChange,
          },
          appointments: {
            current: completedAppointments.length,
            previous: prevAppointmentsCount,
            change: appointmentsChange,
          },
        },
      };

      console.log('✅ useCommercialMetrics - Retornando resultado:', {
        totalLeads: result.totalLeads,
        totalRevenue: result.totalRevenue,
        scheduledProcedures: result.scheduledProcedures,
        newPatients: result.newPatients,
        conversionRate: result.conversionRate,
        averageRevenue: result.averageRevenue,
      });

      try {
        // Verificar se todas as propriedades obrigatórias estão presentes
        if (!result.financial || !result.customer || !result.operational || !result.marketing || !result.comparisons) {
          console.error('❌ useCommercialMetrics - Propriedades obrigatórias faltando:', {
            hasFinancial: !!result.financial,
            hasCustomer: !!result.customer,
            hasOperational: !!result.operational,
            hasMarketing: !!result.marketing,
            hasComparisons: !!result.comparisons,
          });
          throw new Error('Propriedades obrigatórias faltando no resultado');
        }

        return result;
      } catch (error) {
        console.error('❌ useCommercialMetrics - Erro ao retornar resultado:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !loading, // Aguardar auth terminar de carregar
    staleTime: 10 * 60 * 1000, // Aumentado para 10 minutos para evitar picos de recarregamento
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    metrics: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
}
