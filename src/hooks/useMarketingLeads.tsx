import { useQuery } from '@tanstack/react-query';
import { useCommercialLeads } from './useCommercialLeads';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useGeneratedUtms } from './useUtmGenerator';

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
  const { data: allLeads } = useCommercialLeads(filters);
  const { data: campaigns } = useAdCampaignsSync();
  const { data: utms } = useGeneratedUtms();

  return useQuery({
    queryKey: ['marketing-leads', allLeads, campaigns, utms, filters],
    queryFn: async (): Promise<MarketingLead[]> => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:39',message:'queryFn iniciado',data:{hasAllLeads:!!allLeads,allLeadsCount:allLeads?.length,hasCampaigns:!!campaigns,campaignsCount:campaigns?.length,hasUtms:!!utms,utmsCount:utms?.length,filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const leads = allLeads || [];
      
      // Filtrar apenas leads que vieram de anúncios
      const marketingLeads = leads.filter(lead => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:45',message:'verificando lead',data:{leadId:lead?.id,leadOrigin:lead?.origin,hasOrigin:!!lead?.origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        return lead.origin === 'google' || 
               lead.origin === 'facebook' || 
               lead.origin === 'instagram';
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:52',message:'leads filtrados',data:{totalLeads:leads.length,marketingLeadsCount:marketingLeads.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Enriquecer com informações de campanha e UTM
      const enrichedLeads = marketingLeads.map(lead => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:52',message:'enriquecendo lead',data:{leadId:lead?.id,leadOrigin:lead?.origin,hasUtms:!!utms,utmsCount:utms?.length,hasCampaigns:!!campaigns},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Tentar encontrar campanha relacionada via UTM
        const relatedUtm = utms?.find(utm => 
          utm.full_url.includes(`utm_source=${lead.origin}`)
        );
        
        const campaign = relatedUtm?.ad_campaign_sync_id
          ? campaigns?.find(c => c.id === relatedUtm.ad_campaign_sync_id)
          : null;

        const enriched = {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          origin: lead.origin,
          status: lead.status,
          estimated_value: lead.estimated_value,
          created_at: lead.created_at,
          utm_id: relatedUtm?.id || null,
          ad_campaign_sync_id: campaign?.id || null,
          campaign_name: campaign?.platform_campaign_name || null,
          platform: campaign?.platform || null,
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:75',message:'lead enriquecido',data:{leadId:enriched.id,hasUtmId:!!enriched.utm_id,hasCampaignId:!!enriched.ad_campaign_sync_id,hasCampaignName:!!enriched.campaign_name,hasPlatform:!!enriched.platform},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        return enriched;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMarketingLeads.tsx:79',message:'leads enriquecidos completos',data:{enrichedLeadsCount:enrichedLeads.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return enrichedLeads;
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

