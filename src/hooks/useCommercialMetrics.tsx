import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
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
import { parseLocalDate } from "@/utils/dateUtils";

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

export function useCommercialMetrics(filter: PeriodFilter = 'month', customRange?: PeriodRange, viewAsUserIds?: string[]) {
  const { user, loading } = useAuth();
  const { isSecretaria, isAdmin } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();
  const period = getPeriodRange(filter, customRange);
  const previousPeriod = getPreviousPeriod(period);

  // Estado para armazenar todos os user IDs quando admin
  const [allActiveUserIds, setAllActiveUserIds] = useState<string[]>([]);

  // Buscar todos os usuários ativos quando admin/dono
  useEffect(() => {
    if (!isAdmin || !user?.id) {
      setAllActiveUserIds([]);
      return;
    }

    const fetchAllUsers = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .limit(100);

      if (profiles && profiles.length > 0) {
        setAllActiveUserIds((profiles as { id: string }[]).map(p => p.id));
      }
    };

    fetchAllUsers();
  }, [isAdmin, user?.id]);

  const targetUserIds = useMemo(() => {
    if (!user?.id) return [];

    // Se viewAsUserIds for fornecido (filtro manual)
    if (viewAsUserIds && viewAsUserIds.length > 0) {
      return viewAsUserIds;
    }

    // Admin/Dono: ver dados de todos os usuários ativos
    if (isAdmin && allActiveUserIds.length > 0) {
      return allActiveUserIds;
    }

    // Secretária: ver dados próprios + médicos vinculados
    if (isSecretaria && doctorIds.length > 0) {
      return [user.id, ...doctorIds];
    }

    // Outros roles: apenas próprios dados
    return [user.id];
  }, [user?.id, isAdmin, isSecretaria, doctorIds, allActiveUserIds, viewAsUserIds]);

  // Helper to apply correct filter: .eq() for single value, .in() for multiple
  // PostgREST requires multiple values for .in() filter, single value causes 400 error
  const applyUserFilter = <T extends { eq: (col: string, val: string) => T; in: (col: string, vals: string[]) => T }>(
    query: T,
    userIds: string[]
  ): T => {
    if (userIds.length === 1) {
      return query.eq("user_id", userIds[0]);
    }
    return query.in("user_id", userIds);
  };

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

      const fromTable = (table: string) => (supabase.from(table as any) as any);

      const appointmentsQuery = applyUserFilter(
        fromTable("medical_appointments")
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
          `),
        targetUserIds
      )
        .gte("start_time", periodStartISO)
        .lte("start_time", periodEndISO);

      // console.log('📡 [useCommercialMetrics] Buscando appointments...');
      // 1-4. Executar queries independentes em paralelo

      // 2. Definir query de transações
      const transactionsQuery = applyUserFilter(
        fromTable("financial_transactions")
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
          `),
        targetUserIds
      )
        .eq("type", "entrada")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      // Executar queries independentes em paralelo
      const [
        appointmentsResult,
        transactionsResult,
        leadsResult,
        campaignsResult
      ] = await Promise.all([
        // 1. Appointments
        supabaseQueryWithTimeout(appointmentsQuery as any, 25000, signal),
        // 2. Transactions
        supabaseQueryWithTimeout(transactionsQuery as any, 25000, signal),
        // 3. Leads
        supabaseQueryWithTimeout(
          applyUserFilter(
            fromTable("commercial_leads")
              .select("*"),
            targetUserIds
          )
            .gte("created_at", periodStartISO)
            .lte("created_at", periodEndISO) as any,
          25000,
          signal
        ),
        // 4. Campaigns
        supabaseQueryWithTimeout(
          applyUserFilter(
            fromTable("commercial_campaigns")
              .select("*"),
            targetUserIds
          ) as any,
          25000,
          signal
        )
      ]);

      const { data: appointments, error: appointmentsError } = appointmentsResult as { data: any[], error: any };
      const { data: transactions, error: transactionsError } = transactionsResult as { data: any[], error: any };
      const { data: leads, error: leadsError } = leadsResult as { data: any[], error: any };
      const { data: campaigns, error: campaignsError } = campaignsResult as { data: any[], error: any };

      if (appointmentsError) throw appointmentsError;
      if (transactionsError) throw transactionsError;
      if (leadsError && !leadsError.message?.includes('AbortError')) console.error('❌ Erro leads:', leadsError);

      // Preparar dados para próxima query
      const allTransactionIds = transactions?.map(t => t.id) || [];

      // 5. Buscar custos (depende das transações)
      const costsResult = allTransactionIds.length > 0
        ? await supabaseQueryWithTimeout(
          fromTable("transaction_costs")
            .select("*")
            .in("transaction_id", allTransactionIds) as any,
          25000,
          signal
        )
        : { data: [], error: null };

      const { data: costs, error: costsError } = costsResult as { data: any[], error: any };

      if (costsError) throw costsError;
      if (leadsError) {
        if (!leadsError.message?.includes('AbortError') && leadsError.name !== 'AbortError') {
          console.error('❌ Erro ao buscar leads comerciais:', leadsError);
        }
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
          applyUserFilter(
            fromTable("commercial_sales")
              .select("*"),
            targetUserIds
          )
            .gte("sale_date", format(period.start, "yyyy-MM-dd"))
            .lte("sale_date", format(period.end, "yyyy-MM-dd")) as any,
          25000,
          signal
        ),

        // 7. Buscar deals do CRM
        supabaseQueryWithTimeout(
          applyUserFilter(
            fromTable("crm_deals")
              .select(`
                id,
                title,
                stage,
                value,
                created_at,
                closed_at,
                contact_id
              `),
            targetUserIds
          )
            .gte("created_at", periodStartISO)
            .lte("created_at", periodEndISO) as any,
          25000,
          signal
        ),

        // 8a. Buscar transações do período anterior
        supabaseQueryWithTimeout(
          applyUserFilter(
            fromTable("financial_transactions")
              .select("amount, type, total_costs"),
            targetUserIds
          )
            .eq("type", "entrada")
            .eq("status", "concluida")
            .gte("transaction_date", format(previousPeriod.start, "yyyy-MM-dd"))
            .lte("transaction_date", format(previousPeriod.end, "yyyy-MM-dd")) as any,
          25000,
          signal
        ),

        // 8b. Buscar appointments do período anterior
        supabaseQueryWithTimeout(
          applyUserFilter(
            fromTable("medical_appointments")
              .select("id"),
            targetUserIds
          )
            .gte("start_time", prevStartISO)
            .lte("start_time", prevEndISO) as any,
          25000,
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
      const expensesQuery = fromTable("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      const expensesResult = await supabaseQueryWithTimeout(expensesQuery as any, 25000, signal);
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
          const appointmentHour = parseLocalDate(apt.start_time).getHours();
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

      // Contar TODOS os agendamentos (não só os completed) para taxa de conversão lead -> consulta
      const allScheduledAppointments = appointments?.filter(a =>
        a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'completed'
      ) || [];

      console.log('📊 [Conversion Debug]', {
        totalLeads,
        statuses: leads?.map(l => l.status),
        salesCount: sales?.length || 0,
        appointmentsCount: allScheduledAppointments.length
      });

      const convertedLeadsCount = leads?.filter(l =>
        l.status === 'converted' ||
        l.status === 'won' ||
        l.status === 'fechado_ganho' ||
        l.status === 'em_tratamento' ||
        l.status === 'finalizado'
      ).length || 0;

      const leadsToAppointments = totalLeads > 0
        ? (allScheduledAppointments.length / totalLeads) * 100
        : 0;
      const appointmentsToSales = allScheduledAppointments.length > 0
        ? ((sales?.length || 0) / allScheduledAppointments.length) * 100
        : 0;

      // Leads perdidos (status que indicam perda)
      const lostLeadsCount = leads?.filter(l =>
        l.status === 'lost' ||
        l.status === 'perdido' ||
        l.status === 'fechado_perdido' ||
        l.status === 'cancelado' ||
        l.status === 'desqualificado'
      ).length || 0;

      // Taxa de conversão: leads que viraram agendamento / total de leads
      // Conta leads únicos que têm pelo menos 1 agendamento associado
      const leadsWithAppointmentsSet = new Set(
        allScheduledAppointments
          ?.filter(a => a.contact_id)
          .map(a => a.contact_id)
      );
      const leadsWithAppointmentsCount = leadsWithAppointmentsSet.size;

      // Se há leads, calcula % que viraram agendamento
      // Se não há leads mas há agendamentos, considera 100% (agendamentos diretos)
      const overallConversion = totalLeads > 0
        ? (leadsWithAppointmentsCount / totalLeads) * 100
        : (allScheduledAppointments.length > 0 ? 100 : 0);

      // Buscar procedimentos do catálogo (total de procedimentos ativos cadastrados) - MOVER PARA ANTES DO LOG
      const proceduresQuery = applyUserFilter(
        fromTable("commercial_procedures")
          .select("id, name"),
        targetUserIds
      ).eq("is_active", true);

      const proceduresResult = await supabaseQueryWithTimeout(proceduresQuery as any, 25000, signal);
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
      const scheduledSlots = allScheduledAppointments.length;
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
      const newContactsQuery = applyUserFilter(
        fromTable("crm_contacts")
          .select("id"),
        targetUserIds
      )
        .gte("created_at", periodStartISO)
        .lte("created_at", periodEndISO);

      const newContactsResult = await supabaseQueryWithTimeout(newContactsQuery as any, 25000, signal);
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
          count: allScheduledAppointments.length,
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

      // Preparar receita por procedimento (Agrupando vendas por nome do procedimento)
      const procedureNamesMap = new Map(procedures?.map(p => [p.id, p.name]) || []);
      const revenueByProcedureMap = new Map<string, number>();

      sales?.forEach(sale => {
        const procedureName = procedureNamesMap.get(sale.procedure_id) || "Outros";
        const currentTotal = revenueByProcedureMap.get(procedureName) || 0;
        revenueByProcedureMap.set(procedureName, currentTotal + Number(sale.value || 0));
      });

      const revenueByProcedure = Array.from(revenueByProcedureMap.entries()).map(([name, value]) => ({
        name,
        value,
      })).sort((a, b) => b.value - a.value);

      // Se não houver vendas, mostrar por tipo de consulta como fallback
      if (revenueByProcedure.length === 0) {
        procedureEfficiency.forEach(p => {
          revenueByProcedure.push({
            name: p.procedureType === 'first_visit' ? 'Primeira Consulta' :
              p.procedureType === 'follow_up' ? 'Retorno' :
                p.procedureType === 'procedure' ? 'Procedimento' : 'Outros',
            value: p.averageRevenue * p.count,
          });
        });
      }

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
            const leadDate = parseLocalDate(l.created_at);
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
              { stage: 'Consultas', count: allScheduledAppointments.length, percentage: leadsToAppointments },
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
    placeholderData: keepPreviousData, // Manter dados anteriores durante refetch
  });

  return {
    metrics: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
}
