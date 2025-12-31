/**
 * Edge Function: whatsapp-webhook
 * Recebe mensagens e status updates da API oficial do WhatsApp Business (Meta)
 *
 * @endpoint GET /functions/v1/whatsapp-webhook - Verificação do webhook
 * @endpoint POST /functions/v1/whatsapp-webhook - Receber eventos
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =========================================
// Types - Formato oficial da API Meta
// =========================================

interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: WebhookValue;
      field: 'messages';
    }>;
  }>;
}

interface WebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: IncomingMessage[];
  statuses?: StatusUpdate[];
}

interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: MediaContent;
  audio?: MediaContent;
  video?: MediaContent;
  document?: MediaContent & { filename?: string };
  sticker?: MediaContent;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: { formatted_name: string };
    phones?: Array<{ phone: string; type: string }>;
  }>;
  context?: {
    from: string;
    id: string;
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
}

interface MediaContent {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
}

interface StatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
  }>;
}

// =========================================
// Handler principal
// =========================================

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // =========================================
  // GET - Verificação do webhook (challenge)
  // =========================================
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('[Webhook] Verification request:', { mode, token: token?.substring(0, 10) + '...' });

    if (mode === 'subscribe' && token && challenge) {
      // Buscar config com o verify_token correspondente
      const { data: config } = await supabaseAdmin
        .from('whatsapp_config')
        .select('id, user_id, webhook_verify_token')
        .eq('webhook_verify_token', token)
        .eq('is_active', true)
        .single();

      if (config) {
        console.log('[Webhook] Verification successful for user:', config.user_id);
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      } else {
        console.error('[Webhook] Invalid verify token');
        return new Response('Invalid verify token', { status: 403 });
      }
    }

    return new Response('Missing parameters', { status: 400 });
  }

  // =========================================
  // POST - Receber eventos
  // =========================================
  if (req.method === 'POST') {
    try {
      const payload: MetaWebhookPayload = await req.json();

      // Validar formato
      if (payload.object !== 'whatsapp_business_account') {
        console.log('[Webhook] Ignoring non-WhatsApp event');
        return new Response('OK', { status: 200 });
      }

      // Processar cada entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          const phoneNumberId = value.metadata.phone_number_id;

          // Buscar config pelo phone_number_id
          const { data: config } = await supabaseAdmin
            .from('whatsapp_config')
            .select('id, user_id')
            .eq('phone_number_id', phoneNumberId)
            .eq('is_active', true)
            .single();

          if (!config) {
            console.error('[Webhook] No config found for phone_number_id:', phoneNumberId);
            continue;
          }

          const userId = config.user_id;

          // Processar mensagens recebidas
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await processIncomingMessage(supabaseAdmin, userId, message, value.contacts);
            }
          }

          // Processar status updates
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await processStatusUpdate(supabaseAdmin, status);
            }
          }
        }
      }

      // Sempre retornar 200 para o Meta (evitar retentativas)
      return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error: any) {
      console.error('[Webhook] Error processing payload:', error);
      // Retornar 200 mesmo em erro para evitar retentativas infinitas
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

// =========================================
// Processar mensagem recebida
// =========================================
async function processIncomingMessage(
  supabase: any,
  userId: string,
  message: IncomingMessage,
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
) {
  const phoneNumber = message.from;
  const contactName = contacts?.find(c => c.wa_id === phoneNumber)?.profile.name || null;

  console.log('[Webhook] Processing message from:', phoneNumber, 'type:', message.type);

  // Buscar ou criar conversa
  const conversationId = await getOrCreateConversation(
    supabase,
    userId,
    phoneNumber,
    contactName
  );

  // Extrair conteúdo baseado no tipo
  const { content, messageType } = extractMessageContent(message);

  // Inserir mensagem
  const { data: savedMessage, error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      message_id: message.id,
      phone_number: phoneNumber,
      direction: 'inbound',
      content: content,
      message_type: messageType,
      status: 'delivered',
      sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      context: message.context || null,
      metadata: {
        original_type: message.type,
        wa_id: message.id,
      },
    })
    .select('id')
    .single();

  if (msgError) {
    console.error('[Webhook] Error saving message:', msgError);
    return;
  }

  // Se tiver mídia, salvar separadamente
  if (['image', 'audio', 'video', 'document', 'sticker'].includes(message.type)) {
    const mediaData = message[message.type as keyof IncomingMessage] as MediaContent;
    if (mediaData?.id) {
      await supabase.from('whatsapp_media').insert({
        message_id: savedMessage.id,
        media_type: message.type,
        media_url: '', // Será preenchido após download
        media_mime_type: mediaData.mime_type,
        file_name: (mediaData as any).filename || null,
        whatsapp_media_id: mediaData.id,
      });
    }
  }

  // Atualizar conversa com última mensagem
  await supabase
    .from('whatsapp_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      last_message_direction: 'inbound',
      unread_count: supabase.rpc('increment_unread', { conv_id: conversationId }),
      contact_name: contactName || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  // Incrementar unread_count manualmente (fallback se rpc não existir)
  await supabase.rpc('increment_conversation_unread', { p_conversation_id: conversationId }).catch(() => {
    // Fallback: update direto
    supabase
      .from('whatsapp_conversations')
      .select('unread_count')
      .eq('id', conversationId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          supabase
            .from('whatsapp_conversations')
            .update({ unread_count: (data.unread_count || 0) + 1 })
            .eq('id', conversationId);
        }
      });
  });

  console.log('[Webhook] Message saved:', savedMessage.id);
}

// =========================================
// Processar status update
// =========================================
async function processStatusUpdate(supabase: any, status: StatusUpdate) {
  console.log('[Webhook] Processing status update:', status.id, '->', status.status);

  const updateData: Record<string, any> = {
    status: status.status,
  };

  if (status.status === 'delivered') {
    updateData.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
  } else if (status.status === 'read') {
    updateData.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
  } else if (status.status === 'failed' && status.errors?.length) {
    updateData.error_code = String(status.errors[0].code);
    updateData.error_message = status.errors[0].message || status.errors[0].title;
  }

  const { error } = await supabase
    .from('whatsapp_messages')
    .update(updateData)
    .eq('message_id', status.id);

  if (error) {
    console.error('[Webhook] Error updating status:', error);
  }
}

// =========================================
// Buscar ou criar conversa
// =========================================
async function getOrCreateConversation(
  supabase: any,
  userId: string,
  phoneNumber: string,
  contactName: string | null
): Promise<string> {
  // Buscar conversa existente
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('phone_number', phoneNumber)
    .single();

  if (existing) {
    return existing.id;
  }

  // Buscar contato CRM pelo telefone
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('id, name')
    .or(`phone.eq.${phoneNumber},phone.eq.+${phoneNumber}`)
    .limit(1)
    .single();

  // Criar nova conversa
  const { data: newConversation, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      user_id: userId,
      phone_number: phoneNumber,
      contact_id: contact?.id || null,
      contact_name: contactName || contact?.name || phoneNumber,
      status: 'open',
      priority: 'normal',
      unread_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Webhook] Error creating conversation:', error);
    throw error;
  }

  console.log('[Webhook] Created new conversation:', newConversation.id);
  return newConversation.id;
}

// =========================================
// Extrair conteúdo da mensagem
// =========================================
function extractMessageContent(message: IncomingMessage): { content: string; messageType: string } {
  switch (message.type) {
    case 'text':
      return { content: message.text?.body || '', messageType: 'text' };

    case 'image':
      return { content: message.image?.caption || '[Imagem]', messageType: 'image' };

    case 'audio':
      return { content: '[Áudio]', messageType: 'audio' };

    case 'video':
      return { content: message.video?.caption || '[Vídeo]', messageType: 'video' };

    case 'document':
      return {
        content: message.document?.filename || '[Documento]',
        messageType: 'document',
      };

    case 'sticker':
      return { content: '[Sticker]', messageType: 'sticker' };

    case 'location':
      const loc = message.location;
      return {
        content: loc?.name || loc?.address || `[Localização: ${loc?.latitude}, ${loc?.longitude}]`,
        messageType: 'location',
      };

    case 'contacts':
      const contact = message.contacts?.[0];
      return {
        content: contact?.name.formatted_name || '[Contato]',
        messageType: 'contact',
      };

    case 'reaction':
      return {
        content: message.reaction?.emoji || '',
        messageType: 'reaction',
      };

    default:
      return { content: `[${message.type}]`, messageType: message.type };
  }
}

serve(handler);
