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
      const { content, messageType, mediaInfo } = extractEvoContent(data);
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

      let finalContent = content;

      // ---- Save media if present ----
      if (mediaInfo.hasMedia && savedMessage?.id) {
        let mediaUrl = '';
        let base64 = null;
        try {
          base64 = await downloadEvoMedia(config as any, instanceName, data);
          if (base64) {
            const uploaded = await uploadMediaToStorage(
              supabaseAdmin,
              base64,
              mediaInfo.mimeType || 'application/octet-stream',
              savedMessage.id,
            );
            if (uploaded) mediaUrl = uploaded;
          }
        } catch (e) {
          console.error('[EvoWebhook] Media processing failed:', e);
        }

        await supabaseAdmin.from('whatsapp_media').insert({
          message_id: savedMessage.id,
          media_type: messageType,
          media_url: mediaUrl,
          media_mime_type: mediaInfo.mimeType,
          file_name: mediaInfo.fileName,
          duration_seconds: mediaInfo.duration,
        });

        console.log('[EvoWebhook] Media saved for message:', savedMessage.id, 'type:', messageType, 'url:', mediaUrl ? 'yes' : 'no');

        // ---- Audio Transcription ----
        if (messageType === 'audio' && base64) {
          const openAiKey = Deno.env.get('OPENAI_API_KEY');
          if (openAiKey) {
            const transcription = await transcribeAudio(base64, mediaInfo.mimeType || 'audio/ogg', openAiKey);
            if (transcription) {
               finalContent = `[Áudio Transcrito]: ${transcription}`;
               await supabaseAdmin.from('whatsapp_messages').update({ content: finalContent }).eq('id', savedMessage.id);
               console.log('[EvoWebhook] Audio transcribed successfully:', transcription);
            }
          }
        }
      }

      // ---- Trigger AI Agent only for inbound messages ----
      if (isFromMe) {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      const aiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-ai-agent`;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

      console.log('[EvoWebhook] Triggering AI Agent...');

      const agentBody = JSON.stringify({
        conversation_id: conversationId,
        message_content: finalContent,
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
interface EvoMediaInfo {
  hasMedia: boolean;
  mimeType: string | null;
  fileName: string | null;
  duration: number | null;
}

function extractEvoContent(data: any): { content: string; messageType: string; mediaInfo: EvoMediaInfo } {
  const msg = data.message;
  const noMedia: EvoMediaInfo = { hasMedia: false, mimeType: null, fileName: null, duration: null };
  if (!msg) return { content: '', messageType: 'text', mediaInfo: noMedia };

  // Plain text
  if (msg.conversation) {
    return { content: msg.conversation, messageType: 'text', mediaInfo: noMedia };
  }

  // Extended text (with formatting/links)
  if (msg.extendedTextMessage?.text) {
    return { content: msg.extendedTextMessage.text, messageType: 'text', mediaInfo: noMedia };
  }

  // Image
  if (msg.imageMessage) {
    return {
      content: msg.imageMessage.caption || '[Imagem]',
      messageType: 'image',
      mediaInfo: { hasMedia: true, mimeType: msg.imageMessage.mimetype || 'image/jpeg', fileName: null, duration: null },
    };
  }

  // Audio
  if (msg.audioMessage) {
    return {
      content: '[Áudio]',
      messageType: 'audio',
      mediaInfo: { hasMedia: true, mimeType: msg.audioMessage.mimetype || 'audio/ogg', fileName: null, duration: msg.audioMessage.seconds || null },
    };
  }

  // Video
  if (msg.videoMessage) {
    return {
      content: msg.videoMessage.caption || '[Vídeo]',
      messageType: 'video',
      mediaInfo: { hasMedia: true, mimeType: msg.videoMessage.mimetype || 'video/mp4', fileName: null, duration: msg.videoMessage.seconds || null },
    };
  }

  // Document
  if (msg.documentMessage) {
    return {
      content: msg.documentMessage.fileName || '[Documento]',
      messageType: 'document',
      mediaInfo: { hasMedia: true, mimeType: msg.documentMessage.mimetype || 'application/octet-stream', fileName: msg.documentMessage.fileName || null, duration: null },
    };
  }

  // Sticker
  if (msg.stickerMessage) {
    return { content: '[Sticker]', messageType: 'sticker', mediaInfo: { hasMedia: true, mimeType: msg.stickerMessage.mimetype || 'image/webp', fileName: null, duration: null } };
  }

  // Location
  if (msg.locationMessage) {
    const loc = msg.locationMessage;
    return {
      content: loc.name || loc.address || `[Localização: ${loc.degreesLatitude}, ${loc.degreesLongitude}]`,
      messageType: 'location',
      mediaInfo: noMedia,
    };
  }

  // Contact
  if (msg.contactMessage) {
    return { content: msg.contactMessage.displayName || '[Contato]', messageType: 'contact', mediaInfo: noMedia };
  }

  // Fallback
  const msgType = data.messageType || 'unknown';
  return { content: `[${msgType}]`, messageType: msgType, mediaInfo: noMedia };
}

// =========================================
// Download media from Evolution API
// =========================================
async function downloadEvoMedia(
  config: { evolution_api_url: string; evolution_instance_token: string },
  instanceName: string,
  messageData: any,
): Promise<string | null> {
  try {
    const evoUrl = config.evolution_api_url.replace(/\/+$/, '');
    const evoKey = config.evolution_instance_token || Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '';
    const res = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageData, convertToMp4: false }),
    });
    if (!res.ok) {
      console.error('[EvoWebhook] Media download failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    // Evolution returns { base64: "data:mime;base64,..." } or { base64: "base64string" }
    return data.base64 || null;
  } catch (e) {
    console.error('[EvoWebhook] Media download error:', e);
    return null;
  }
}

// =========================================
// Upload base64 media to Supabase Storage
// =========================================
async function uploadMediaToStorage(
  supabase: any,
  base64Data: string,
  mimeType: string,
  messageId: string,
): Promise<string | null> {
  try {
    // Strip data URI prefix if present
    const raw = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Convert base64 to Uint8Array
    const binaryStr = atob(raw);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Determine extension from mime
    const extMap: Record<string, string> = {
      'audio/ogg': 'ogg', 'audio/ogg; codecs=opus': 'ogg', 'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3', 'audio/webm': 'webm', 'audio/amr': 'amr',
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'video/mp4': 'mp4', 'video/3gpp': '3gp',
      'application/pdf': 'pdf',
    };
    const ext = extMap[mimeType.toLowerCase()] || 'bin';
    const filePath = `evo_${messageId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(filePath, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error('[EvoWebhook] Storage upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage.from('whatsapp-media').getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error('[EvoWebhook] Upload error:', e);
    return null;
  }
}

// =========================================
// Transcribe Audio using Whisper API
// =========================================
async function transcribeAudio(base64Data: string, mimeType: string, openAiKey: string): Promise<string | null> {
  try {
    const raw = base64Data.replace(/^data:[^;]+;base64,/, '');
    const binaryStr = atob(raw);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const extMap: Record<string, string> = { 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/webm': 'webm' };
    const ext = extMap[mimeType.toLowerCase()] || 'ogg';
    const blob = new Blob([bytes], { type: mimeType || 'audio/ogg' });
    
    const formData = new FormData();
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAiKey}` },
      body: formData
    });

    if (!response.ok) {
      console.error('[Whisper] API Error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.text || null;
  } catch (e) {
    console.error('[Whisper] Exception:', e);
    return null;
  }
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
