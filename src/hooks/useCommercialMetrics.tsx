import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  const period = getPeriodRange(filter, customRange);
  const previousPeriod = getPreviousPeriod(period);

  return useQuery({
    queryKey: ["commercial-metrics", user?.id, filter, period.start.toISOString(), period.end.toISOString()],
    queryFn: async (): Promise<CommercialMetrics> => {
      if (!user) throw new Error("User not authenticated");

      const periodStartISO = period.start.toISOString();
      const periodEndISO = period.end.toISOString();
      const prevStartISO = previousPeriod.start.toISOString();
      const prevEndISO = previousPeriod.end.toISOString();

      // 1. Buscar consultas médicas com transações financeiras
      const { data: appointments, error: appointmentsError } = await supabase
        .from("medical_appointments")
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
        .eq("user_id", user.id)
        .gte("start_time", periodStartISO)
        .lte("start_time", periodEndISO);

      if (appointmentsError) throw appointmentsError;

      // 2. Buscar transações financeiras do período
      const transactionIds = appointments
        ?.map(a => a.financial_transaction_id)
        .filter((id): id is string => id !== null && id !== undefined) || [];

      const { data: transactions, error: transactionsError } = await supabase
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
        .eq("user_id", user.id)
        .eq("type", "entrada")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      if (transactionsError) throw transactionsError;

      // 3. Buscar custos detalhados das transações
      const { data: costs, error: costsError } = await supabase
        .from("transaction_costs")
        .select("*")
        .in("transaction_id", transactions?.map(t => t.id) || []);

      if (costsError) throw costsError;

      // 4. Buscar leads comerciais
      const { data: leads, error: leadsError } = await supabase
        .from("commercial_leads")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", periodStartISO)
        .lte("created_at", periodEndISO);

      if (leadsError) throw leadsError;

      // 5. Buscar campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from("commercial_campaigns")
        .select("*")
        .eq("user_id", user.id);

      if (campaignsError) throw campaignsError;

      // 6. Buscar vendas comerciais
      const { data: sales, error: salesError } = await supabase
        .from("commercial_sales")
        .select("*")
        .eq("user_id", user.id)
        .gte("sale_date", format(period.start, "yyyy-MM-dd"))
        .lte("sale_date", format(period.end, "yyyy-MM-dd"));

      if (salesError) throw salesError;

      // 7. Buscar deals do CRM
      const { data: deals, error: dealsError } = await supabase
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
        .eq("user_id", user.id)
        .gte("created_at", periodStartISO)
        .lte("created_at", periodEndISO);

      if (dealsError) throw dealsError;

      // 8. Buscar dados do período anterior para comparação
      const { data: prevTransactions } = await supabase
        .from("financial_transactions")
        .select("amount, type, total_costs")
        .eq("user_id", user.id)
        .eq("type", "entrada")
        .eq("status", "concluida")
        .gte("transaction_date", format(previousPeriod.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(previousPeriod.end, "yyyy-MM-dd"));

      const { data: prevAppointments } = await supabase
        .from("medical_appointments")
        .select("id")
        .eq("user_id", user.id)
        .gte("start_time", prevStartISO)
        .lte("start_time", prevEndISO);

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

      // Custo por consulta
      const completedAppointments = appointments?.filter(a => 
        a.status === 'completed' && a.financial_transaction_id
      ) || [];

      const appointmentCosts = completedAppointments.map(apt => {
        const transaction = transactionMap.get(apt.financial_transaction_id!);
        const revenue = transaction?.amount || apt.estimated_value || 0;
        const costs = transaction?.total_costs || costsMap.get(apt.financial_transaction_id!) || 0;
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
      const totalRevenue = appointmentCosts.reduce((sum, a) => sum + a.revenue, 0);
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
      const { data: expenses } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "saida")
        .eq("status", "concluida")
        .gte("transaction_date", format(period.start, "yyyy-MM-dd"))
        .lte("transaction_date", format(period.end, "yyyy-MM-dd"));

      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
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

      // Ticket médio
      const avgTicketPerAppointment = completedAppointments.length > 0
        ? totalRevenue / completedAppointments.length
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
          name: (apt.contact as any)?.full_name || 'Desconhecido',
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

      return {
        period,
        previousPeriod,
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
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
  });
}
