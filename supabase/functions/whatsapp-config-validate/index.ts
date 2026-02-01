/**
 * Edge Function: whatsapp-config-validate
 * Valida credenciais do WhatsApp Business API e salva configuração
 *
 * @endpoint POST /functions/v1/whatsapp-config-validate
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
};

interface ValidateConfigRequest {
  phone_number_id: string;
  access_token: string;
  business_account_id?: string;
  waba_id?: string;
}

interface WhatsAppBusinessProfile {
  verified_name: string;
  display_phone_number: string;
  id: string;
  quality_rating?: string;
}

interface MetaAPIResponse {
  data?: WhatsAppBusinessProfile[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com token do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente com service role para salvar no Vault
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do body
    const body: ValidateConfigRequest = await req.json();
    const { phone_number_id, access_token, business_account_id, waba_id } = body;

    if (!phone_number_id || !access_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone_number_id and access_token are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WhatsApp Config] Validating for user ${user.id}, phone_number_id: ${phone_number_id}`);

    // =========================================
    // 1. Validar credenciais com Meta Graph API
    // =========================================
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phone_number_id}?fields=verified_name,display_phone_number,id,quality_rating&access_token=${access_token}`;

    const metaResponse = await fetch(metaApiUrl);
    const metaData = await metaResponse.json();

    if (metaData.error) {
      console.error('[WhatsApp Config] Meta API Error:', metaData.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Credenciais inválidas ou erro na Meta API',
          details: metaData.error.message, // Detalhes técnicos
          code: metaData.error.code,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const businessProfile: WhatsAppBusinessProfile = metaData;
    console.log('[WhatsApp Config] Validated:', businessProfile.verified_name);

    // =========================================
    // 2. Gerar webhook verify token
    // =========================================
    const webhookVerifyToken = crypto.randomUUID();

    // =========================================
    // 3. Salvar access_token no Vault (seguro)
    // =========================================
    const secretName = `whatsapp_token_${user.id}`;

    // Tentar atualizar secret existente ou criar novo
    let vaultError = null;

    // Primeiro, tenta atualizar
    const { error: updateError } = await supabaseAdmin.rpc('update_secret', {
      secret_id: secretName,
      new_secret: access_token,
    });

    if (updateError) {
      // Se não existe, cria novo
      const { error: createError } = await supabaseAdmin.rpc('create_secret', {
        secret_id: secretName,
        secret: access_token,
      });
      vaultError = createError;
    }

    if (vaultError) {
      console.error('[WhatsApp Config] Vault error:', vaultError.message);
      console.warn('[WhatsApp Config] Failed to save token to Vault. Token will need to be re-entered.');
      // Continua mesmo assim - configuração será salva sem token no Vault
    } else {
      console.log('[WhatsApp Config] Access token saved to Vault successfully');
    }

    // =========================================
    // 4. Salvar/Atualizar configuração
    // =========================================
    const configData = {
      user_id: user.id,
      phone_number_id: phone_number_id,
      business_account_id: business_account_id || null,
      waba_id: waba_id || null,
      display_phone_number: businessProfile.display_phone_number,
      verified_name: businessProfile.verified_name,
      webhook_verify_token: webhookVerifyToken,
      access_token: access_token, // Salvar token diretamente na tabela
      is_active: true,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .upsert(configData, { onConflict: 'user_id' })
      .select()
      .single();

    if (configError) {
      console.error('[WhatsApp Config] Failed to save config:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao salvar configuração', details: configError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================
    // 5. Configurar webhook automaticamente na Meta API (Fallback Logic)
    // =========================================
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    let webhookConfigured = false;
    let webhookError: string | null = null;

    try {
      const targetsToTry: { id: string; type: string }[] = [];
      if (waba_id) targetsToTry.push({ id: waba_id, type: 'WABA ID' });
      if (business_account_id && business_account_id !== waba_id) targetsToTry.push({ id: business_account_id, type: 'Business Account ID' });

      // Se nenhum ID extra foi passado, tenta usar o phone_number_id (não ideal para subscribe, mas...)
      // Na verdade, a assinatura é no WABA ou BM. O phone_number_id não aceita subscribed_apps na v18 geralmente, mas vale checar doc se necessário.
      // Mas vamos focar nos que temos.

      if (targetsToTry.length === 0) {
        webhookError = "Nenhum WABA ID ou Business Account ID fornecido para configuração automática.";
      }

      for (const target of targetsToTry) {
        console.log(`[WhatsApp Config] Attempting webhook subscription for ${target.type}: ${target.id}`);

        try {
          const webhookConfigUrl = `https://graph.facebook.com/v18.0/${target.id}/subscribed_apps`;

          const webhookConfigResponse = await fetch(webhookConfigUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: access_token,
              override_callback_uri: webhookUrl,
              verify_token: webhookVerifyToken,
              subscribed_fields: ['messages', 'message_status'],
            }),
          });

          const webhookConfigData = await webhookConfigResponse.json();

          if (webhookConfigData.success) {
            webhookConfigured = true;
            console.log(`[WhatsApp Config] Webhook configured successfully on ${target.type}`);
            break; // Sucesso! Parar tentativas.
          } else {
            console.warn(`[WhatsApp Config] Failed on ${target.type}:`, webhookConfigData.error?.message);
            // Guarda o último erro, mas continua tentando
            webhookError = webhookConfigData.error?.message;
          }
        } catch (innerErr) {
          console.warn(`[WhatsApp Config] Network error on ${target.type}:`, innerErr);
          webhookError = innerErr instanceof Error ? innerErr.message : 'Unknown network error';
        }
      }

    } catch (error) {
      webhookError = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[WhatsApp Config] Webhook auto-config crash:', error);
    }

    // =========================================
    // 6. Retornar sucesso com dados
    // =========================================
    const nextSteps = webhookConfigured
      ? [
        '✓ Webhook configurado automaticamente!',
        '✓ Sistema pronto para receber mensagens',
        'Envie uma mensagem de teste para o seu WhatsApp Business',
      ]
      : [
        `⚠ Configure o webhook manualmente no Meta Business`,
        `Webhook URL: ${webhookUrl}`,
        `Verify Token: ${webhookVerifyToken}`,
        `Reason: ${webhookError || 'Automatic configuration not available'}`,
      ];

    return new Response(
      JSON.stringify({
        success: true,
        config: {
          id: config.id,
          phone_number_id: config.phone_number_id,
          display_phone_number: config.display_phone_number,
          verified_name: config.verified_name,
          is_active: config.is_active,
          webhook_verify_token: webhookVerifyToken,
        },
        webhook_url: webhookUrl,
        webhook_configured: webhookConfigured,
        quality_rating: businessProfile.quality_rating || 'unknown',
        message: webhookConfigured
          ? 'Configuração completa! Webhook configurado automaticamente.'
          : 'Configuração salva! Configure o webhook manualmente.',
        next_steps: nextSteps,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WhatsApp Config] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno no servidor', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
