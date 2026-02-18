/**
 * Edge Function: sync-ad-campaigns
 * Sincroniza campanhas de anúncios do Meta Ads e Google Ads
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v22.0";

interface SyncRequest {
  connection_id: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
}

interface MetaInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  date_start?: string;
  date_stop?: string;
}

interface CampaignWithInsights extends MetaCampaign {
  insights?: MetaInsights;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connection_id }: SyncRequest = await req.json();

    if (!connection_id) {
      return new Response(
        JSON.stringify({ error: 'connection_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar conexão
    const { data: connection, error: connError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status para pending
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({
        sync_status: 'pending',
        error_message: null
      })
      .eq('id', connection_id);

    let syncResult;

    // Chamar função específica baseada na plataforma
    if (connection.platform === 'google_ads') {
      syncResult = await syncGoogleAds(connection, supabaseAdmin, user.id);
    } else if (connection.platform === 'meta_ads') {
      syncResult = await syncMetaAds(connection, supabaseAdmin, user.id);
    } else {
      throw new Error('Unsupported platform');
    }

    // Atualizar status da conexão
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({
        sync_status: syncResult.success ? 'success' : 'error',
        last_sync_at: new Date().toISOString(),
        error_message: syncResult.error || null
      })
      .eq('id', connection_id);

    return new Response(
      JSON.stringify(syncResult),
      {
        status: syncResult.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in sync-ad-campaigns function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// =====================================================
// Google Ads Sync (placeholder)
// =====================================================

async function syncGoogleAds(connection: any, supabase: any, userId: string) {
  try {
    // TODO: Implementar chamada real à Google Ads API
    // Requer configuração do Google Ads API Client Library
    // https://developers.google.com/google-ads/api/docs/client-libs

    return {
      success: true,
      campaigns_synced: 0,
      message: 'Google Ads sync not yet implemented. Please implement Google Ads API integration.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// Meta Ads Sync (Real Implementation)
// =====================================================

async function syncMetaAds(connection: any, supabase: any, userId: string) {
  try {
    const accessToken = connection.api_key;
    const accountId = connection.account_id;

    if (!accessToken) {
      throw new Error('Access token não encontrado. Reconecte sua conta Meta.');
    }

    // Formatar account_id (adicionar prefixo act_ se necessário)
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    console.log(`[Meta Ads] Syncing campaigns for account: ${formattedAccountId}`);

    // 1. Buscar campanhas
    const campaigns = await fetchMetaCampaigns(formattedAccountId, accessToken);
    console.log(`[Meta Ads] Found ${campaigns.length} campaigns`);

    // 2. Buscar insights para cada campanha (últimos 30 dias)
    const campaignsWithInsights = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const insights = await fetchCampaignInsights(campaign.id, accessToken);
          return { ...campaign, insights };
        } catch (e) {
          console.warn(`[Meta Ads] Could not fetch insights for campaign ${campaign.id}:`, e);
          return campaign;
        }
      })
    );

    // 3. Salvar campanhas no banco
    let syncedCount = 0;
    for (const campaign of campaignsWithInsights) {
      try {
        await saveCampaignToDatabase(supabase, userId, connection.id, campaign);
        syncedCount++;
      } catch (e) {
        console.error(`[Meta Ads] Error saving campaign ${campaign.id}:`, e);
      }
    }

    console.log(`[Meta Ads] Successfully synced ${syncedCount} campaigns`);

    return {
      success: true,
      campaigns_synced: syncedCount,
      total_campaigns: campaigns.length,
      message: `Sincronizadas ${syncedCount} campanhas com sucesso.`
    };

  } catch (error: any) {
    console.error('[Meta Ads] Sync error:', error);

    // Verificar se é erro de token expirado
    if (error.message?.includes('OAuthException') || error.message?.includes('access token')) {
      return {
        success: false,
        error: 'Token de acesso expirado. Por favor, reconecte sua conta Meta.'
      };
    }

    return {
      success: false,
      error: error.message || 'Erro desconhecido ao sincronizar Meta Ads'
    };
  }
}

// =====================================================
// Meta Graph API Helpers
// =====================================================

async function fetchMetaCampaigns(accountId: string, accessToken: string): Promise<MetaCampaign[]> {
  const fields = [
    'id',
    'name',
    'status',
    'objective',
    'daily_budget',
    'lifetime_budget',
    'created_time',
    'updated_time'
  ].join(',');

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${accountId}/campaigns?fields=${fields}&limit=100`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[Meta Ads] API Error:', errorData);
    throw new Error(errorData.error?.message || 'Falha ao buscar campanhas');
  }

  const data = await response.json();
  return data.data || [];
}

async function fetchCampaignInsights(campaignId: string, accessToken: string): Promise<MetaInsights | null> {
  const fields = [
    'impressions',
    'clicks',
    'spend',
    'reach',
    'actions',
    'action_values',
    'cpc',
    'cpm',
    'ctr',
    'date_start',
    'date_stop'
  ].join(',');

  // Últimos 30 dias
  const datePreset = 'last_30d';

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Insights pode não existir para campanhas sem dados
    if (errorData.error?.code === 100) {
      return null;
    }
    throw new Error(errorData.error?.message || 'Falha ao buscar insights');
  }

  const data = await response.json();
  return data.data?.[0] || null;
}

async function saveCampaignToDatabase(
  supabase: any,
  userId: string,
  connectionId: string,
  campaign: CampaignWithInsights
) {
  const insights = campaign.insights;

  // Calcular métricas
  const impressions = parseInt(insights?.impressions || '0', 10);
  const clicks = parseInt(insights?.clicks || '0', 10);
  const spend = parseFloat(insights?.spend || '0');
  const reach = parseInt(insights?.reach || '0', 10);

  // CTR (Click-Through Rate)
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  // Buscar conversões das actions
  const conversions = insights?.actions?.find(a =>
    a.action_type === 'lead' ||
    a.action_type === 'purchase' ||
    a.action_type === 'complete_registration'
  );
  const conversionCount = parseInt(conversions?.value || '0', 10);

  // CPA (Cost Per Acquisition)
  const cpa = conversionCount > 0 ? spend / conversionCount : 0;

  // ROAS (Return on Ad Spend) — calculado via action_values (purchase)
  let purchaseValue = 0;
  if (insights?.action_values) {
    const purchaseAction = insights.action_values.find(a => a.action_type === 'purchase');
    if (purchaseAction) {
      purchaseValue = parseFloat(purchaseAction.value || '0');
    }
  }
  const roas = spend > 0 ? purchaseValue / spend : 0;

  // Mapear status
  const statusMap: Record<string, string> = {
    'ACTIVE': 'active',
    'PAUSED': 'paused',
    'DELETED': 'archived',
    'ARCHIVED': 'archived',
  };

  // Calcular budget (preferir daily_budget, fallback para lifetime_budget)
  const budget = parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0');

  const { error } = await supabase
    .from('ad_campaigns_sync')
    .upsert({
      user_id: userId,
      connection_id: connectionId,
      platform_campaign_id: campaign.id,
      platform_campaign_name: campaign.name,
      platform: 'meta_ads',
      status: statusMap[campaign.status] || 'paused',
      budget,
      impressions,
      clicks,
      conversions: conversionCount,
      conversion_value: purchaseValue,
      spend,
      ctr,
      cpa,
      roas,
      start_date: insights?.date_start || null,
      end_date: insights?.date_stop || null,
      synced_at: new Date().toISOString(),
    }, {
      onConflict: 'connection_id,platform_campaign_id',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('[Meta Ads] Error saving campaign:', error);
    throw error;
  }
}

serve(handler);
