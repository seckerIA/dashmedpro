/**
 * Edge Function: evolution-webhook
 * Recebe mensagens e eventos da Evolution API (Baileys)
 * Normaliza para o mesmo modelo de dados do whatsapp-webhook (Meta)
 *
 * @endpoint POST /functions/v1/evolution-webhook - Receber eventos
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =========================================
// Handler principal
// =========================================

const handler = async (req: Request): Promise<Response> => {
  console.log('--- [EVO-WEBHOOK RECEBIDO] ---');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const payload = await req.json();
    const event = payload.event || payload.type || '';
    const instanceName = payload.instance || payload.instanceName || '';

    console.log('[EvoWebhook] Event:', event, 'Instance:', instanceName);

    if (!instanceName) {
      console.warn('[EvoWebhook] No instance name in payload');
      return new Response('OK', { status: 200 });
    }

    // Find config by instance name
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('id, user_id, evolution_api_url, evolution_instance_token')
      .eq('evolution_instance_name', instanceName)
      .eq('provider', 'evolution')
      .single();

    if (!config) {
      console.error('[EvoWebhook] No config found for instance:', instanceName);
      return new Response('OK', { status: 200 });
    }

    const userId = config.user_id;

    // ---- MESSAGES_UPSERT ----
    if (event === 'messages.upsert') {
      const data = payload.data;
      if (!data || !data.key) {
        console.warn('[EvoWebhook] messages.upsert missing data.key');
        return new Response('OK', { status: 200 });
      }

      const isFromMe = !!data.key.fromMe;

      // Extract phone number (strip @s.whatsapp.net)
      const remoteJid = data.key.remoteJid || '';
      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      const contactName = data.pushName || null;
      const messageId = data.key.id;

      // Skip group messages
      if (remoteJid.endsWith('@g.us')) {
        console.log('[EvoWebhook] Skipping group message');
        return new Response('OK', { status: 200 });
      }

      // Skip old historical messages (older than 5 minutes = likely from initial sync)
      if (data.messageTimestamp) {
        const msgTs = typeof data.messageTimestamp === 'number'
          ? data.messageTimestamp * 1000
          : parseInt(data.messageTimestamp) * 1000;
        const ageMs = Date.now() - msgTs;
        const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
        if (ageMs > MAX_AGE_MS) {
          console.log('[EvoWebhook] Skipping old message (age:', Math.round(ageMs / 1000), 's)');
          return new Response('OK', { status: 200 });
        }
      }

      // Extract content
      const { content, messageType } = extractEvoContent(data);
      if (!content) {
        console.log('[EvoWebhook] Empty content, skipping');
        return new Response('OK', { status: 200 });
      }

      // Dedup: check if message already exists
      const { data: existingMsg } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('id')
        .eq('message_id', messageId)
        .single();

      if (existingMsg) {
        console.log('[EvoWebhook] Duplicate message, skipping:', messageId);
        return new Response('OK', { status: 200 });
      }

      // Get or create conversation
      const conversationId = await getOrCreateConversation(
        supabaseAdmin,
        userId,
        phoneNumber,
        contactName,
        instanceName
      );

      // Timestamp
      const timestamp = data.messageTimestamp
        ? new Date(
            typeof data.messageTimestamp === 'number'
              ? data.messageTimestamp * 1000
              : parseInt(data.messageTimestamp) * 1000
          ).toISOString()
        : new Date().toISOString();

      // Insert message
      const { data: savedMessage, error: msgError } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_id: messageId,
          phone_number: phoneNumber,
          direction: isFromMe ? 'outbound' : 'inbound',
          content: content,
          message_type: messageType,
          status: 'delivered',
          sent_at: timestamp,
          provider: 'evolution',
          metadata: {
            original_type: data.messageType || 'unknown',
            instance: instanceName,
            evo_id: messageId,
          },
        })
        .select('id')
        .single();

      if (msgError) {
        console.error('[EvoWebhook] Error saving message:', msgError);
        return new Response('OK', { status: 200 });
      }

      // Update conversation
      const convUpdate: Record<string, any> = {
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        last_message_direction: isFromMe ? 'outbound' : 'inbound',
        updated_at: new Date().toISOString(),
      };
      if (contactName) convUpdate.contact_name = contactName;

      await supabaseAdmin
        .from('whatsapp_conversations')
        .update(convUpdate)
        .eq('id', conversationId);

      // Increment unread count only for inbound messages
      if (!isFromMe) {
        const { data: convData } = await supabaseAdmin
          .from('whatsapp_conversations')
          .select('unread_count')
          .eq('id', conversationId)
          .single();

        await supabaseAdmin
          .from('whatsapp_conversations')
          .update({ unread_count: (convData?.unread_count || 0) + 1 })
          .eq('id', conversationId);
      }

      console.log('[EvoWebhook] Message saved:', savedMessage.id, isFromMe ? '(outbound)' : '(inbound)');

      // ---- Trigger AI Agent only for inbound messages ----
      if (isFromMe) {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      const aiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-ai-agent`;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

      console.log('[EvoWebhook] Triggering AI Agent...');

      const agentBody = JSON.stringify({
        conversation_id: conversationId,
        message_content: content,
        phone_number: phoneNumber,
        user_id: userId,
      });

      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(
          fetch(aiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: agentBody,
          })
            .then((res) => console.log(`[EvoWebhook] AI Agent Status: ${res.status}`))
            .catch((err) => console.error('[EvoWebhook] AI Agent Error:', err))
        );
      } else {
        fetch(aiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: agentBody,
        }).catch((err) => console.error('[EvoWebhook] AI Agent fire-and-forget error:', err));
      }
    }

    // ---- CONNECTION_UPDATE ----
    if (event === 'connection.update') {
      const state = payload.data?.state || payload.data?.instance?.state || 'close';
      console.log('[EvoWebhook] Connection update:', instanceName, '->', state);

      const updateData: Record<string, any> = {
        evolution_instance_status: state,
        is_active: state === 'open',
      };

      // Extract phone number from wuid if available
      const wuid = payload.data?.instance?.wuid || payload.data?.wuid;
      if (wuid) {
        updateData.display_phone_number = wuid.replace('@s.whatsapp.net', '');
      }

      await supabaseAdmin
        .from('whatsapp_config')
        .update(updateData)
        .eq('evolution_instance_name', instanceName)
        .eq('provider', 'evolution');
    }

    // ---- QRCODE_UPDATED ----
    if (event === 'qrcode.updated') {
      console.log('[EvoWebhook] QR code updated for:', instanceName);
      // Frontend polls via evolution-instance action=connect, no DB storage needed
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('[EvoWebhook] Error:', error);
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
};

// =========================================
// Extract content from Evolution message
// =========================================
function extractEvoContent(data: any): { content: string; messageType: string } {
  const msg = data.message;
  if (!msg) return { content: '', messageType: 'text' };

  // Plain text
  if (msg.conversation) {
    return { content: msg.conversation, messageType: 'text' };
  }

  // Extended text (with formatting/links)
  if (msg.extendedTextMessage?.text) {
    return { content: msg.extendedTextMessage.text, messageType: 'text' };
  }

  // Image
  if (msg.imageMessage) {
    return { content: msg.imageMessage.caption || '[Imagem]', messageType: 'image' };
  }

  // Audio
  if (msg.audioMessage) {
    return { content: '[Áudio]', messageType: 'audio' };
  }

  // Video
  if (msg.videoMessage) {
    return { content: msg.videoMessage.caption || '[Vídeo]', messageType: 'video' };
  }

  // Document
  if (msg.documentMessage) {
    return { content: msg.documentMessage.fileName || '[Documento]', messageType: 'document' };
  }

  // Sticker
  if (msg.stickerMessage) {
    return { content: '[Sticker]', messageType: 'sticker' };
  }

  // Location
  if (msg.locationMessage) {
    const loc = msg.locationMessage;
    return {
      content: loc.name || loc.address || `[Localização: ${loc.degreesLatitude}, ${loc.degreesLongitude}]`,
      messageType: 'location',
    };
  }

  // Contact
  if (msg.contactMessage) {
    return { content: msg.contactMessage.displayName || '[Contato]', messageType: 'contact' };
  }

  // Fallback
  const msgType = data.messageType || 'unknown';
  return { content: `[${msgType}]`, messageType: msgType };
}

// =========================================
// Get or create conversation (Evolution)
// =========================================
async function getOrCreateConversation(
  supabase: any,
  userId: string,
  phoneNumber: string,
  contactName: string | null,
  instanceName: string
): Promise<string> {
  // Find existing conversation by user + phone (Evolution doesn't use phone_number_id)
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('phone_number', phoneNumber)
    .eq('provider', 'evolution')
    .single();

  if (existing) {
    return existing.id;
  }

  // Try CRM contact match
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('id, full_name')
    .or(`phone.eq.${phoneNumber},phone.eq.+${phoneNumber}`)
    .limit(1)
    .maybeSingle();

  const contactId = contact?.id || null;
  const finalContactName = contactName || contact?.full_name || phoneNumber;

  // Get organization
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  const organizationId = userProfile?.organization_id || null;

  // Create conversation
  const { data: newConversation, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      phone_number: phoneNumber,
      contact_id: contactId,
      contact_name: finalContactName,
      status: 'open',
      priority: 'normal',
      unread_count: 0,
      provider: 'evolution',
      ai_autonomous_mode: null, // Inherit from global config
    })
    .select('id')
    .single();

  if (error) {
    console.error('[EvoWebhook] Error creating conversation:', error);
    throw error;
  }

  console.log('[EvoWebhook] Created conversation:', newConversation.id, 'for', phoneNumber, 'via', instanceName);
  return newConversation.id;
}

serve(handler);
