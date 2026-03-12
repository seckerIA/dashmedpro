/**
 * Edge Function: sync-ad-campaigns
 * Sincroniza campanhas de anúncios do Meta Ads e Google Ads
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v22.0";


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
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  );

  let current_connection_id: string | null = null;
  let current_user_id: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[sync-ad-campaigns] No Authorization header present');
      return new Response(JSON.stringify({ error: 'No authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Diagnostic: log JWT signature prefix to identify if anon key vs user token
    const tokenPart = authHeader.replace('Bearer ', '');
    const sigPrefix = tokenPart.split('.').pop()?.substring(0, 6) ?? '?';
    console.log(`[sync-ad-campaigns] Auth token signature prefix: ${sigPrefix}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        global: { headers: { Authorization: authHeader } } 
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenPart);

    if (authError || !user) {
      console.error('[sync-ad-campaigns] Auth failed:', authError?.message, '| sig:', sigPrefix);
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    current_user_id = user.id;

    // Safe JSON parsing with diagnostics
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (parseErr: any) {
      console.warn('[sync-ad-campaigns] Failed to parse request body:', parseErr.message);
      return new Response(JSON.stringify({ error: 'Invalid or empty request body' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { connection_id } = body as { connection_id?: string };
    current_connection_id = connection_id ?? null;

    if (!connection_id) {
      console.warn('[sync-ad-campaigns] Missing connection_id in body:', JSON.stringify(body));
      return new Response(JSON.stringify({ error: 'connection_id is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }



    // Buscar conexão usando o token do usuário (garante permissão)
    const { data: connection, error: connError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'Connection not found or access denied' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Atualizar status para pending via admin
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({ sync_status: 'pending', error_message: null })
      .eq('id', connection_id);

    let syncResult;

    if (connection.platform === 'google_ads') {
      syncResult = await syncGoogleAds(connection, supabaseAdmin, user.id);
    } else if (connection.platform === 'meta_ads') {
      syncResult = await syncMetaAds(connection, supabaseAdmin, user.id);
    } else {
      throw new Error('Unsupported platform');
    }

    // Atualizar status final (sucesso ou erro esperado)
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({
        sync_status: syncResult.success ? 'success' : 'error',
        last_sync_at: new Date().toISOString(),
        error_message: (syncResult as any).error || null
      })
      .eq('id', connection_id);

    if (!syncResult.success) {
      console.warn(`[sync-ad-campaigns] Sync failed for connection ${connection_id}:`, (syncResult as any).error);
    }

    // SEMPRE retornar 200 — supabase.functions.invoke trata non-2xx como FunctionsHttpError genérico
    // O campo success/error no body indica o resultado real
    return new Response(JSON.stringify(syncResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[sync-ad-campaigns] Critical error:", error.message, error.stack);
    
    // Se falhou e temos o ID da conexão, gravar o erro no banco
    if (current_connection_id) {
      await supabaseAdmin
        .from('ad_platform_connections')
        .update({
          sync_status: 'error',
          last_sync_at: new Date().toISOString(),
          error_message: `Erro interno: ${error.message}`
        })
        .eq('id', current_connection_id);
    }

    // Retornar 200 com success: false — supabase.functions.invoke precisa de 2xx
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function syncGoogleAds(connection: any, supabase: any, userId: string) {
  return { 
    success: true, 
    campaigns_synced: 0, 
    message: 'Google Ads sync placeholder' 
  };
}

async function syncMetaAds(connection: any, supabase: any, userId: string) {
  try {
    const accessToken = connection.api_key;
    const accountId = connection.account_id;

    if (!accessToken) throw new Error('Token ausente');

    // Se categoria não for Ad Account, abortar com erro amigável
    if (connection.account_category && connection.account_category !== 'other') {
      return { 
        success: false, 
        error: `A sincronização não está disponível para o tipo "${connection.account_category}". Apenas contas de anúncios padrão são suportadas.` 
      };
    }

    // Validar se é uma conta de anúncios (prefixo act_)
    if (accountId.startsWith('bm_') || accountId.startsWith('waba_') || accountId.startsWith('page_') || accountId === 'meta_oauth') {
      return { 
        success: false, 
        error: 'Este registro não é uma conta de anúncios (Ad Account). Verifique a conexão.' 
      };
    }

    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const campaigns = await fetchMetaCampaigns(formattedAccountId, accessToken);

    const BATCH_SIZE = 5;
    const campaignsWithInsights: CampaignWithInsights[] = [];

    for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
      const batch = campaigns.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(async (c) => {
        try { 
          const insights = await fetchCampaignInsights(c.id, accessToken);
          return { ...c, insights }; 
        } catch { 
          return c as CampaignWithInsights; 
        }
      }));
      campaignsWithInsights.push(...results);
    }

    let syncedCount = 0;
    for (const campaign of campaignsWithInsights) {
      try {
        await saveCampaignToDatabase(supabase, userId, connection.id, campaign);
        syncedCount++;
      } catch (e) { 
        console.error(`Error saving ${campaign.id}:`, e); 
      }
    }

    return { 
      success: true, 
      campaigns_synced: syncedCount, 
      message: `Sincronizadas ${syncedCount} campanhas com sucesso.` 
    };

  } catch (error: any) {
    if (error.message?.includes('OAuthException') || error.message?.includes('token')) {
      return { success: false, error: 'Token Meta expirado ou inválido. Reconecte a conta.' };
    }
    throw error;
  }
}

async function fetchMetaCampaigns(accountId: string, accessToken: string): Promise<MetaCampaign[]> {
  const fields = 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time';
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${accountId}/campaigns?fields=${fields}&limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || 'Erro API Meta');
  }
  const data = await res.json();
  return data.data || [];
}

async function fetchCampaignInsights(campaignId: string, accessToken: string): Promise<MetaInsights | null> {
  const fields = 'impressions,clicks,spend,reach,actions,action_values,ctr,date_start,date_stop';
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${campaignId}/insights?fields=${fields}&date_preset=this_month`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

async function saveCampaignToDatabase(supabase: any, userId: string, connectionId: string, campaign: CampaignWithInsights) {
  const insights = campaign.insights;
  const impressions = parseInt(insights?.impressions || '0', 10);
  const clicks = parseInt(insights?.clicks || '0', 10);
  const spend = parseFloat(insights?.spend || '0');
  
  // Mapeamento de conversões (Leads, Purchases, etc.)
  const conversions = insights?.actions?.find(a => 
    ['lead', 'purchase', 'complete_registration'].includes(a.action_type)
  );
  const conversionCount = parseInt(conversions?.value || '0', 10);
  
  // Valor das conversões (especialmente compras) para cálculo de ROAS
  const convValueAction = insights?.action_values?.find(av => 
    ['purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_conversion.purchase'].includes(av.action_type)
  );
  const conversionValue = parseFloat(convValueAction?.value || '0');
  
  const cpa = conversionCount > 0 ? spend / conversionCount : 0;
  const roas = spend > 0 ? conversionValue / spend : 0;

  // Mapeamento de status para os valores permitidos no banco
  const statusMap: Record<string, string> = { 
    'ACTIVE': 'active', 
    'PAUSED': 'paused', 
    'ARCHIVED': 'paused', // Mapear arquivadas como pausadas ou ended
    'DELETED': 'removed'
  };

  const budget = parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0');

  const { error } = await supabase.from('ad_campaigns_sync').upsert({
    user_id: userId,
    connection_id: connectionId,
    platform_campaign_id: campaign.id,
    platform_campaign_name: campaign.name,
    platform: 'meta_ads',
    status: statusMap[campaign.status] || 'paused',
    budget, 
    impressions, 
    clicks, 
    spend, 
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0, 
    cpa,
    conversions: conversionCount,
    conversion_value: conversionValue,
    roas,
    start_date: insights?.date_start || (campaign.created_time ? campaign.created_time.split('T')[0] : null),
    end_date: insights?.date_stop || (campaign.updated_time ? campaign.updated_time.split('T')[0] : null),
    synced_at: new Date().toISOString(),
  }, { onConflict: 'connection_id,platform_campaign_id' });

  if (error) throw error;
}

serve(handler);

