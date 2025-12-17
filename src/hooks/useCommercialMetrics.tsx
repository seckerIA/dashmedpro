import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface CommercialMetrics {
  totalLeads: number;
  conversionRate: number;
  totalRevenue: number;
  averageRevenue: number;
  newPatients: number;
  scheduledProcedures: number;
  funnelData: Array<{ stage: string; count: number; percentage: number }>;
  revenueByProcedure: Array<{ name: string; value: number }>;
  leadsTrend: Array<{ name: string; value: number }>;
  monthlyComparison: Array<{ name: string; value: number }>;
}

export function useCommercialMetrics() {
  const { user } = useAuth();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  return useQuery({
    queryKey: ["commercial-metrics", user?.id, monthStart.toISOString()],
    queryFn: async (): Promise<CommercialMetrics> => {
      if (!user) throw new Error("User not authenticated");

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from("commercial_leads")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (leadsError) throw leadsError;

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from("commercial_sales")
        .select("*")
        .eq("user_id", user.id)
        .gte("sale_date", monthStart.toISOString())
        .lte("sale_date", monthEnd.toISOString());

      if (salesError) throw salesError;

      // Fetch appointments for new patients
      const { data: appointments, error: appointmentsError } = await supabase
        .from("medical_appointments")
        .select("id, appointment_type, contact_id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (appointmentsError) throw appointmentsError;

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      
      const totalRevenue = sales?.reduce((sum, s) => sum + (s.value || 0), 0) || 0;
      const averageRevenue = sales && sales.length > 0 ? totalRevenue / sales.length : 0;
      
      const newPatients = new Set(appointments?.map(a => a.contact_id).filter(Boolean)).size;
      const scheduledProcedures = sales?.filter(s => s.status === 'confirmed' || s.status === 'completed').length || 0;

      // Funnel data
      const funnelStages = ['new', 'contacted', 'qualified', 'converted'];
      const funnelData = funnelStages.map(stage => {
        const count = leads?.filter(l => l.status === stage).length || 0;
        const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
        return {
          stage: stage === 'new' ? 'Novo' : stage === 'contacted' ? 'Contatado' : stage === 'qualified' ? 'Qualificado' : 'Convertido',
          count,
          percentage,
        };
      });

      // Revenue by procedure (simplified - would need procedure names)
      const revenueByProcedure = sales?.reduce((acc, sale) => {
        const key = sale.procedure_id || 'Outros';
        if (!acc.find(p => p.name === key)) {
          acc.push({ name: key, value: 0 });
        }
        const item = acc.find(p => p.name === key);
        if (item) item.value += sale.value || 0;
        return acc;
      }, [] as Array<{ name: string; value: number }>) || [];

      // Leads trend (last 7 days)
      const leadsTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        const count = leads?.filter(l => {
          const leadDate = new Date(l.created_at);
          return leadDate >= dayStart && leadDate <= dayEnd;
        }).length || 0;
        return {
          name: dayStart.toLocaleDateString('pt-BR', { weekday: 'short' }),
          value: count,
        };
      });

      // Monthly comparison
      const { data: lastMonthSales } = await supabase
        .from("commercial_sales")
        .select("value")
        .eq("user_id", user.id)
        .gte("sale_date", lastMonthStart.toISOString())
        .lte("sale_date", lastMonthEnd.toISOString());

      const lastMonthRevenue = lastMonthSales?.reduce((sum, s) => sum + (s.value || 0), 0) || 0;

      const monthlyComparison = [
        { name: 'Mês Anterior', value: lastMonthRevenue },
        { name: 'Mês Atual', value: totalRevenue },
      ];

      return {
        totalLeads,
        conversionRate,
        totalRevenue,
        averageRevenue,
        newPatients,
        scheduledProcedures,
        funnelData,
        revenueByProcedure,
        leadsTrend,
        monthlyComparison,
      };
    },
    enabled: !!user,
  });
}






