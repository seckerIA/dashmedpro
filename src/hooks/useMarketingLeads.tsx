import { useQuery } from '@tanstack/react-query';
import { useCommercialLeads } from './useCommercialLeads';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useGeneratedUtms } from './useUtmGenerator';
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
  platform?: string;
}

export interface LeadConversionMetrics {
  totalLeads: number;
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
  const { leads: allLeads } = useCommercialLeads(filters);
  const { data: campaigns } = useAdCampaignsSync();
  const { data: utms } = useGeneratedUtms();

  return useQuery({
    queryKey: ['marketing-leads', allLeads, campaigns, utms, filters],
    queryFn: async (): Promise<MarketingLead[]> => {
      // Se não houver campanhas sincronizadas, não há como vincular ou filtrar leads para exibição
      if (!campaigns || campaigns.length === 0) return [];

      // 1. Fetch lead form submissions (Meta Ads)
      const { data: formLeads, error: formsError } = await supabase
        .from('lead_form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (formsError) {
        console.error('Error fetching lead forms:', formsError);
      }

      // 2. Process commercial_leads
      const leads = allLeads || [];
      const marketingLeads = leads.filter(lead => {
        return lead.origin === 'google' ||
               lead.origin === 'facebook' ||
               lead.origin === 'instagram';
      });

      const enrichedManualLeads = marketingLeads.reduce((acc, lead) => {
        const relatedUtm = utms?.find(utm => 
          utm.full_url.includes(`utm_source=${lead.origin}`)
        );
        
        const campaign = relatedUtm?.ad_campaign_sync_id
          ? campaigns.find(c => c.id === relatedUtm.ad_campaign_sync_id)
          : null;

        // Se o lead não estiver vinculado a uma campanha sincronizada, ignora
        if (!campaign) return acc;

        acc.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          origin: lead.origin,
          status: lead.status,
          estimated_value: lead.estimated_value,
          created_at: lead.created_at,
          utm_id: relatedUtm?.id || null,
          ad_campaign_sync_id: campaign.id,
          campaign_name: campaign.platform_campaign_name || null,
          platform: campaign.platform || null,
        } as MarketingLead);

        return acc;
      }, [] as MarketingLead[]);

      // 3. Process form leads
      const formLeadsMapped = (formLeads || []).reduce((acc, lead) => {
        // Ignora se não houver campaign_id atrelado (orgânico)
        if (!lead.campaign_id) return acc;

        // Try mapping the campaign_id perfectly to synced campaigns
        const campaign = campaigns.find(c => c.platform_campaign_id === lead.campaign_id);
        
        // Garante que só puxa Leads de campanhas sincronizadas! (O usuário pediu restrição total)
        if (!campaign) return acc;
        
        acc.push({
          id: lead.id, // we might need lead.leadgen_id or id
          name: lead.full_name || 'Lead Meta Ads',
          email: lead.email,
          phone: lead.phone_number,
          origin: 'facebook',
          status: 'novo', // Default status for form leads, they are created in crm_deals as lead_novo
          estimated_value: 0,
          created_at: lead.created_at,
          utm_id: null,
          ad_campaign_sync_id: campaign.id,
          campaign_name: lead.campaign_name || lead.form_name,
          platform: 'meta_ads',
        } as MarketingLead);

        return acc;
      }, [] as MarketingLead[]);

      // 4. Merge and ensure no duplicates
      const allMerged = [...formLeadsMapped, ...enrichedManualLeads];
      
      return allMerged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    queryKey: ['marketing-lead-metrics', leads, filters],
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

      // Calcular métricas
      const totalLeads = filteredLeads.length;
      
      const leadsByStatus: Record<string, number> = {};
      const leadsByPlatform: Record<string, number> = {};
      
      let totalRevenue = 0;
      let convertedLeads = 0;

      filteredLeads.forEach(lead => {
        // Por status
        leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
        
        // Por plataforma
        const platform = lead.platform || lead.origin;
        leadsByPlatform[platform] = (leadsByPlatform[platform] || 0) + 1;
        
        // Receita
        if (lead.estimated_value) {
          totalRevenue += Number(lead.estimated_value);
        }
        
        // Conversões
        if (lead.status === 'converted') {
          convertedLeads++;
        }
      });

      const averageLeadValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        totalLeads,
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

