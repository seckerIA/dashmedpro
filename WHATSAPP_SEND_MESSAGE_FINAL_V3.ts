/**
 * Edge Function: whatsapp-send-message
 * Envia mensagens via WhatsApp Business API (Meta)
 *
 * VERSÃO FINAL - Busca token da tabela whatsapp_config
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { message_id, phone_number, content, reply_to_wa_id } = await req.json();

    // Buscar config E access_token junto
    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('phone_number_id, access_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('WhatsApp not configured');
    }

    if (!config.access_token) {
      throw new Error('Access token not found. Please reconfigure WhatsApp.');
    }

    // Preparar payload
    const payload: any = {
      messaging_product: 'whatsapp',
      to: phone_number,
      type: 'text',
      text: { body: content },
    };

    if (reply_to_wa_id) {
      payload.context = { message_id: reply_to_wa_id };
    }

    // Enviar via Meta API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
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

    // Atualizar mensagem no banco
    if (message_id) {
      await supabaseAdmin
        .from('whatsapp_messages')
        .update({
          message_id: waMessageId,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', message_id);
    }

    return new Response(
      JSON.stringify({ success: true, whatsapp_message_id: waMessageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[whatsapp-send-message] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
