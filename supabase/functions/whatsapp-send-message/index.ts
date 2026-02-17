/**
 * Edge Function: whatsapp-send-message
 * Envia mensagens via WhatsApp Business API (Meta)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    const { message_id, phone_number, content, reply_to_wa_id, template_name, template_language, template_variables } = await req.json();

    if (!message_id) throw new Error('message_id is required');

    // Buscar a mensagem para identificar o dono (user_id)
    // Isso é importante para que secretárias possam enviar mensagens usando a config do médico
    const { data: dbMessage, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('user_id')
      .eq('id', message_id)
      .single();

    if (msgError || !dbMessage) {
      console.error('[send-message] Message not found:', message_id, msgError);
      throw new Error(`Message not found: ${message_id}`);
    }

    // HANDOVER: Se um humano está enviando mensagem, desligar o modo autônomo da conversa
    // Isso garante que a UI reflita que a IA parou e o usuário assumiu.
    const { error: handoverError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ ai_autonomous_mode: false } as any)
      .eq('id', dbMessage.conversation_id || '');

    if (handoverError) {
      console.warn('[send-message] Failed to update handover status', handoverError);
    }

    let configUserId = dbMessage.user_id;

    // 1. Tentar buscar config do próprio remetente
    let { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('phone_number_id, access_token')
      .eq('user_id', configUserId)
      .eq('is_active', true)
      .filter('access_token', 'not.is', null)
      .maybeSingle();

    // 2. Se não achou, e for secretária, busca de médicos vinculados
    if (!config) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', configUserId)
        .single();

      if (profile?.role === 'secretaria') {
        const { data: links } = await supabaseAdmin
          .from('secretary_doctor_links')
          .select('doctor_id')
          .eq('secretary_id', configUserId)
          .eq('is_active', true);

        if (links && links.length > 0) {
          const doctorIds = links.map((l: any) => l.doctor_id);
          const { data: doctorConfig } = await supabaseAdmin
            .from('whatsapp_config')
            .select('phone_number_id, access_token')
            .in('user_id', doctorIds)
            .eq('is_active', true)
            .filter('access_token', 'not.is', null)
            .limit(1)
            .maybeSingle();

          if (doctorConfig) {
            config = doctorConfig;
          }
        }
      }
    }

    // 3. Último recurso: buscar QUALQUER config ativa com token (útil para admins)
    if (!config) {
      const { data: genericConfig } = await supabaseAdmin
        .from('whatsapp_config')
        .select('phone_number_id, access_token')
        .eq('is_active', true)
        .filter('access_token', 'not.is', null)
        .limit(1)
        .maybeSingle();

      if (genericConfig) {
        config = genericConfig;
      }
    }

    if (!config || !config.access_token) {
      console.error('[send-message] No token found for user:', configUserId);
      throw new Error('Configuração do WhatsApp não encontrada. Por favor, configure o Token na tela de Configurações.');
    }

    const token = config.access_token;

    let payload: any;

    if (template_name) {
      // Template message
      payload = {
        messaging_product: 'whatsapp',
        to: phone_number,
        type: 'template',
        template: {
          name: template_name,
          language: { code: template_language || 'pt_BR' },
        },
      };

      // Add template variables if provided
      if (template_variables && Object.keys(template_variables).length > 0) {
        const sortedKeys = Object.keys(template_variables).sort();
        payload.template.components = [{
          type: 'body',
          parameters: sortedKeys.map((key) => ({
            type: 'text',
            text: template_variables[key],
          })),
        }];
      }
    } else {
      // Text message
      payload = {
        messaging_product: 'whatsapp',
        to: phone_number,
        type: 'text',
        text: { body: content },
      };

      if (reply_to_wa_id) {
        payload.context = { message_id: reply_to_wa_id };
      }
    }

    console.log(`[send-message] Sending to ${phone_number} using id ${config.phone_number_id}`);

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[send-message] Meta API error:', data.error);

      await supabaseAdmin
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          error_message: data.error?.message || 'Failed to send',
        })
        .eq('id', message_id);

      throw new Error(data.error?.message || 'Failed to send message via Meta API');
    }

    const waMessageId = data.messages[0].id;

    await supabaseAdmin
      .from('whatsapp_messages')
      .update({
        message_id: waMessageId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', message_id);

    return new Response(
      JSON.stringify({ success: true, whatsapp_message_id: waMessageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-message] Catch error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
