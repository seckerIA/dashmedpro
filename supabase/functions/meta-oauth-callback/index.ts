/**
 * Edge Function: meta-oauth-callback
 * OAuth centralizado para Meta Business Platform (WhatsApp Business + Meta Ads)
 *
 * GET: Callback do OAuth do Facebook - busca assets e salva sessão
 * POST: Configura integrações específicas (whatsapp, ads)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Configurações do Facebook App (definir como secrets no Supabase)
const FB_APP_ID = Deno.env.get('FB_APP_ID') || '';
const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const FB_OAUTH_REDIRECT_URI = Deno.env.get('FB_META_OAUTH_REDIRECT_URI') ||
  `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';

// Graph API version
const GRAPH_API_VERSION = 'v21.0';

// =====================================================
// Helper: Gerar HTML para resposta do popup
// =====================================================
function generatePopupResponse(success: boolean, sessionId?: string, error?: string): string {
  const messageObj = {
    type: 'META_OAUTH_CALLBACK',
    success,
    sessionId: sessionId || null,
    error: error || null,
  };

  // HTML sem espaços no início - crítico para renderização correta
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DashMedPro - ${success ? 'Conectado' : 'Erro'}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white}
.container{text-align:center;padding:2rem}
.spinner{width:50px;height:50px;border:4px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}
h1{font-size:1.5rem;margin-bottom:0.5rem}
p{opacity:0.9}
.error{background:rgba(255,0,0,0.2);padding:1rem;border-radius:8px;margin-top:1rem}
.success-icon{font-size:3rem;margin-bottom:1rem}
</style>
</head>
<body>
<div class="container">
${success ? `<div class="spinner"></div><h1>Conexao realizada!</h1><p>Fechando esta janela...</p>` : `<div class="success-icon">&#10060;</div><h1>Erro na conexao</h1><div class="error"><p>${(error || 'Ocorreu um erro desconhecido').replace(/'/g, "\\'")}</p></div><p style="margin-top:1rem">Esta janela sera fechada automaticamente.</p>`}
</div>
<script>
(function(){
var msg=${JSON.stringify(messageObj)};
try{if(window.opener){window.opener.postMessage(msg,'*');console.log('Message sent to opener');}}catch(e){console.error('Error:',e);}
setTimeout(function(){window.close();},${success ? 1500 : 3000});
})();
</script>
</body>
</html>`;
}

// =====================================================
// Interfaces
// =====================================================

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface Business {
  id: string;
  name: string;
}

interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  timezone_id?: string;
  message_template_namespace?: string;
  phone_numbers?: PhoneNumber[];
}

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
  code_verification_status?: string;
}

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name?: string;
}

interface MetaOAuthSession {
  businesses: Business[];
  whatsapp_accounts: WhatsAppBusinessAccount[];
  ad_accounts: AdAccount[];
}

// =====================================================
// Helper Functions
// =====================================================

async function fetchGraphAPI(endpoint: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}${endpoint}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`[Meta OAuth] Graph API error for ${endpoint}:`, errorData);
    throw new Error(errorData.error?.message || `Failed to fetch ${endpoint}`);
  }

  return response.json();
}

async function fetchAllAssets(accessToken: string): Promise<MetaOAuthSession> {
  const assets: MetaOAuthSession = {
    businesses: [],
    whatsapp_accounts: [],
    ad_accounts: [],
  };

  try {
    // 0. Verificar permissões concedidas
    console.log('[Meta OAuth] Checking granted permissions...');
    try {
      const permissionsData = await fetchGraphAPI('/me/permissions', accessToken);
      const grantedPermissions = (permissionsData.data || [])
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);
      console.log('[Meta OAuth] Granted permissions:', grantedPermissions.join(', '));
    } catch (e) {
      console.warn('[Meta OAuth] Could not check permissions:', e);
    }

    // 1. Buscar informações do usuário e suas contas
    console.log('[Meta OAuth] Fetching user info...');
    try {
      const meData = await fetchGraphAPI('/me?fields=id,name', accessToken);
      console.log('[Meta OAuth] User:', meData.name, '(', meData.id, ')');
    } catch (e) {
      console.warn('[Meta OAuth] Could not fetch user info:', e);
    }

    // 2. Buscar Businesses (empresas que o usuário administra)
    console.log('[Meta OAuth] Fetching businesses...');
    try {
      const businessesData = await fetchGraphAPI(
        '/me/businesses?fields=id,name,verification_status,created_time',
        accessToken
      );
      assets.businesses = businessesData.data || [];
      console.log(`[Meta OAuth] Found ${assets.businesses.length} businesses via /me/businesses`);

      if (assets.businesses.length > 0) {
        console.log('[Meta OAuth] Businesses:', assets.businesses.map((b: any) => b.name).join(', '));
      }
    } catch (e: any) {
      console.warn('[Meta OAuth] Could not fetch businesses:', e?.message || e);
    }

    // 3. Buscar WhatsApp Business Accounts de cada Business
    console.log('[Meta OAuth] Fetching WhatsApp Business Accounts...');

    // Primeiro, tenta via businesses
    if (assets.businesses.length > 0) {
      for (const business of assets.businesses) {
        try {
          console.log(`[Meta OAuth] Checking WABAs for business: ${business.name} (${business.id})`);
          const wabaData = await fetchGraphAPI(
            `/${business.id}/owned_whatsapp_business_accounts?fields=id,name,timezone_id,message_template_namespace`,
            accessToken
          );

          const wabas = wabaData.data || [];
          console.log(`[Meta OAuth] Found ${wabas.length} WABAs in ${business.name}`);

          for (const waba of wabas) {
            // Buscar números de telefone para cada WABA
            try {
              const phoneData = await fetchGraphAPI(
                `/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`,
                accessToken
              );
              assets.whatsapp_accounts.push({
                ...waba,
                phone_numbers: phoneData.data || []
              });
              console.log(`[Meta OAuth] WABA ${waba.name} has ${phoneData.data?.length || 0} phone numbers`);
            } catch (e) {
              console.warn(`[Meta OAuth] Could not fetch phones for WABA ${waba.id}:`, e);
              assets.whatsapp_accounts.push({ ...waba, phone_numbers: [] });
            }
          }
        } catch (e: any) {
          console.warn(`[Meta OAuth] Could not fetch WABAs for business ${business.id}:`, e?.message || e);
        }
      }
    }

    // Fallback: tentar endpoint direto de WABAs se nenhum encontrado
    if (assets.whatsapp_accounts.length === 0) {
      try {
        console.log('[Meta OAuth] Trying fallback: /me/businesses with owned_whatsapp_business_accounts');
        const wabaData = await fetchGraphAPI(
          '/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,timezone_id,message_template_namespace}',
          accessToken
        );

        for (const business of wabaData.data || []) {
          const ownedWabas = business.owned_whatsapp_business_accounts?.data || [];
          for (const waba of ownedWabas) {
            try {
              const phoneData = await fetchGraphAPI(
                `/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`,
                accessToken
              );
              assets.whatsapp_accounts.push({
                ...waba,
                phone_numbers: phoneData.data || []
              });
            } catch (e) {
              assets.whatsapp_accounts.push({ ...waba, phone_numbers: [] });
            }
          }
        }
      } catch (e) {
        console.warn('[Meta OAuth] Fallback WABA fetch failed:', e);
      }
    }

    console.log(`[Meta OAuth] Total WhatsApp accounts found: ${assets.whatsapp_accounts.length}`);

    // 4. Buscar Ad Accounts
    console.log('[Meta OAuth] Fetching Ad Accounts...');

    // 4a. Direto do usuário
    try {
      const adAccountsData = await fetchGraphAPI(
        '/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name',
        accessToken
      );
      const userAdAccounts = adAccountsData.data || [];
      console.log(`[Meta OAuth] Found ${userAdAccounts.length} ad accounts via /me/adaccounts`);
      assets.ad_accounts.push(...userAdAccounts);
    } catch (e: any) {
      console.warn('[Meta OAuth] Could not fetch ad accounts from /me:', e?.message || e);
    }

    // 4b. De cada Business
    if (assets.businesses.length > 0) {
      for (const business of assets.businesses) {
        try {
          console.log(`[Meta OAuth] Checking ad accounts for business: ${business.name}`);
          const bizAdAccounts = await fetchGraphAPI(
            `/${business.id}/owned_ad_accounts?fields=id,name,account_id,account_status,currency,timezone_name`,
            accessToken
          );
          const newAccounts = (bizAdAccounts.data || []).filter(
            (acc: any) => !assets.ad_accounts.some((existing: any) => existing.id === acc.id)
          );
          if (newAccounts.length > 0) {
            console.log(`[Meta OAuth] Found ${newAccounts.length} additional ad accounts in ${business.name}`);
            assets.ad_accounts.push(...newAccounts);
          }
        } catch (e: any) {
          console.warn(`[Meta OAuth] Could not fetch ad accounts for business ${business.id}:`, e?.message || e);
        }
      }
    }

    console.log(`[Meta OAuth] Total Ad accounts found: ${assets.ad_accounts.length}`);
    if (assets.ad_accounts.length > 0) {
      console.log('[Meta OAuth] Ad Accounts:', assets.ad_accounts.map((a: any) => `${a.name} (${a.account_id})`).join(', '));
    }

  } catch (error: any) {
    console.error('[Meta OAuth] Error fetching assets:', error?.message || error);
  }

  // Log final summary
  console.log('[Meta OAuth] === ASSETS SUMMARY ===');
  console.log(`[Meta OAuth] Businesses: ${assets.businesses.length}`);
  console.log(`[Meta OAuth] WhatsApp Accounts: ${assets.whatsapp_accounts.length}`);
  console.log(`[Meta OAuth] Ad Accounts: ${assets.ad_accounts.length}`);

  return assets;
}

// =====================================================
// Main Handler
// =====================================================

const handler = async (req: Request): Promise<Response> => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

  // =========================================
  // GET: Callback do OAuth
  // =========================================
  if (req.method === 'GET') {
    const code = url.searchParams.get('code');
    const rawState = url.searchParams.get('state'); // contém user_id|popup ou apenas user_id
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Parsear state para detectar modo popup
    const stateParts = rawState?.split('|') || [];
    const state = stateParts[0]; // user_id
    const isPopupMode = stateParts[1] === 'popup';

    console.log('[Meta OAuth] Callback received:', { code: code?.substring(0, 20) + '...', state, isPopupMode, error });

    // Helper para responder (popup ou redirect)
    const respond = (success: boolean, sessionId?: string, errorMsg?: string) => {
      if (isPopupMode) {
        return new Response(generatePopupResponse(success, sessionId, errorMsg), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // Modo redirect (fallback)
      if (success && sessionId) {
        return Response.redirect(
          `${FRONTEND_URL}/marketing?tab=integracoes&oauth=success&session=${sessionId}`,
          302
        );
      }
      return Response.redirect(
        `${FRONTEND_URL}/marketing?tab=integracoes&oauth_error=${encodeURIComponent(errorMsg || 'Erro desconhecido')}`,
        302
      );
    };

    // Verificar erros do Facebook
    if (error) {
      console.error('[Meta OAuth] Facebook error:', error, errorDescription);
      return respond(false, undefined, errorDescription || error);
    }

    if (!code || !state) {
      return respond(false, undefined, 'Parâmetros inválidos');
    }

    // Verificar configuração
    if (!FB_APP_ID || !FB_APP_SECRET) {
      console.error('[Meta OAuth] Missing FB_APP_ID or FB_APP_SECRET');
      return respond(false, undefined, 'Configuração OAuth incompleta no servidor');
    }

    try {
      // 1. Trocar code por access_token
      console.log('[Meta OAuth] Exchanging code for token...');
      const tokenResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
        `client_id=${FB_APP_ID}` +
        `&client_secret=${FB_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(FB_OAUTH_REDIRECT_URI)}` +
        `&code=${code}`
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao obter token');
      }

      const tokenData: FacebookTokenResponse = await tokenResponse.json();
      console.log('[Meta OAuth] Token received, expires in:', tokenData.expires_in);

      // 2. Obter token de longa duração (60 dias)
      console.log('[Meta OAuth] Getting long-lived token...');
      let accessToken = tokenData.access_token;
      let tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

      const longLivedResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FB_APP_ID}` +
        `&client_secret=${FB_APP_SECRET}` +
        `&fb_exchange_token=${tokenData.access_token}`
      );

      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        accessToken = longLivedData.access_token;
        tokenExpiresAt = new Date(Date.now() + (longLivedData.expires_in || 5184000) * 1000); // ~60 dias
        console.log('[Meta OAuth] Long-lived token obtained, expires:', tokenExpiresAt.toISOString());
      }

      // 3. Buscar assets (businesses, wabas, ad accounts)
      const assets = await fetchAllAssets(accessToken);

      // 4. Salvar sessão OAuth no banco
      const supabaseAdmin = createClient(
        SUPABASE_URL,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Upsert na tabela meta_oauth_sessions
      const { data: oauthSession, error: sessionError } = await supabaseAdmin
        .from('meta_oauth_sessions')
        .upsert({
          user_id: state,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          businesses: assets.businesses,
          whatsapp_accounts: assets.whatsapp_accounts,
          ad_accounts: assets.ad_accounts,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Sessão válida por 30 min
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select('id')
        .single();

      if (sessionError) {
        console.error('[Meta OAuth] Error saving session:', sessionError);
        throw new Error('Falha ao salvar sessão OAuth');
      }

      console.log('[Meta OAuth] Session saved:', oauthSession.id);

      // 5. Responder (popup ou redirect)
      return respond(true, oauthSession.id);

    } catch (error: any) {
      console.error('[Meta OAuth] Error:', error.message);
      return respond(false, undefined, error.message);
    }
  }

  // =========================================
  // POST: Configurar integrações específicas
  // =========================================
  if (req.method === 'POST') {
    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Não autorizado');
      }

      const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const body = await req.json();
      const { action, session_id } = body;

      // Buscar sessão OAuth
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('meta_oauth_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) {
        throw new Error('Sessão OAuth inválida ou expirada');
      }

      // Buscar organization_id do usuário
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const organizationId = profile?.organization_id;

      let result: any;

      // =========================================
      // Action: configure_whatsapp
      // =========================================
      if (action === 'configure_whatsapp') {
        const { waba_id, phone_number_id } = body;

        // Encontrar WABA e número selecionados
        const wabas = session.whatsapp_accounts as WhatsAppBusinessAccount[];
        const selectedWaba = wabas.find(w => w.id === waba_id);
        if (!selectedWaba) throw new Error('WABA não encontrado');

        const selectedPhone = selectedWaba.phone_numbers?.find(p => p.id === phone_number_id);
        if (!selectedPhone) throw new Error('Número não encontrado');

        // Gerar verify token para webhook
        const webhookVerifyToken = crypto.randomUUID();

        // Salvar configuração do WhatsApp
        const { data: config, error: configError } = await supabaseAdmin
          .from('whatsapp_config')
          .upsert({
            user_id: user.id,
            organization_id: organizationId,
            phone_number_id: phone_number_id,
            waba_id: waba_id,
            access_token: session.access_token,
            display_phone_number: selectedPhone.display_phone_number,
            verified_name: selectedPhone.verified_name,
            quality_rating: selectedPhone.quality_rating,
            webhook_verify_token: webhookVerifyToken,
            is_active: true,
            last_synced_at: new Date().toISOString(),
            oauth_connected: true,
            oauth_expires_at: session.token_expires_at
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (configError) throw configError;

        // Tentar configurar webhook automaticamente
        let webhookConfigured = false;
        try {
          const subscribeResponse = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${waba_id}/subscribed_apps`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` }
            }
          );
          webhookConfigured = subscribeResponse.ok;
        } catch (e) {
          console.warn('[Meta OAuth] Could not auto-configure webhook:', e);
        }

        result = {
          success: true,
          integration: 'whatsapp',
          config: {
            id: config.id,
            phone_number: config.display_phone_number,
            verified_name: config.verified_name
          },
          webhook_configured: webhookConfigured,
          webhook_url: `${SUPABASE_URL}/functions/v1/whatsapp-webhook`,
          webhook_verify_token: webhookVerifyToken
        };
      }

      // =========================================
      // Action: configure_ads
      // =========================================
      else if (action === 'configure_ads') {
        const { ad_account_id } = body;

        const adAccounts = session.ad_accounts as AdAccount[];
        const selectedAccount = adAccounts.find(a => a.id === ad_account_id || a.account_id === ad_account_id);
        if (!selectedAccount) throw new Error('Conta de Ads não encontrada');

        // Salvar conexão de Ads (usa tabela existente ad_platform_connections)
        const { data: connection, error: connError } = await supabaseAdmin
          .from('ad_platform_connections')
          .upsert({
            user_id: user.id,
            organization_id: organizationId,
            platform: 'meta_ads',
            account_id: selectedAccount.account_id || selectedAccount.id.replace('act_', ''),
            account_name: selectedAccount.name,
            api_key: session.access_token, // Token de acesso
            is_active: true,
            sync_status: 'pending',
            last_sync_at: null,
            metadata: {
              currency: selectedAccount.currency,
              timezone: selectedAccount.timezone_name,
              account_status: selectedAccount.account_status,
              oauth_expires_at: session.token_expires_at
            }
          }, {
            onConflict: 'user_id,platform,account_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (connError) throw connError;

        result = {
          success: true,
          integration: 'ads',
          connection: {
            id: connection.id,
            account_name: connection.account_name,
            account_id: connection.account_id
          }
        };
      }

      // =========================================
      // Action: get_session (retornar assets disponíveis)
      // =========================================
      else if (action === 'get_session') {
        result = {
          success: true,
          session: {
            id: session.id,
            expires_at: session.expires_at,
            token_expires_at: session.token_expires_at,
            businesses: session.businesses,
            whatsapp_accounts: session.whatsapp_accounts,
            ad_accounts: session.ad_accounts,
          }
        };
      }

      // =========================================
      // Action: clear_session (limpar sessão OAuth)
      // =========================================
      else if (action === 'clear_session') {
        await supabaseAdmin
          .from('meta_oauth_sessions')
          .delete()
          .eq('id', session_id);

        result = { success: true, message: 'Sessão limpa com sucesso' };
      }

      else {
        throw new Error(`Ação desconhecida: ${action}`);
      }

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('[Meta OAuth] POST error:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
};

serve(handler);
