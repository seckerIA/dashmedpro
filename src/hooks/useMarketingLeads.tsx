import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { supabase } from "@/integrations/supabase/client";

export interface MarketingLead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  origin: string;
  status: string;
  estimated_value?: number | null;
  created_at: string;
  utm_id?: string | null;
  ad_campaign_sync_id?: string | null;
  campaign_name?: string;
  form_name?: string | null;
  ad_name?: string | null;
  platform?: string;
  // CRM data
  crm_contact_id?: string | null;
  crm_deal_id?: string | null;
  deal_stage?: string | null;
  deal_value?: number | null;
  has_appointment?: boolean;
  appointment_status?: string | null;
  appointment_value?: number | null;
  appointment_completed_at?: string | null;
}

export interface LeadConversionMetrics {
  totalLeads: number;
  leadsInCRM: number;
  leadsWithAppointment: number;
  appointmentsCompleted: number;
  leadsByStatus: Record<string, number>;
  leadsByPlatform: Record<string, number>;
  totalRevenue: number;
  averageLeadValue: number;
  conversionRate: number;
}

export function useMarketingLeads(filters?: {
  campaign_id?: string;
  platform?: 'google_ads' | 'meta_ads';
  status?: string;
}) {
  const { data: campaigns } = useAdCampaignsSync();

  return useQuery({
    queryKey: ['marketing-leads', campaigns?.length ?? 0, filters?.campaign_id, filters?.platform, filters?.status],
    queryFn: async (): Promise<MarketingLead[]> => {

      // 1. Buscar formulários SINCRONIZADOS (meta_lead_forms) para filtrar
      const { data: syncedForms } = await (supabase
        .from('meta_lead_forms' as any) as any)
        .select('meta_form_id');

      const syncedFormIds = new Set((syncedForms || []).map((f: any) => f.meta_form_id));

      // 2. Buscar lead_form_submissions com dados CRM
      const { data: formLeads, error: formsError } = await (supabase
        .from('lead_form_submissions' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (formsError) {
        console.error('Error fetching lead forms:', formsError);
      }

      // 3. Filtrar APENAS leads de formulários sincronizados
      const filteredFormLeads = (formLeads || []).filter((lead: any) =>
        syncedFormIds.has(lead.form_id)
      );

      // 4. Buscar dados CRM (deals + appointments) para os leads vinculados
      const contactIds = filteredFormLeads
        .map((l: any) => l.crm_contact_id)
        .filter(Boolean) as string[];
      const dealIds = filteredFormLeads
        .map((l: any) => l.crm_deal_id)
        .filter(Boolean) as string[];

      // Buscar deals do CRM
      let dealsMap = new Map<string, { stage: string; value: number }>();
      if (dealIds.length > 0) {
        const { data: deals } = await supabase
          .from('crm_deals')
          .select('id, stage, value')
          .in('id', dealIds);
        (deals || []).forEach((d: any) => {
          dealsMap.set(d.id, { stage: d.stage, value: Number(d.value) || 0 });
        });
      }

      // Buscar appointments vinculados aos contatos
      let appointmentsMap = new Map<string, { status: string; value: number; completed_at: string | null; start_time: string | null }>();
      if (contactIds.length > 0) {
        const { data: appointments } = await supabase
          .from('medical_appointments')
          .select('contact_id, status, estimated_value, completed_at, start_time')
          .in('contact_id', contactIds);
        (appointments || []).forEach((a: any) => {
          // Guardar o appointment mais relevante (completed > confirmed > scheduled)
          const existing = appointmentsMap.get(a.contact_id);
          const priority: Record<string, number> = { completed: 3, confirmed: 2, scheduled: 1 };
          if (!existing || (priority[a.status] || 0) > (priority[existing.status] || 0)) {
            appointmentsMap.set(a.contact_id, {
              status: a.status,
              value: Number(a.estimated_value) || 0,
              completed_at: a.completed_at || null,
              start_time: a.start_time || null,
            });
          }
        });
      }

      // 5. Mapear para MarketingLead com dados CRM reais
      const formLeadsMapped = filteredFormLeads.map((lead: any) => {
        const campaign = lead.campaign_id
          ? campaigns?.find((c: any) => c.platform_campaign_id === lead.campaign_id)
          : null;

        const deal = lead.crm_deal_id ? dealsMap.get(lead.crm_deal_id) : null;
        const appointment = lead.crm_contact_id ? appointmentsMap.get(lead.crm_contact_id) : null;

        // Status real baseado no CRM
        let realStatus = 'novo';
        if (appointment?.status === 'completed') {
          realStatus = 'convertido';
        } else if (appointment?.status === 'confirmed' || appointment?.status === 'scheduled') {
          realStatus = 'agendado';
        } else if (deal?.stage && deal.stage !== 'lead_novo') {
          realStatus = deal.stage;
        } else if (lead.is_processed && lead.crm_contact_id) {
          realStatus = 'no_crm';
        }

        // Valor real do appointment ou deal
        const realValue = appointment?.value || deal?.value || 0;

        return {
          id: lead.id,
          name: lead.full_name || 'Lead Meta Ads',
          email: lead.email,
          phone: lead.phone_number,
          origin: 'facebook',
          status: realStatus,
          estimated_value: realValue,
          created_at: lead.created_at,
          utm_id: null,
          ad_campaign_sync_id: campaign?.id || null,
          campaign_name: lead.campaign_name || lead.form_name || 'Formulário',
          form_name: lead.form_name || null,
          ad_name: lead.ad_name || null,
          platform: 'meta_ads',
          crm_contact_id: lead.crm_contact_id || null,
          crm_deal_id: lead.crm_deal_id || null,
          deal_stage: deal?.stage || null,
          deal_value: deal?.value || null,
          has_appointment: !!appointment,
          appointment_status: appointment?.status || null,
          appointment_value: appointment?.value || null,
          appointment_completed_at: appointment?.completed_at || appointment?.start_time || null,
        } as MarketingLead;
      });

      return formLeadsMapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: true,
  });
}

export function useMarketingLeadMetrics(filters?: {
  campaign_id?: string;
  platform?: 'google_ads' | 'meta_ads';
  start_date?: string;
  end_date?: string;
}) {
  const { data: leads } = useMarketingLeads(filters);

  return useQuery({
    queryKey: ['marketing-lead-metrics', leads?.length ?? 0, filters?.campaign_id, filters?.platform, filters?.start_date, filters?.end_date],
    queryFn: async (): Promise<LeadConversionMetrics> => {
      const leadsData = leads || [];

      // Filtrar por período se fornecido
      let filteredLeads = leadsData;
      if (filters?.start_date || filters?.end_date) {
        filteredLeads = leadsData.filter(lead => {
          const leadDate = new Date(lead.created_at);
          if (filters?.start_date && leadDate < new Date(filters.start_date)) return false;
          if (filters?.end_date && leadDate > new Date(filters.end_date)) return false;
          return true;
        });
      }

      // Métricas reais do CRM
      const totalLeads = filteredLeads.length;
      const leadsInCRM = filteredLeads.filter(l => l.crm_contact_id).length;
      const leadsWithAppointment = filteredLeads.filter(l => l.has_appointment).length;
      const appointmentsCompleted = filteredLeads.filter(l => l.appointment_status === 'completed').length;

      const leadsByStatus: Record<string, number> = {};
      const leadsByPlatform: Record<string, number> = {};

      // Receita real: soma dos valores de appointments/deals
      let totalRevenue = 0;

      filteredLeads.forEach(lead => {
        leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;

        const platform = lead.platform || lead.origin;
        leadsByPlatform[platform] = (leadsByPlatform[platform] || 0) + 1;

        // Receita real do CRM (appointment ou deal value)
        totalRevenue += Number(lead.estimated_value) || 0;
      });

      const averageLeadValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;
      // Taxa de conversão = leads que agendaram / total de leads
      const conversionRate = totalLeads > 0 ? (leadsWithAppointment / totalLeads) * 100 : 0;

      return {
        totalLeads,
        leadsInCRM,
        leadsWithAppointment,
        appointmentsCompleted,
        leadsByStatus,
        leadsByPlatform,
        totalRevenue,
        averageLeadValue,
        conversionRate,
      };
    },
    enabled: !!leads,
  });
}
