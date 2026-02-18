/**
 * Edge Function: meta-token-exchange
 * Troca código OAuth por access token e salva configurações
 *
 * Recebe:
 * - code: Código do FB.login()
 * - whatsapp_data: Dados do Embedded Signup (opcional)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Configurações
const FB_APP_ID = Deno.env.get('FB_APP_ID') || '';
const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const GRAPH_API_VERSION = 'v22.0';

interface WhatsAppData {
  phone_number_id?: string;
  waba_id?: string;
  businessId?: string;
}

interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name?: string;
  account_status: number;
}

interface Business {
  id: string;
  name: string;
}

interface WABAAccount {
  id: string;
  name: string;
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Verificar autenticação
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

    // Parsear body — aceita code (FB.login code exchange) ou access_token direto
    const { code, access_token: directAccessToken, whatsapp_data } = await req.json() as {
      code?: string;
      access_token?: string;
      whatsapp_data?: WhatsAppData;
    };

    if (!code && !directAccessToken) {
      throw new Error('Código ou access token não fornecido');
    }

    console.log('[Token Exchange] Starting for user:', user.id);
    console.log('[Token Exchange] Mode:', code ? 'code_exchange' : 'direct_token');
    console.log('[Token Exchange] WhatsApp data:', whatsapp_data);

    // Verificar configuração (app secret necessário para code exchange e long-lived token)
    if (!FB_APP_ID || !FB_APP_SECRET) {
      throw new Error('Configuração do Facebook incompleta');
    }

    let accessToken: string;
    let tokenExpiresAt: Date | null = null;

    if (code) {
      // 1a. Trocar código por access token
      console.log('[Token Exchange] Exchanging code for token...');
      const tokenResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
        `client_id=${FB_APP_ID}` +
        `&client_secret=${FB_APP_SECRET}` +
        `&code=${code}`
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('[Token Exchange] Token exchange failed:', errorData);
        throw new Error(errorData.error?.message || 'Falha ao trocar código por token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      console.log('[Token Exchange] Got short-lived token, expires:', tokenExpiresAt?.toISOString());
    } else {
      // 1b. Usar access token direto (fallback do FB.login)
      console.log('[Token Exchange] Using direct access token');
      accessToken = directAccessToken!;
    }

    // 2. Trocar por token de longa duração (60 dias ou nunca expira)
    console.log('[Token Exchange] Getting long-lived token...');
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&fb_exchange_token=${accessToken}`
    );

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      accessToken = longLivedData.access_token;
      // Token de longa duração: 60 dias, ou "Never" se configurado assim
      tokenExpiresAt = longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : null; // null = never expires
      console.log('[Token Exchange] Got long-lived token, expires:', tokenExpiresAt?.toISOString() || 'never');
    } else {
      console.warn('[Token Exchange] Could not get long-lived token, using short-lived');
    }

    // 3. Buscar contas de anúncios
    console.log('[Token Exchange] Fetching ad accounts...');
    let adAccounts: AdAccount[] = [];
    try {
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts?` +
        `fields=id,account_id,name,currency,timezone_name,account_status` +
        `&access_token=${accessToken}`
      );

      if (adAccountsResponse.ok) {
        const adAccountsData = await adAccountsResponse.json();
        adAccounts = adAccountsData.data || [];
        console.log(`[Token Exchange] Found ${adAccounts.length} ad accounts`);
      }
    } catch (e) {
      console.warn('[Token Exchange] Could not fetch ad accounts:', e);
    }

    // 4. Salvar configuração do WhatsApp (se dados disponíveis)
    if (whatsapp_data?.waba_id && whatsapp_data?.phone_number_id) {
      console.log('[Token Exchange] Saving WhatsApp config...');

      // Buscar informações do número
      let displayPhoneNumber = '';
      let verifiedName = '';

      try {
        const phoneResponse = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsapp_data.phone_number_id}?` +
          `fields=display_phone_number,verified_name` +
          `&access_token=${accessToken}`
        );

        if (phoneResponse.ok) {
          const phoneData = await phoneResponse.json();
          displayPhoneNumber = phoneData.display_phone_number || '';
          verifiedName = phoneData.verified_name || '';
        }
      } catch (e) {
        console.warn('[Token Exchange] Could not fetch phone info:', e);
      }

      // Gerar webhook verify token
      const webhookVerifyToken = crypto.randomUUID();

      // Upsert whatsapp_config
      const { error: whatsappError } = await supabaseAdmin
        .from('whatsapp_config')
        .upsert({
          user_id: user.id,
          waba_id: whatsapp_data.waba_id,
          phone_number_id: whatsapp_data.phone_number_id,
          business_account_id: whatsapp_data.businessId || whatsapp_data.waba_id,
          access_token: accessToken,
          display_phone_number: displayPhoneNumber,
          verified_name: verifiedName,
          webhook_verify_token: webhookVerifyToken,
          is_active: true,
          oauth_connected: true,
          oauth_expires_at: tokenExpiresAt?.toISOString() || null,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (whatsappError) {
        console.error('[Token Exchange] Error saving WhatsApp config:', whatsappError);
      } else {
        console.log('[Token Exchange] WhatsApp config saved successfully');
      }
    }

    // 5. Salvar registro base de conexão OAuth (garante que o gate sabe que está conectado)
    console.log('[Token Exchange] Saving OAuth connection record...');
    const { error: oauthRecordError } = await supabaseAdmin
      .from('ad_platform_connections')
      .upsert({
        user_id: user.id,
        platform: 'meta_ads',
        account_id: 'meta_oauth',
        account_name: 'Meta Business Connection',
        api_key: accessToken,
        is_active: true,
        sync_status: 'success',
      }, {
        onConflict: 'user_id,platform,account_id',
      });

    if (oauthRecordError) {
      console.error('[Token Exchange] Error saving OAuth record:', oauthRecordError);
    } else {
      console.log('[Token Exchange] OAuth record saved successfully');
    }

    // 5b. Salvar contas de anúncios individuais
    // Ad accounts with "(Read-Only)" are auto-created by WhatsApp → category 'waba'
    // Regular ad accounts → category 'other'
    if (adAccounts.length > 0) {
      console.log('[Token Exchange] Saving ad accounts...');

      for (const account of adAccounts) {
        // Detect WABA-associated ad accounts by "(Read-Only)" pattern
        const isWabaAdAccount = account.name?.includes('(Read-Only)');
        const category = isWabaAdAccount ? 'waba' : 'other';

        const { error: adError } = await supabaseAdmin
          .from('ad_platform_connections')
          .upsert({
            user_id: user.id,
            platform: 'meta_ads',
            account_id: account.account_id || account.id.replace('act_', ''),
            account_name: account.name,
            api_key: accessToken,
            is_active: true,
            sync_status: 'pending',
            account_category: category,
          }, {
            onConflict: 'user_id,platform,account_id',
          });

        if (adError) {
          console.error('[Token Exchange] Error saving ad account:', account.name, adError);
        }
      }

      console.log('[Token Exchange] Ad accounts saved successfully');
    }

    // 5c. Buscar e salvar Business Managers (category: 'bm')
    try {
      console.log('[Token Exchange] Fetching businesses...');
      const bizResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/me/businesses?fields=id,name&access_token=${accessToken}`
      );
      if (bizResponse.ok) {
        const bizData = await bizResponse.json();
        const businesses: Business[] = bizData.data || [];
        console.log(`[Token Exchange] Found ${businesses.length} businesses`);

        for (const biz of businesses) {
          const { error: bizError } = await supabaseAdmin
            .from('ad_platform_connections')
            .upsert({
              user_id: user.id,
              platform: 'meta_ads',
              account_id: `bm_${biz.id}`,
              account_name: biz.name,
              api_key: accessToken,
              is_active: true,
              sync_status: 'success',
              account_category: 'bm',
            }, {
              onConflict: 'user_id,platform,account_id',
            });

          if (bizError) {
            console.error('[Token Exchange] Error saving business:', biz.name, bizError);
          }

          // 5d. Buscar WABAs de cada Business (category: 'waba')
          try {
            const wabaResponse = await fetch(
              `https://graph.facebook.com/${GRAPH_API_VERSION}/${biz.id}/owned_whatsapp_business_accounts?fields=id,name&access_token=${accessToken}`
            );
            if (wabaResponse.ok) {
              const wabaData = await wabaResponse.json();
              const wabas: WABAAccount[] = wabaData.data || [];
              console.log(`[Token Exchange] Found ${wabas.length} WABAs in ${biz.name}`);

              for (const waba of wabas) {
                const { error: wabaError } = await supabaseAdmin
                  .from('ad_platform_connections')
                  .upsert({
                    user_id: user.id,
                    platform: 'meta_ads',
                    account_id: `waba_${waba.id}`,
                    account_name: waba.name,
                    api_key: accessToken,
                    is_active: true,
                    sync_status: 'success',
                    account_category: 'waba',
                  }, {
                    onConflict: 'user_id,platform,account_id',
                  });

                if (wabaError) {
                  console.error('[Token Exchange] Error saving WABA:', waba.name, wabaError);
                }
              }
            }
          } catch (e) {
            console.warn(`[Token Exchange] Could not fetch WABAs for ${biz.name}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn('[Token Exchange] Could not fetch businesses:', e);
    }

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_connected: !!(whatsapp_data?.waba_id),
        ads_connected: adAccounts.length > 0,
        ad_accounts_count: adAccounts.length,
        token_expires_at: tokenExpiresAt?.toISOString() || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Token Exchange] Error:', errorMessage);

    // Retorna 200 com success:false para que supabase.functions.invoke
    // repasse a mensagem de erro real ao frontend (non-2xx perde a mensagem)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
