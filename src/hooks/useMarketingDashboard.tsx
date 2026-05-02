import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdPlatformConnections } from './useAdPlatformConnections';
import { useAdCampaignDailyMetrics, aggregateDailyMetrics, useHasDailyMetrics } from './useAdCampaignDailyMetrics';
import { subDays, startOfMonth, endOfMonth, format, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import type { AdCampaignDailyMetricWithCampaign } from "@/types/adPlatforms";

export interface ActiveAccountInfo {
  id: string;
  name: string;
  category: string;
  lastSync: string | null;
}

export interface MarketingDashboardData {
  // Métricas principais
  totalSpend: number;
  totalRevenue: number;
  averageROAS: number;
  totalLeads: number;
  /** Conversões atribuídas a campanhas (métricas Meta/Google) no período */
  leadsFromAds: number;
  /** Novas conversas no WhatsApp no período (telefones únicos) */
  leadsFromWhatsApp: number;

  // KPIs de lead gen (essenciais para clínica médica)
  cpl: number; // Custo por Lead
  cac: number; // Custo de Aquisição de Paciente (appointment completed)
  leadToPatientRate: number; // Taxa de conversão Lead → Paciente (%)
  newPatients: number; // Leads que se tornaram pacientes (appointment completed)

  // Comparativos
  googleAdsSpend: number;
  metaAdsSpend: number;
  googleAdsRevenue: number;
  metaAdsRevenue: number;

  // Top campanhas
  topCampaignsByROAS: Array<{
    id: string;
    name: string;
    roas: number;
    spend: number;
    revenue: number;
  }>;
  topCampaignsByConversions: Array<{
    id: string;
    name: string;
    conversions: number;
    spend: number;
    revenue: number;
  }>;

  // Alertas
  alerts: Array<{
    type: 'low_roas' | 'no_conversions' | 'budget_limit' | 'optimization';
    message: string;
    campaignId?: string;
    campaignName?: string;
  }>;

  // Dados diários para gráficos
  dailyPerformance: Array<{
    date: string;
    gasto: number;
    receita: number;
  }>;
  
  // Status de integrações
  activeConnections: number;
  activeAccountsList: ActiveAccountInfo[];
  lastSyncTime: string | null;
  hasConnections: boolean;
}

function phoneKeyLast10(phone: string | null | undefined): string {
  const d = (phone || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
}

interface PeriodCampaignAgg {
  id: string;
  name: string;
  status: string;
  spend: number;
  conversions: number;
  revenue: number;
  synced_at?: string;
}

function aggregateCampaignsFromDailyRows(
  rows: AdCampaignDailyMetricWithCampaign[]
): Map<string, PeriodCampaignAgg> {
  const map = new Map<string, PeriodCampaignAgg>();
  for (const r of rows) {
    const id = r.campaign_sync_id;
    const c = r.campaign;
    let cur = map.get(id);
    if (!cur) {
      cur = {
        id,
        name: c?.platform_campaign_name ?? 'Campanha',
        status: (c?.status as string) ?? '',
        spend: 0,
        conversions: 0,
        revenue: 0,
        synced_at: (c as AdCampaignDailyMetricWithCampaign['campaign'] & { synced_at?: string })?.synced_at,
      };
      map.set(id, cur);
    }
    cur.spend += Number(r.spend) || 0;
    cur.conversions += Number(r.conversions) || 0;
    cur.revenue += Number(r.conversion_value) || 0;
  }
  return map;
}

/** Mescla synced_at do snapshot em ad_campaigns_sync para alertas de sync */
function attachSyncedAtFromCampaigns(
  periodMap: Map<string, PeriodCampaignAgg>,
  campaignsData: { id: string; synced_at: string }[]
): void {
  const byId = new Map(campaignsData.map(c => [c.id, c.synced_at]));
  for (const agg of periodMap.values()) {
    const s = byId.get(agg.id);
    if (s) agg.synced_at = s;
  }
}

export function useMarketingDashboard(filters?: { startDate?: Date; endDate?: Date }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  let rangeStart = startOfDay(filters?.startDate ?? startOfMonth(now));
  let rangeEnd = startOfDay(filters?.endDate ?? endOfMonth(now));
  if (rangeEnd > todayStart) rangeEnd = todayStart;
  if (rangeStart > todayStart) rangeStart = todayStart;
  if (rangeStart > rangeEnd) rangeEnd = rangeStart;

  const rangeStartISO = rangeStart.toISOString();
  const rangeEndISO = endOfDay(rangeEnd).toISOString();
  const startDateStr = format(rangeStart, 'yyyy-MM-dd');
  const endDateStr = format(rangeEnd, 'yyyy-MM-dd');

  const { data: campaigns } = useAdCampaignsSync();
  const { data: connections } = useAdPlatformConnections();

  // Métricas diárias do período
  const { data: dailyMetrics } = useAdCampaignDailyMetrics({
    start_date: startDateStr,
    end_date: endDateStr,
  });
  const { data: hasDailyMetrics = false } = useHasDailyMetrics();

  return useQuery({
    queryKey: ['marketing-dashboard', campaigns, connections, dailyMetrics, hasDailyMetrics, startDateStr, endDateStr],
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    queryFn: async (): Promise<MarketingDashboardData> => {
      const connectionsData = connections || [];

      // Contas ativas: apenas ad accounts reais (category 'other')
      const activeConns = connectionsData.filter(
        c => c.is_active && c.account_category === 'other'
      );
      const activeConnIds = new Set(activeConns.map(c => c.id));

      // Filtrar campanhas apenas das contas ATIVAS
      const allCampaigns = campaigns || [];
      const campaignsData = activeConnIds.size > 0
        ? allCampaigns.filter(c => activeConnIds.has(c.connection_id))
        : [];
      const activeCampaignIds = new Set(campaignsData.map(c => c.id));

      // Consultas concluídas no período — base para CAC e "pacientes" (alinha com tipo da interface)
      const [
        { data: completedApptsInRange, error: apptsErr },
        { data: waRows, error: waErr },
      ] = await Promise.all([
        supabase
          .from('medical_appointments')
          .select('id')
          .eq('status', 'completed')
          .gte('start_time', rangeStartISO)
          .lte('start_time', rangeEndISO),
        supabase
          .from('whatsapp_conversations')
          .select('id, phone_number')
          .gte('created_at', rangeStartISO)
          .lte('created_at', rangeEndISO),
      ]);

      if (apptsErr) console.error('marketing-dashboard appointments:', apptsErr);
      if (waErr) console.error('marketing-dashboard whatsapp_conversations:', waErr);

      const completedPatientsInRange = completedApptsInRange?.length || 0;

      const waPhones = new Set<string>();
      (waRows || []).forEach((row: { id: string; phone_number: string }) => {
        const k = phoneKeyLast10(row.phone_number);
        waPhones.add(k || `wa:${row.id}`);
      });
      const leadsFromWhatsApp = waPhones.size;

      // Com sync diário ativo: sempre somar só linhas do período (período sem dados = R$ 0).
      // Sem sync diário (legado): fallback aos totais cumulativos em ad_campaigns_sync.
      const monthlyDailyRows = dailyMetrics || [];
      const activeRows = monthlyDailyRows.filter(r => activeCampaignIds.has(r.campaign_sync_id));

      let metaSpendScaledWithApi = false;

      let totalSpend: number, totalRevenue: number, averageROAS: number;
      let leadsFromAds: number;
      let googleAdsSpend: number, metaAdsSpend: number;
      let googleAdsRevenue: number, metaAdsRevenue: number;

      if (hasDailyMetrics) {
        const agg = aggregateDailyMetrics(activeRows);

        totalSpend = agg.total_spend;
        totalRevenue = agg.total_conversion_value;
        leadsFromAds = agg.total_conversions;
        averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        const googleRows = activeRows.filter(
          (r: AdCampaignDailyMetricWithCampaign) => r.campaign?.platform === 'google_ads'
        );
        const metaRows = activeRows.filter(
          (r: AdCampaignDailyMetricWithCampaign) => r.campaign?.platform === 'meta_ads'
        );
        const googleAgg = aggregateDailyMetrics(googleRows);
        const metaAgg = aggregateDailyMetrics(metaRows);

        googleAdsSpend = googleAgg.total_spend;
        metaAdsSpend = metaAgg.total_spend;
        googleAdsRevenue = googleAgg.total_conversion_value;
        metaAdsRevenue = metaAgg.total_conversion_value;
      } else {
        const googleCampaigns = campaignsData.filter(c => c.platform === 'google_ads');
        const metaCampaigns = campaignsData.filter(c => c.platform === 'meta_ads');

        googleAdsSpend = googleCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        metaAdsSpend = metaCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        googleAdsRevenue = googleCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
        metaAdsRevenue = metaCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);

        totalSpend = campaignsData.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
        totalRevenue = campaignsData.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
        leadsFromAds = campaignsData.reduce((sum, c) => sum + (Number(c.conversions) || 0), 0);
        averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      }

      // Gasto Meta no período: conta Ads Manager (insights em nível de conta) — alinha com o filtro de datas
      const metaActiveConnections = activeConns.filter(c => c.platform === 'meta_ads');
      if (metaActiveConnections.length > 0) {
        type InsightsBody = { success?: boolean; spend?: number; error?: string };
        const insightsResults = await Promise.all(
          metaActiveConnections.map(async conn => {
            const { data, error } = await supabase.functions.invoke('meta-account-insights', {
              body: {
                connection_id: conn.id,
                since: startDateStr,
                until: endDateStr,
              },
            });
            const body = data as InsightsBody | null;
            const ok = !error && body?.success === true && typeof body.spend === 'number';
            return {
              connectionId: conn.id,
              ok,
              spend: ok ? (body!.spend as number) : 0,
            };
          })
        );

        const okIds = new Set(insightsResults.filter(r => r.ok).map(r => r.connectionId));
        const apiSum = insightsResults.filter(r => r.ok).reduce((s, r) => s + r.spend, 0);
        const allMetaOk = okIds.size === metaActiveConnections.length;
        const partialOk = !allMetaOk && okIds.size > 0;

        if (allMetaOk) {
          metaAdsSpend = apiSum;
          totalSpend = googleAdsSpend + metaAdsSpend;
          averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
          metaSpendScaledWithApi = true;
        } else if (partialOk && hasDailyMetrics) {
          const failedIds = metaActiveConnections.map(c => c.id).filter(id => !okIds.has(id));
          const metaRowsFallback = monthlyDailyRows.filter(
            (r: AdCampaignDailyMetricWithCampaign) =>
              activeCampaignIds.has(r.campaign_sync_id) &&
              r.campaign?.platform === 'meta_ads' &&
              r.campaign?.connection_id &&
              failedIds.includes(r.campaign.connection_id)
          );
          const fbAgg = aggregateDailyMetrics(metaRowsFallback);
          metaAdsSpend = apiSum + fbAgg.total_spend;
          totalSpend = googleAdsSpend + metaAdsSpend;
          averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        }
      }

      const periodCampaignMap =
        hasDailyMetrics && campaignsData.length > 0
          ? (() => {
              const m = aggregateCampaignsFromDailyRows(activeRows);
              attachSyncedAtFromCampaigns(m, campaignsData);
              return m;
            })()
          : null;

      let topCampaignsByROAS: MarketingDashboardData['topCampaignsByROAS'];
      let topCampaignsByConversions: MarketingDashboardData['topCampaignsByConversions'];

      if (periodCampaignMap) {
        const periodList = [...periodCampaignMap.values()];
        topCampaignsByROAS = periodList
          .filter(p => p.spend > 0 && p.revenue > 0)
          .map(p => ({
            id: p.id,
            name: p.name,
            roas: p.revenue / p.spend,
            spend: p.spend,
            revenue: p.revenue,
          }))
          .sort((a, b) => b.roas - a.roas)
          .slice(0, 5);

        topCampaignsByConversions = periodList
          .filter(p => p.conversions > 0)
          .map(p => ({
            id: p.id,
            name: p.name,
            conversions: p.conversions,
            spend: p.spend,
            revenue: p.revenue,
          }))
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 5);
      } else {
        topCampaignsByROAS = campaignsData
          .filter(c => c.roas && c.roas > 0)
          .sort((a, b) => (b.roas || 0) - (a.roas || 0))
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            name: c.platform_campaign_name,
            roas: c.roas || 0,
            spend: Number(c.spend) || 0,
            revenue: Number(c.conversion_value) || 0,
          }));

        topCampaignsByConversions = campaignsData
          .filter(c => c.conversions > 0)
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            name: c.platform_campaign_name,
            conversions: c.conversions,
            spend: Number(c.spend) || 0,
            revenue: Number(c.conversion_value) || 0,
          }));
      }

      const alerts: MarketingDashboardData['alerts'] = [];

      if (periodCampaignMap) {
        const sevenDaysAgo = subDays(new Date(), 7);
        periodCampaignMap.forEach(p => {
          if (p.status !== 'active') return;
          const roasPeriod = p.spend > 0 ? p.revenue / p.spend : 0;
          if (p.spend > 0 && p.revenue > 0 && roasPeriod < 2) {
            alerts.push({
              type: 'low_roas',
              message: `Campanha "${p.name}" com ROAS baixo no período (${roasPeriod.toFixed(2)}x)`,
              campaignId: p.id,
              campaignName: p.name,
            });
          }
          if (p.conversions === 0 && p.spend > 10) {
            const lastSync = p.synced_at ? new Date(p.synced_at) : null;
            if (lastSync && lastSync < sevenDaysAgo) {
              alerts.push({
                type: 'no_conversions',
                message: `Campanha "${p.name}" sem conversões no período e sincronização antiga`,
                campaignId: p.id,
                campaignName: p.name,
              });
            }
          }
        });

        const activeWithLeads = [...periodCampaignMap.values()].filter(
          p => p.status === 'active' && p.conversions > 0 && p.spend > 0
        );
        if (activeWithLeads.length > 1) {
          const avgCpl =
            activeWithLeads.reduce((sum, p) => sum + p.spend / p.conversions, 0) /
            activeWithLeads.length;
          activeWithLeads.forEach(p => {
            const campaignCpl = p.spend / p.conversions;
            if (campaignCpl > avgCpl * 2) {
              alerts.push({
                type: 'low_roas',
                message: `CPL alto em "${p.name}" no período: R$ ${campaignCpl.toFixed(2)} (2× acima da média R$ ${avgCpl.toFixed(2)})`,
                campaignId: p.id,
                campaignName: p.name,
              });
            }
          });
        }
      } else {
        campaignsData.forEach(campaign => {
          if (campaign.roas && campaign.roas < 2 && campaign.status === 'active') {
            alerts.push({
              type: 'low_roas',
              message: `Campanha "${campaign.platform_campaign_name}" tem ROAS baixo (${campaign.roas.toFixed(2)}x)`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
            });
          }
        });

        const sevenDaysAgo = subDays(new Date(), 7);
        campaignsData.forEach(campaign => {
          if (campaign.conversions === 0 && campaign.status === 'active') {
            const lastSync = new Date(campaign.synced_at);
            if (lastSync < sevenDaysAgo) {
              alerts.push({
                type: 'no_conversions',
                message: `Campanha "${campaign.platform_campaign_name}" não tem conversões há mais de 7 dias`,
                campaignId: campaign.id,
                campaignName: campaign.platform_campaign_name,
              });
            }
          }
        });

        const activeCampaignsWithLeads = campaignsData.filter(
          c => c.status === 'active' && c.conversions > 0 && Number(c.spend) > 0
        );
        if (activeCampaignsWithLeads.length > 1) {
          const avgCpl =
            activeCampaignsWithLeads.reduce(
              (sum, c) => sum + Number(c.spend) / c.conversions,
              0
            ) / activeCampaignsWithLeads.length;

          activeCampaignsWithLeads.forEach(campaign => {
            const campaignCpl = Number(campaign.spend) / campaign.conversions;
            if (campaignCpl > avgCpl * 2) {
              alerts.push({
                type: 'low_roas',
                message: `CPL alto em "${campaign.platform_campaign_name}": R$ ${campaignCpl.toFixed(2)} (2× acima da média R$ ${avgCpl.toFixed(2)})`,
                campaignId: campaign.id,
                campaignName: campaign.platform_campaign_name,
              });
            }
          });
        }
      }

      // Lista de contas ativas para exibir no dashboard
      const activeAccountsList: ActiveAccountInfo[] = activeConns.map(c => ({
        id: c.id,
        name: c.account_name,
        category: c.account_category || 'other',
        lastSync: c.last_sync_at || null,
      }));

      const lastSync = connectionsData
        .filter(c => c.last_sync_at)
        .sort((a, b) => {
          const dateA = new Date(a.last_sync_at || 0);
          const dateB = new Date(b.last_sync_at || 0);
          return dateB.getTime() - dateA.getTime();
        })[0]?.last_sync_at || null;

      // Gráfico diário: só campanhas de contas ativas; escala Meta quando o gasto veio da API da conta
      const dailyBuckets = new Map<string, { google: number; meta: number; receita: number }>();
      for (const row of activeRows) {
        const raw = row.metric_date;
        const d = typeof raw === 'string' ? raw.split('T')[0]! : format(new Date(raw), 'yyyy-MM-dd');
        const cur = dailyBuckets.get(d) || { google: 0, meta: 0, receita: 0 };
        const sp = Number(row.spend) || 0;
        const rev = Number(row.conversion_value) || 0;
        const plat = row.campaign?.platform;
        if (plat === 'meta_ads') cur.meta += sp;
        else cur.google += sp;
        cur.receita += rev;
        dailyBuckets.set(d, cur);
      }

      let metaDbTotal = 0;
      for (const v of dailyBuckets.values()) metaDbTotal += v.meta;

      let metaScale = 1;
      if (metaSpendScaledWithApi && metaDbTotal > 0) {
        metaScale = metaAdsSpend / metaDbTotal;
      } else if (metaSpendScaledWithApi && metaDbTotal === 0 && metaAdsSpend > 0) {
        const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
        const perDay = metaAdsSpend / Math.max(1, daysInRange.length);
        for (const day of daysInRange) {
          const key = format(day, 'yyyy-MM-dd');
          const cur = dailyBuckets.get(key) || { google: 0, meta: 0, receita: 0 };
          cur.meta += perDay;
          dailyBuckets.set(key, cur);
        }
      }

      const dailyPerformance = [...dailyBuckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([iso, v]) => ({
          date: format(parseISO(`${iso}T12:00:00`), 'dd/MM'),
          gasto: v.google + v.meta * metaScale,
          receita: v.receita,
        }));

      const totalLeadsCount = leadsFromAds + leadsFromWhatsApp;
      const cpl = leadsFromAds > 0 ? totalSpend / leadsFromAds : 0;
      const cac = completedPatientsInRange > 0 ? totalSpend / completedPatientsInRange : 0;
      const leadToPatientRate =
        totalLeadsCount > 0 ? (completedPatientsInRange / totalLeadsCount) * 100 : 0;

      return {
        totalSpend,
        totalRevenue,
        averageROAS,
        totalLeads: totalLeadsCount,
        leadsFromAds,
        leadsFromWhatsApp,
        cpl,
        cac,
        leadToPatientRate,
        newPatients: completedPatientsInRange,
        googleAdsSpend,
        metaAdsSpend,
        googleAdsRevenue,
        metaAdsRevenue,
        topCampaignsByROAS,
        topCampaignsByConversions,
        alerts: alerts.slice(0, 5),
        dailyPerformance,
        activeConnections: activeConns.length,
        activeAccountsList,
        lastSyncTime: lastSync,
        hasConnections: connectionsData.length > 0,
      };
    },
    enabled: true,
  });
}

