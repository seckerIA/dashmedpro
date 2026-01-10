/**
 * Edge Function: whatsapp-oauth-callback
 * Recebe callback do OAuth do Facebook e configura WhatsApp automaticamente
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações do Facebook App (definir como secrets no Supabase)
const FB_APP_ID = Deno.env.get('FB_APP_ID') || '';
const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET') || '';
const FB_OAUTH_REDIRECT_URI = Deno.env.get('FB_OAUTH_REDIRECT_URI') ||
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-oauth-callback`;
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';

interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

interface WhatsAppBusinessAccount {
    id: string;
    name: string;
    timezone_id: string;
    message_template_namespace: string;
}

interface PhoneNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    code_verification_status: string;
}

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
        const state = url.searchParams.get('state'); // contém user_id
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        console.log('[OAuth] Callback received:', { code: code?.substring(0, 20) + '...', state, error });

        // Verificar erros do Facebook
        if (error) {
            console.error('[OAuth] Facebook error:', error, errorDescription);
            return Response.redirect(
                `${FRONTEND_URL}/whatsapp/settings?error=${encodeURIComponent(errorDescription || error)}`,
                302
            );
        }

        if (!code || !state) {
            return Response.redirect(
                `${FRONTEND_URL}/whatsapp/settings?error=${encodeURIComponent('Parâmetros inválidos')}`,
                302
            );
        }

        // Verificar configuração
        if (!FB_APP_ID || !FB_APP_SECRET) {
            console.error('[OAuth] Missing FB_APP_ID or FB_APP_SECRET');
            return Response.redirect(
                `${FRONTEND_URL}/whatsapp/settings?error=${encodeURIComponent('Configuração OAuth incompleta')}`,
                302
            );
        }

        try {
            // 1. Trocar code por access_token
            console.log('[OAuth] Exchanging code for token...');
            const tokenResponse = await fetch(
                `https://graph.facebook.com/v18.0/oauth/access_token?` +
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
            console.log('[OAuth] Token received, expires in:', tokenData.expires_in);

            // 2. Obter token de longa duração (60 dias)
            console.log('[OAuth] Getting long-lived token...');
            const longLivedResponse = await fetch(
                `https://graph.facebook.com/v18.0/oauth/access_token?` +
                `grant_type=fb_exchange_token` +
                `&client_id=${FB_APP_ID}` +
                `&client_secret=${FB_APP_SECRET}` +
                `&fb_exchange_token=${tokenData.access_token}`
            );

            let accessToken = tokenData.access_token;
            if (longLivedResponse.ok) {
                const longLivedData = await longLivedResponse.json();
                accessToken = longLivedData.access_token;
                console.log('[OAuth] Long-lived token obtained');
            }

            // 3. Buscar WABAs e números de telefone
            console.log('[OAuth] Fetching WhatsApp Business Accounts...');
            const businessResponse = await fetch(
                `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,timezone_id,message_template_namespace}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!businessResponse.ok) {
                const errorData = await businessResponse.json();
                throw new Error(errorData.error?.message || 'Falha ao buscar negócios');
            }

            const businessData = await businessResponse.json();
            const wabas: Array<WhatsAppBusinessAccount & { phone_numbers: PhoneNumber[] }> = [];

            // Para cada negócio, buscar WABAs e números
            for (const business of businessData.data || []) {
                const ownedWabas = business.owned_whatsapp_business_accounts?.data || [];

                for (const waba of ownedWabas) {
                    console.log(`[OAuth] Fetching phone numbers for WABA: ${waba.id}`);

                    const phoneResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (phoneResponse.ok) {
                        const phoneData = await phoneResponse.json();
                        wabas.push({
                            ...waba,
                            phone_numbers: phoneData.data || []
                        });
                    }
                }
            }

            console.log('[OAuth] Found WABAs:', wabas.length);

            // 4. Salvar dados temporários no banco
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            );

            // Salvar token e WABAs em tabela temporária para o usuário selecionar
            const { data: oauthSession, error: sessionError } = await supabaseAdmin
                .from('whatsapp_oauth_sessions')
                .upsert({
                    user_id: state,
                    access_token: accessToken,
                    wabas: wabas,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
                .select('id')
                .single();

            if (sessionError) {
                console.error('[OAuth] Error saving session:', sessionError);
                throw new Error('Falha ao salvar sessão OAuth');
            }

            console.log('[OAuth] Session saved:', oauthSession.id);

            // 5. Redirecionar para página de seleção de número
            return Response.redirect(
                `${FRONTEND_URL}/whatsapp/settings?oauth=success&session=${oauthSession.id}`,
                302
            );

        } catch (error: any) {
            console.error('[OAuth] Error:', error.message);
            return Response.redirect(
                `${FRONTEND_URL}/whatsapp/settings?error=${encodeURIComponent(error.message)}`,
                302
            );
        }
    }

    // =========================================
    // POST: Selecionar número e finalizar setup
    // =========================================
    if (req.method === 'POST') {
        try {
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) {
                throw new Error('Não autorizado');
            }

            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
                global: { headers: { Authorization: authHeader } },
            });
            const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { session_id, waba_id, phone_number_id } = await req.json();

            // Buscar sessão OAuth
            const { data: session, error: sessionError } = await supabaseAdmin
                .from('whatsapp_oauth_sessions')
                .select('*')
                .eq('id', session_id)
                .eq('user_id', user.id)
                .single();

            if (sessionError || !session) {
                throw new Error('Sessão OAuth inválida ou expirada');
            }

            // Encontrar WABA e número selecionados
            const selectedWaba = (session.wabas as any[]).find(w => w.id === waba_id);
            if (!selectedWaba) throw new Error('WABA não encontrado');

            const selectedPhone = selectedWaba.phone_numbers.find((p: any) => p.id === phone_number_id);
            if (!selectedPhone) throw new Error('Número não encontrado');

            // Gerar verify token para webhook
            const webhookVerifyToken = crypto.randomUUID();

            // Salvar configuração do WhatsApp
            const { data: config, error: configError } = await supabaseAdmin
                .from('whatsapp_config')
                .upsert({
                    user_id: user.id,
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
                    oauth_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // ~60 dias
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (configError) throw configError;

            // Limpar sessão OAuth
            await supabaseAdmin
                .from('whatsapp_oauth_sessions')
                .delete()
                .eq('id', session_id);

            // Tentar configurar webhook automaticamente
            let webhookConfigured = false;
            try {
                const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

                const subscribeResponse = await fetch(
                    `https://graph.facebook.com/v18.0/${waba_id}/subscribed_apps`,
                    {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    }
                );

                if (subscribeResponse.ok) {
                    webhookConfigured = true;
                    console.log('[OAuth] Webhook subscription successful');
                }
            } catch (e) {
                console.warn('[OAuth] Could not auto-configure webhook:', e);
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    config: {
                        id: config.id,
                        phone_number: config.display_phone_number,
                        verified_name: config.verified_name
                    },
                    webhook_configured: webhookConfigured,
                    webhook_url: `${supabaseUrl}/functions/v1/whatsapp-webhook`,
                    webhook_verify_token: webhookVerifyToken
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (error: any) {
            console.error('[OAuth] POST error:', error.message);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
    }

    return new Response('Method not allowed', { status: 405 });
};

serve(handler);
