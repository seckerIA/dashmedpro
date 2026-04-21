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
  start_date?: string;
  end_date?: string;
  include_conversions_in_range?: boolean;
}) {
  const { data: campaigns } = useAdCampaignsSync();

  return useQuery({
    queryKey: ['marketing-leads', campaigns?.length ?? 0, filters?.campaign_id, filters?.platform, filters?.status, filters?.start_date, filters?.end_date, filters?.include_conversions_in_range],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketingLead[]> => {
      const marketingOrigins = ['google', 'facebook', 'instagram', 'website', 'indication', 'other', 'indicação'];
      
      // 1. Fetch lead forms for specific Meta Ads context
      const { data: syncedForms } = await (supabase
        .from('meta_lead_forms' as any) as any)
        .select('meta_form_id');
      const syncedFormIds = new Set((syncedForms || []).map((f: any) => f.meta_form_id));

      // 2. Fetch commercial_leads with marketing origins
      let commLeadsQuery = supabase
        .from('commercial_leads')
        .select('*');

      if (filters?.start_date && filters?.end_date && !filters?.include_conversions_in_range) {
        commLeadsQuery = commLeadsQuery.gte('created_at', filters.start_date).lte('created_at', filters.end_date);
      }

      const { data: commLeads, error: commError } = await commLeadsQuery;
      if (commError) console.error('Error fetching commercial leads:', commError);

      // 3. Fetch lead_form_submissions (Meta Lead Gen)
      let formLeadsQuery = (supabase.from('lead_form_submissions' as any) as any).select('*');
      if (filters?.start_date && filters?.end_date && !filters?.include_conversions_in_range) {
        formLeadsQuery = formLeadsQuery.gte('created_at', filters.start_date).lte('created_at', filters.end_date);
      }
      const { data: formSubmissions, error: formsError } = await formLeadsQuery;
      if (formsError) console.error('Error fetching form submissions:', formsError);

      // 4. Gather all relevant contact IDs for enrichment
      const allContactIds = new Set<string>();
      (commLeads || []).forEach(l => { if (l.contact_id) allContactIds.add(l.contact_id); });
      (formSubmissions || []).forEach(l => { if (l.crm_contact_id) allContactIds.add(l.crm_contact_id); });

      const contactIdsArray = Array.from(allContactIds);

      // Fetch appointments for these contacts
      let appointmentsMap = new Map<string, any>();
      if (contactIdsArray.length > 0) {
        const { data: appointments } = await supabase
          .from('medical_appointments')
          .select('contact_id, status, estimated_value, completed_at, start_time')
          .in('contact_id', contactIdsArray);

        (appointments || []).forEach((a: any) => {
          const existing = appointmentsMap.get(a.contact_id);
          const priority: Record<string, number> = { completed: 3, confirmed: 2, scheduled: 1 };
          if (!existing || (priority[a.status] || 0) > (priority[existing.status] || 0)) {
            appointmentsMap.set(a.contact_id, a);
          }
        });
      }

      // 5. Map and unify
      const unifiedLeads: MarketingLead[] = [];
      const processedContactIds = new Set<string>();

      // Priority 1: Form Submissions (more detailed Meta info)
      (formSubmissions || []).forEach((lead: any) => {
        if (lead.crm_contact_id) processedContactIds.add(lead.crm_contact_id);
        
        const appointment = lead.crm_contact_id ? appointmentsMap.get(lead.crm_contact_id) : null;
        const campaign = lead.campaign_id ? campaigns?.find((c: any) => c.platform_campaign_id === lead.campaign_id) : null;

        unifiedLeads.push({
          id: lead.id,
          name: lead.full_name || 'Lead Meta Ads',
          email: lead.email,
          phone: lead.phone_number,
          origin: 'facebook',
          status: appointment?.status === 'completed' ? 'convertido' : (appointment ? 'agendado' : 'novo'),
          estimated_value: Number(appointment?.estimated_value) || 0,
          created_at: lead.created_at,
          ad_campaign_sync_id: campaign?.id || null,
          campaign_name: lead.campaign_name || lead.form_name || 'Formulário Meta',
          platform: 'meta_ads',
          crm_contact_id: lead.crm_contact_id,
          has_appointment: !!appointment,
          appointment_status: appointment?.status,
          appointment_completed_at: appointment?.completed_at || appointment?.start_time,
        } as any);
      });

      // Priority 2: Commercial Leads with Marketing Origin
      (commLeads || []).forEach((lead: any) => {
        if (lead.contact_id && processedContactIds.has(lead.contact_id)) return;
        if (!marketingOrigins.includes(lead.origin)) return;

        const appointment = lead.contact_id ? appointmentsMap.get(lead.contact_id) : null;
        
        unifiedLeads.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          origin: lead.origin,
          status: appointment?.status === 'completed' ? 'convertido' : (appointment ? 'agendado' : lead.status),
          estimated_value: Number(appointment?.estimated_value) || 0,
          created_at: lead.created_at,
          platform: lead.origin === 'google' ? 'google_ads' : 'meta_ads',
          crm_contact_id: lead.contact_id,
          has_appointment: !!appointment,
          appointment_status: appointment?.status,
          appointment_completed_at: appointment?.completed_at || appointment?.start_time,
        } as any);
      });

      return unifiedLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
