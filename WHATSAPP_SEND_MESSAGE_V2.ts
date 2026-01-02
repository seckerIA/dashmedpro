/**
 * Edge Function: whatsapp-send-message v2
 * Envia mensagens via WhatsApp Business API (Meta)
 * Com logs detalhados para debug
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[1] Starting whatsapp-send-message function');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[ERROR] No authorization header');
      throw new Error('No authorization');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    console.log('[2] Getting authenticated user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[ERROR] User auth error:', userError);
      throw new Error(`Auth error: ${userError.message}`);
    }

    if (!user) {
      console.error('[ERROR] No user found');
      throw new Error('Not authenticated');
    }

    console.log('[3] User authenticated:', user.id);

    const body = await req.json();
    console.log('[4] Request body:', JSON.stringify(body));

    const { message_id, phone_number, content, reply_to_wa_id } = body;

    console.log('[5] Fetching WhatsApp config for user:', user.id);
    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('phone_number_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('[ERROR] Config query error:', configError);
      throw new Error(`Config error: ${configError.message}`);
    }

    if (!config) {
      console.error('[ERROR] No config found for user:', user.id);
      throw new Error('WhatsApp not configured');
    }

    console.log('[6] Config found, phone_number_id:', config.phone_number_id);

    // Buscar token do Vault
    console.log('[7] Reading access token from Vault');
    const secretName = `whatsapp_token_${user.id}`;

    const { data: secretData, error: vaultError } = await supabaseAdmin.rpc('read_secret', {
      secret_id: secretName,
    });

    if (vaultError) {
      console.error('[ERROR] Vault error:', vaultError);
      throw new Error(`Vault error: ${vaultError.message}`);
    }

    if (!secretData) {
      console.error('[ERROR] No token in Vault for:', secretName);
      throw new Error('Access token not found in Vault');
    }

    const token = secretData;
    console.log('[8] Token retrieved, length:', token?.length || 0);

    // Preparar payload para Meta API
    const payload: any = {
      messaging_product: 'whatsapp',
      to: phone_number,
      type: 'text',
      text: { body: content },
    };

    if (reply_to_wa_id) {
      payload.context = { message_id: reply_to_wa_id };
    }

    console.log('[9] Sending to Meta API, phone:', phone_number);
    const metaUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[10] Meta API response:', JSON.stringify(data));

    if (!response.ok || data.error) {
      console.error('[ERROR] Meta API error:', data.error);

      // Atualizar mensagem como failed
      if (message_id) {
        await supabaseAdmin
          .from('whatsapp_messages')
          .update({
            status: 'failed',
            error_message: data.error?.message || 'Failed to send',
            error_code: String(data.error?.code || 'unknown'),
          })
          .eq('id', message_id);
      }

      throw new Error(data.error?.message || 'Failed to send message');
    }

    const waMessageId = data.messages[0].id;
    console.log('[11] Message sent successfully, WA ID:', waMessageId);

    // Atualizar mensagem no banco
    if (message_id) {
      console.log('[12] Updating message in database');
      await supabaseAdmin
        .from('whatsapp_messages')
        .update({
          message_id: waMessageId,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', message_id);
    }

    console.log('[13] Success!');
    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_message_id: waMessageId,
        message: 'Message sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[FATAL ERROR]', error);
    console.error('[FATAL ERROR] Stack:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
