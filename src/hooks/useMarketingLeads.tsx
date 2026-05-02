import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
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
  first_touch_source?: string | null;
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

type MarketingLeadInternal = MarketingLead & { _src?: 'form' | 'commercial' };

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

function digitsOnly(s?: string | null): string {
  return (s || '').replace(/\D/g, '');
}

function phoneKeyLast10(phone?: string | null): string {
  const d = digitsOnly(phone);
  return d.length >= 10 ? d.slice(-10) : '';
}

function rowPriority(r: MarketingLeadInternal): number {
  return r._src === 'form' ? 100 : 50;
}

function originFromFirstTouch(ft: string | null | undefined, fallbackOrigin: string): string {
  if (!ft) return fallbackOrigin;
  if (ft === 'formulario_meta') return 'facebook';
  if (ft === 'whatsapp_meta' || ft === 'whatsapp_evolution') return 'whatsapp';
  if (ft === 'cadastro_manual') return 'other';
  return fallbackOrigin;
}

function platformFromFirstTouch(ft: string | null | undefined, fallback: string): string {
  if (!ft) return fallback;
  if (ft === 'formulario_meta') return 'meta_ads';
  if (ft === 'whatsapp_meta' || ft === 'whatsapp_evolution') return 'whatsapp';
  return fallback;
}

export function useMarketingLeads(filters?: {
  campaign_id?: string;
  platform?: 'google_ads' | 'meta_ads';
  status?: string;
  start_date?: string;
  end_date?: string;
  include_conversions_in_range?: boolean;
}) {
  const { user } = useAuth();
  const { isSecretaria, isAdmin, isLoading: loadingProfile } = useUserProfile();
  const { doctorIds, isLoading: loadingSecretaryDoctors } = useSecretaryDoctors();
  const { data: campaigns } = useAdCampaignsSync();

  /** Alinhado a useCommercialMetrics: admin/dono agrega todos os profiles ativos da organização. */
  const [allActiveUserIds, setAllActiveUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin || !user?.id) {
      setAllActiveUserIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .limit(100);
      if (!cancelled && profiles?.length) {
        setAllActiveUserIds((profiles as { id: string }[]).map(p => p.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.id]);

  const targetUserIds = useMemo(() => {
    if (!user?.id) return [];
    if (isSecretaria && doctorIds && doctorIds.length > 0) {
      return [user.id, ...doctorIds];
    }
    if (isAdmin && allActiveUserIds.length > 0) {
      return allActiveUserIds;
    }
    return [user.id];
  }, [user?.id, isSecretaria, isAdmin, doctorIds, allActiveUserIds]);

  return useQuery({
    queryKey: [
      'marketing-leads',
      user?.id,
      targetUserIds.slice().sort().join(','),
      campaigns?.length ?? 0,
      filters?.campaign_id,
      filters?.platform,
      filters?.status,
      filters?.start_date,
      filters?.end_date,
      filters?.include_conversions_in_range,
    ],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketingLead[]> => {
      const marketingOrigins = ['google', 'facebook', 'instagram', 'website', 'indication', 'other', 'indicação'];

      const { data: syncedForms } = await (supabase
        .from('meta_lead_forms' as any) as any)
        .select('meta_form_id');
      const syncedFormIds = new Set((syncedForms || []).map((f: any) => f.meta_form_id));

      let commLeadsQuery = supabase
        .from('commercial_leads')
        .select('*');

      if (filters?.start_date && filters?.end_date && !filters?.include_conversions_in_range) {
        commLeadsQuery = commLeadsQuery.gte('created_at', filters.start_date).lte('created_at', filters.end_date);
      }

      if (targetUserIds.length === 1) {
        commLeadsQuery = commLeadsQuery.eq('user_id', targetUserIds[0]);
      } else if (targetUserIds.length > 1) {
        commLeadsQuery = commLeadsQuery.in('user_id', targetUserIds);
      }

      const { data: commLeads, error: commError } = await commLeadsQuery;
      if (commError) console.error('Error fetching commercial leads:', commError);

      let formLeadsQuery = (supabase.from('lead_form_submissions' as any) as any).select('*');
      if (filters?.start_date && filters?.end_date && !filters?.include_conversions_in_range) {
        formLeadsQuery = formLeadsQuery.gte('created_at', filters.start_date).lte('created_at', filters.end_date);
      }

      if (targetUserIds.length === 1) {
        formLeadsQuery = formLeadsQuery.eq('user_id', targetUserIds[0]);
      } else if (targetUserIds.length > 1) {
        formLeadsQuery = formLeadsQuery.in('user_id', targetUserIds);
      }

      const { data: formSubmissions, error: formsError } = await formLeadsQuery;
      if (formsError) console.error('Error fetching form submissions:', formsError);

      const allContactIds = new Set<string>();
      (commLeads || []).forEach(l => { if (l.contact_id) allContactIds.add(l.contact_id); });
      (formSubmissions || []).forEach(l => { if (l.crm_contact_id) allContactIds.add(l.crm_contact_id); });

      const contactIdsArray = Array.from(allContactIds);

      const appointmentsMap = new Map<string, any>();
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

      const rawUnified: MarketingLeadInternal[] = [];
      const processedContactIds = new Set<string>();

      (formSubmissions || []).forEach((lead: any) => {
        if (syncedFormIds.size > 0 && lead.form_id && !syncedFormIds.has(lead.form_id)) {
          return;
        }
        if (lead.crm_contact_id) processedContactIds.add(lead.crm_contact_id);

        const appointment = lead.crm_contact_id ? appointmentsMap.get(lead.crm_contact_id) : null;
        const campaign = lead.campaign_id ? campaigns?.find((c: any) => c.platform_campaign_id === lead.campaign_id) : null;

        rawUnified.push({
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
          form_name: lead.form_name ?? null,
          platform: 'meta_ads',
          crm_contact_id: lead.crm_contact_id,
          has_appointment: !!appointment,
          appointment_status: appointment?.status,
          appointment_completed_at: appointment?.completed_at || appointment?.start_time,
          _src: 'form',
        } as MarketingLeadInternal);
      });

      (commLeads || []).forEach((lead: any) => {
        if (lead.contact_id && processedContactIds.has(lead.contact_id)) return;
        if (!marketingOrigins.includes(lead.origin)) return;

        const appointment = lead.contact_id ? appointmentsMap.get(lead.contact_id) : null;

        rawUnified.push({
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
          _src: 'commercial',
        } as MarketingLeadInternal);
      });

      rawUnified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const dedupMap = new Map<string, MarketingLeadInternal>();
      for (const row of rawUnified) {
        const pk = row.crm_contact_id || (phoneKeyLast10(row.phone) ? `ph:${phoneKeyLast10(row.phone)}` : `id:${row.id}`);
        const prev = dedupMap.get(pk);
        if (!prev) {
          dedupMap.set(pk, row);
          continue;
        }
        const rp = rowPriority(row);
        const pp = rowPriority(prev);
        if (rp > pp) {
          dedupMap.set(pk, row);
        } else if (rp === pp && new Date(row.created_at).getTime() > new Date(prev.created_at).getTime()) {
          dedupMap.set(pk, row);
        }
      }

      const dedupedRows = Array.from(dedupMap.values());
      const enrichIds = [...new Set(dedupedRows.map(m => m.crm_contact_id).filter(Boolean))] as string[];

      const touchById = new Map<string, { first_touch_source: string | null }>();
      if (enrichIds.length > 0) {
        const { data: touches } = await supabase
          .from('crm_contacts')
          .select('id, custom_fields')
          .in('id', enrichIds);
        (touches || []).forEach((t: { id: string; custom_fields: unknown }) => {
          const cf =
            t.custom_fields && typeof t.custom_fields === 'object' && !Array.isArray(t.custom_fields)
              ? (t.custom_fields as Record<string, unknown>)
              : {};
          const fts = cf.first_touch_source;
          touchById.set(t.id, {
            first_touch_source: typeof fts === 'string' ? fts : null,
          });
        });
      }

      const result: MarketingLead[] = dedupedRows.map((row) => {
        const { _src, ...rest } = row;
        void _src;
        const ft = row.crm_contact_id ? touchById.get(row.crm_contact_id)?.first_touch_source : undefined;
        const origin = originFromFirstTouch(ft ?? null, row.origin);
        const platform = platformFromFirstTouch(ft ?? null, row.platform || row.origin);
        return {
          ...rest,
          origin,
          platform,
          first_touch_source: ft ?? null,
        };
      });

      return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id && !loadingProfile && (!isSecretaria || !loadingSecretaryDoctors),
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

      let filteredLeads = leadsData;
      if (filters?.start_date || filters?.end_date) {
        filteredLeads = leadsData.filter(lead => {
          const leadDate = new Date(lead.created_at);
          if (filters?.start_date && leadDate < new Date(filters.start_date)) return false;
          if (filters?.end_date && leadDate > new Date(filters.end_date)) return false;
          return true;
        });
      }

      const totalLeads = filteredLeads.length;
      const leadsInCRM = filteredLeads.filter(l => l.crm_contact_id).length;
      const leadsWithAppointment = filteredLeads.filter(l => l.has_appointment).length;
      const appointmentsCompleted = filteredLeads.filter(l => l.appointment_status === 'completed').length;

      const leadsByStatus: Record<string, number> = {};
      const leadsByPlatform: Record<string, number> = {};

      let totalRevenue = 0;

      filteredLeads.forEach(lead => {
        leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;

        let plat = lead.platform || lead.origin;
        if (plat === 'facebook' || plat === 'instagram') plat = 'meta_ads';
        leadsByPlatform[plat] = (leadsByPlatform[plat] || 0) + 1;

        totalRevenue += Number(lead.estimated_value) || 0;
      });

      const averageLeadValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;
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
