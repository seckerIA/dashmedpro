/**
 * Edge Function: whatsapp-list-accounts
 * Lista WABAs e números de telefone do Business Manager
 * e conecta o número selecionado ao whatsapp_config
 *
 * Actions:
 *   - list: busca WABAs + phones via Graph API usando token salvo
 *   - connect: salva WABA/phone selecionado no whatsapp_config
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const GRAPH_API_VERSION = 'v22.0';

// =====================================================
// Graph API Helper
// =====================================================

async function fetchGraphAPI(endpoint: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}${endpoint}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const errorData = await response.json();
    const errorCode = errorData.error?.code;
    const errorMessage = errorData.error?.message || `Failed to fetch ${endpoint}`;

    // Token expirado
    if (errorCode === 190) {
      const err = new Error('Token expirado. Reconecte sua conta Meta.');
      (err as any).code = 'TOKEN_EXPIRED';
      throw err;
    }

    // Permissão insuficiente
    if (errorCode === 10 || errorCode === 200) {
      const err = new Error('Permissão insuficiente para acessar contas WhatsApp.');
      (err as any).code = 'PERMISSION_DENIED';
      throw err;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// =====================================================
// Interfaces
// =====================================================

interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  timezone_id?: string;
  phone_numbers: PhoneNumber[];
}

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}

// =====================================================
// Action: list — Buscar WABAs e phones do BM
// =====================================================

async function handleList(accessToken: string) {
  const whatsappAccounts: WhatsAppBusinessAccount[] = [];

  // 1. Buscar businesses
  console.log('[WhatsApp List] Fetching businesses...');
  let businesses: any[] = [];
  try {
    const bizData = await fetchGraphAPI('/me/businesses?fields=id,name', accessToken);
    businesses = bizData.data || [];
    console.log(`[WhatsApp List] Found ${businesses.length} businesses`);
  } catch (e: any) {
    console.warn('[WhatsApp List] Could not fetch businesses:', e?.message);
    // Tentar fallback: buscar WABAs diretamente sem businesses
  }

  // 2. Para cada business, buscar WABAs
  for (const biz of businesses) {
    try {
      console.log(`[WhatsApp List] Checking WABAs for: ${biz.name} (${biz.id})`);
      const wabaData = await fetchGraphAPI(
        `/${biz.id}/owned_whatsapp_business_accounts?fields=id,name,timezone_id`,
        accessToken
      );

      const wabas = wabaData.data || [];
      console.log(`[WhatsApp List] Found ${wabas.length} WABAs in ${biz.name}`);

      // 3. Para cada WABA, buscar phone numbers
      for (const waba of wabas) {
        try {
          const phoneData = await fetchGraphAPI(
            `/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`,
            accessToken
          );

          whatsappAccounts.push({
            id: waba.id,
            name: waba.name,
            timezone_id: waba.timezone_id,
            phone_numbers: phoneData.data || [],
          });

          console.log(`[WhatsApp List] WABA ${waba.name}: ${phoneData.data?.length || 0} phones`);
        } catch (e: any) {
          console.warn(`[WhatsApp List] Could not fetch phones for WABA ${waba.id}:`, e?.message);
          whatsappAccounts.push({ ...waba, phone_numbers: [] });
        }
      }
    } catch (e: any) {
      console.warn(`[WhatsApp List] Could not fetch WABAs for business ${biz.id}:`, e?.message);
    }
  }

  console.log(`[WhatsApp List] Total: ${whatsappAccounts.length} WABAs found`);

  return { success: true, whatsapp_accounts: whatsappAccounts };
}

// =====================================================
// Action: connect — Salvar WABA/phone selecionado
// =====================================================

async function handleConnect(
  accessToken: string,
  userId: string,
  wabaId: string,
  phoneNumberId: string,
  supabaseAdmin: any
) {
  // 1. Buscar detalhes do phone number
  console.log(`[WhatsApp Connect] Fetching phone details: ${phoneNumberId}`);
  let displayPhoneNumber = '';
  let verifiedName = '';

  try {
    const phoneData = await fetchGraphAPI(
      `/${phoneNumberId}?fields=display_phone_number,verified_name`,
      accessToken
    );
    displayPhoneNumber = phoneData.display_phone_number || '';
    verifiedName = phoneData.verified_name || '';
  } catch (e: any) {
    console.warn('[WhatsApp Connect] Could not fetch phone details:', e?.message);
  }

  // 2. Gerar webhook verify token
  const webhookVerifyToken = crypto.randomUUID();

  // 3. Upsert em whatsapp_config
  console.log('[WhatsApp Connect] Saving to whatsapp_config...');
  const { data: config, error: configError } = await supabaseAdmin
    .from('whatsapp_config')
    .upsert({
      user_id: userId,
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      business_account_id: wabaId,
      access_token: accessToken,
      display_phone_number: displayPhoneNumber,
      verified_name: verifiedName,
      webhook_verify_token: webhookVerifyToken,
      is_active: true,
      oauth_connected: true,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('id, display_phone_number, verified_name')
    .single();

  if (configError) {
    console.error('[WhatsApp Connect] Error saving config:', configError);
    throw new Error('Falha ao salvar configuração do WhatsApp');
  }

  console.log('[WhatsApp Connect] Config saved:', config.id);

  // 4. Tentar auto-subscribe webhook
  let webhookConfigured = false;
  try {
    const subscribeResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    webhookConfigured = subscribeResponse.ok;
    console.log('[WhatsApp Connect] Webhook subscribe:', webhookConfigured ? 'success' : 'failed');
  } catch (e) {
    console.warn('[WhatsApp Connect] Could not auto-subscribe webhook:', e);
  }

  return {
    success: true,
    config: {
      id: config.id,
      phone_number: config.display_phone_number,
      verified_name: config.verified_name,
    },
    webhook_configured: webhookConfigured,
    webhook_url: `${SUPABASE_URL}/functions/v1/whatsapp-webhook`,
    webhook_verify_token: webhookVerifyToken,
  };
}

// =====================================================
// Main Handler
// =====================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Autenticar
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { action, waba_id, phone_number_id } = await req.json();

    // Buscar token salvo do Meta OAuth
    const { data: oauthRecord, error: oauthError } = await supabaseAdmin
      .from('ad_platform_connections')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('platform', 'meta_ads')
      .eq('account_id', 'meta_oauth')
      .eq('is_active', true)
      .single();

    if (oauthError || !oauthRecord?.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meta não conectado. Conecte primeiro via OAuth.', code: 'NO_TOKEN' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = oauthRecord.api_key;
    let result: any;

    if (action === 'list') {
      result = await handleList(accessToken);
    } else if (action === 'connect') {
      if (!waba_id || !phone_number_id) {
        throw new Error('waba_id e phone_number_id são obrigatórios');
      }
      result = await handleConnect(accessToken, user.id, waba_id, phone_number_id, supabaseAdmin);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WhatsApp List] Error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
