/**
 * Edge Function: meta-token-exchange
 * Troca código OAuth por access token e salva configurações
 *
 * Discovery hierárquico: BM → owned_ad_accounts, owned_pages, owned_whatsapp_business_accounts
 * Cada child asset recebe parent_account_id apontando para o BM pai.
 *
 * Recebe:
 * - code: Código do FB.login()
 * - access_token: Token direto do FB.login (fallback)
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

interface PageAccount {
  id: string;
  name: string;
  access_token: string;
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
      tokenExpiresAt = longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : null;
      console.log('[Token Exchange] Got long-lived token, expires:', tokenExpiresAt?.toISOString() || 'never');
    } else {
      console.warn('[Token Exchange] Could not get long-lived token, using short-lived');
    }

    // 3. Salvar configuração do WhatsApp (se dados disponíveis via Embedded Signup)
    if (whatsapp_data?.waba_id && whatsapp_data?.phone_number_id) {
      console.log('[Token Exchange] Saving WhatsApp config...');

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

      const webhookVerifyToken = crypto.randomUUID();

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

    // 4. Salvar registro base de conexão OAuth
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
    }

    // =====================================================
    // 5. DISCOVERY HIERÁRQUICO: BM → child assets
    // =====================================================
    // Track account_ids discovered via BMs to avoid overwriting parent_account_id
    const discoveredViaBM = new Set<string>();
    let businessesCount = 0;
    let adAccountsCount = 0;
    let pagesCount = 0;

    // 5a. Buscar Business Managers
    try {
      console.log('[Token Exchange] Fetching businesses...');
      const bizResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/me/businesses?fields=id,name&access_token=${accessToken}`
      );
      if (bizResponse.ok) {
        const bizData = await bizResponse.json();
        const businesses: Business[] = bizData.data || [];
        businessesCount = businesses.length;
        console.log(`[Token Exchange] Found ${businesses.length} businesses`);

        for (const biz of businesses) {
          const bmAccountId = `bm_${biz.id}`;

          // Salvar BM (top-level, sem parent)
          const { error: bizError } = await supabaseAdmin
            .from('ad_platform_connections')
            .upsert({
              user_id: user.id,
              platform: 'meta_ads',
              account_id: bmAccountId,
              account_name: biz.name,
              api_key: accessToken,
              is_active: true,
              sync_status: 'success',
              account_category: 'bm',
              parent_account_id: null,
            }, {
              onConflict: 'user_id,platform,account_id',
            });

          if (bizError) {
            console.error('[Token Exchange] Error saving business:', biz.name, bizError);
          }

          // 5b. Buscar Ad Accounts do BM
          try {
            const bmAdAccountsResponse = await fetch(
              `https://graph.facebook.com/${GRAPH_API_VERSION}/${biz.id}/owned_ad_accounts?fields=id,account_id,name,currency,account_status&limit=100&access_token=${accessToken}`
            );
            if (bmAdAccountsResponse.ok) {
              const bmAdAccountsData = await bmAdAccountsResponse.json();
              const bmAdAccounts: AdAccount[] = bmAdAccountsData.data || [];
              console.log(`[Token Exchange] Found ${bmAdAccounts.length} ad accounts in ${biz.name}`);

              for (const account of bmAdAccounts) {
                const accountId = account.account_id || account.id.replace('act_', '');
                discoveredViaBM.add(accountId);
                adAccountsCount++;

                const { error: adError } = await supabaseAdmin
                  .from('ad_platform_connections')
                  .upsert({
                    user_id: user.id,
                    platform: 'meta_ads',
                    account_id: accountId,
                    account_name: account.name,
                    api_key: accessToken,
                    is_active: true,
                    sync_status: 'pending',
                    account_category: 'other',
                    parent_account_id: bmAccountId,
                  }, {
                    onConflict: 'user_id,platform,account_id',
                  });

                if (adError) {
                  console.error('[Token Exchange] Error saving BM ad account:', account.name, adError);
                }
              }
            }
          } catch (e) {
            console.warn(`[Token Exchange] Could not fetch ad accounts for ${biz.name}:`, e);
          }

          // 5c. Buscar WABAs do BM
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
                    parent_account_id: bmAccountId,
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

          // 5d. Buscar Pages do BM
          try {
            const bmPagesResponse = await fetch(
              `https://graph.facebook.com/${GRAPH_API_VERSION}/${biz.id}/owned_pages?fields=id,name,access_token&limit=100&access_token=${accessToken}`
            );
            if (bmPagesResponse.ok) {
              const bmPagesData = await bmPagesResponse.json();
              const bmPages: PageAccount[] = bmPagesData.data || [];
              console.log(`[Token Exchange] Found ${bmPages.length} pages in ${biz.name}`);

              for (const page of bmPages) {
                const pageAccountId = `page_${page.id}`;
                discoveredViaBM.add(pageAccountId);
                pagesCount++;

                const { error: pageError } = await supabaseAdmin
                  .from('ad_platform_connections')
                  .upsert({
                    user_id: user.id,
                    platform: 'meta_ads',
                    account_id: pageAccountId,
                    account_name: page.name,
                    api_key: page.access_token,
                    is_active: true,
                    sync_status: 'success',
                    account_category: 'page',
                    parent_account_id: bmAccountId,
                  }, {
                    onConflict: 'user_id,platform,account_id',
                  });

                if (pageError) {
                  console.error('[Token Exchange] Error saving BM page:', page.name, pageError);
                }

                // Subscribe page to leadgen webhook
                try {
                  const subscribeResponse = await fetch(
                    `https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}/subscribed_apps`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        subscribed_fields: ['leadgen'],
                        access_token: page.access_token,
                      }),
                    }
                  );
                  if (subscribeResponse.ok) {
                    console.log(`[Token Exchange] Page "${page.name}" subscribed to leadgen`);
                  }
                } catch (e) {
                  console.warn(`[Token Exchange] Error subscribing page "${page.name}":`, e);
                }
              }
            }
          } catch (e) {
            console.warn(`[Token Exchange] Could not fetch pages for ${biz.name}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn('[Token Exchange] Could not fetch businesses:', e);
    }

    // =====================================================
    // 6. FALLBACK: Orphan ad accounts (not owned by any BM)
    // =====================================================
    try {
      console.log('[Token Exchange] Fetching orphan ad accounts via /me/adaccounts...');
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts?` +
        `fields=id,account_id,name,currency,timezone_name,account_status` +
        `&access_token=${accessToken}`
      );

      if (adAccountsResponse.ok) {
        const adAccountsData = await adAccountsResponse.json();
        const allAdAccounts: AdAccount[] = adAccountsData.data || [];
        let orphanCount = 0;

        for (const account of allAdAccounts) {
          const accountId = account.account_id || account.id.replace('act_', '');

          // Skip if already discovered via BM (don't overwrite parent_account_id)
          if (discoveredViaBM.has(accountId)) {
            continue;
          }

          orphanCount++;
          adAccountsCount++;

          // WABA-associated ad accounts detected by "(Read-Only)" pattern
          const isWabaAdAccount = account.name?.includes('(Read-Only)');
          const category = isWabaAdAccount ? 'waba' : 'other';

          const { error: adError } = await supabaseAdmin
            .from('ad_platform_connections')
            .upsert({
              user_id: user.id,
              platform: 'meta_ads',
              account_id: accountId,
              account_name: account.name,
              api_key: accessToken,
              is_active: true,
              sync_status: 'pending',
              account_category: category,
              parent_account_id: null, // Orphan — no BM parent
            }, {
              onConflict: 'user_id,platform,account_id',
            });

          if (adError) {
            console.error('[Token Exchange] Error saving orphan ad account:', account.name, adError);
          }
        }

        console.log(`[Token Exchange] Found ${orphanCount} orphan ad accounts (${allAdAccounts.length} total)`);
      }
    } catch (e) {
      console.warn('[Token Exchange] Could not fetch orphan ad accounts:', e);
    }

    // =====================================================
    // 7. FALLBACK: Orphan pages (not owned by any BM)
    // =====================================================
    try {
      console.log('[Token Exchange] Fetching orphan pages via /me/accounts...');
      const pagesResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
      );
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const allPages: PageAccount[] = pagesData.data || [];
        let orphanPageCount = 0;

        for (const page of allPages) {
          const pageAccountId = `page_${page.id}`;

          // Skip if already discovered via BM
          if (discoveredViaBM.has(pageAccountId)) {
            continue;
          }

          orphanPageCount++;
          pagesCount++;

          const { error: pageError } = await supabaseAdmin
            .from('ad_platform_connections')
            .upsert({
              user_id: user.id,
              platform: 'meta_ads',
              account_id: pageAccountId,
              account_name: page.name,
              api_key: page.access_token,
              is_active: true,
              sync_status: 'success',
              account_category: 'page',
              parent_account_id: null, // Orphan — no BM parent
            }, {
              onConflict: 'user_id,platform,account_id',
            });

          if (pageError) {
            console.error('[Token Exchange] Error saving orphan page:', page.name, pageError);
          }

          // Subscribe orphan page to leadgen webhook too
          try {
            await fetch(
              `https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}/subscribed_apps`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscribed_fields: ['leadgen'],
                  access_token: page.access_token,
                }),
              }
            );
          } catch (e) {
            // Silent fail for orphan page subscription
          }
        }

        console.log(`[Token Exchange] Found ${orphanPageCount} orphan pages (${allPages.length} total)`);
      }
    } catch (e) {
      console.warn('[Token Exchange] Could not fetch orphan pages:', e);
    }

    // Retornar sucesso
    console.log(`[Token Exchange] Complete: ${businessesCount} BMs, ${adAccountsCount} ad accounts, ${pagesCount} pages`);
    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_connected: !!(whatsapp_data?.waba_id),
        ads_connected: adAccountsCount > 0,
        businesses_count: businessesCount,
        ad_accounts_count: adAccountsCount,
        pages_count: pagesCount,
        token_expires_at: tokenExpiresAt?.toISOString() || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Token Exchange] Error:', errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
