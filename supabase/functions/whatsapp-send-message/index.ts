/**
 * Edge Function: whatsapp-send-message
 * Envia mensagens via WhatsApp Business API (Meta)
 *
 * @endpoint POST /functions/v1/whatsapp-send-message
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =========================================
// Types
// =========================================

interface SendMessageRequest {
  conversation_id: string;
  to: string; // Phone number
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template' | 'reaction';
  content?: string; // For text messages
  media_url?: string; // For media messages
  media_id?: string; // WhatsApp media ID
  caption?: string; // Caption for media
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
  reply_to_message_id?: string;
}

interface MetaMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: string;
  context?: { message_id: string };
  text?: { body: string; preview_url?: boolean };
  image?: { link?: string; id?: string; caption?: string };
  audio?: { link?: string; id?: string };
  video?: { link?: string; id?: string; caption?: string };
  document?: { link?: string; id?: string; caption?: string; filename?: string };
  template?: { name: string; language: { code: string }; components?: any[] };
  reaction?: { message_id: string; emoji: string };
}

// =========================================
// Handler
// =========================================

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create client with user's token for RLS
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: SendMessageRequest = await req.json();
    console.log('[SendMessage] Request:', { ...body, content: body.content?.substring(0, 50) });

    // Validate required fields
    if (!body.conversation_id || !body.to || !body.type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get WhatsApp config for user
    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('id, phone_number_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token from Vault
    let accessToken: string | null = null;

    try {
      const { data: vaultData } = await supabaseAdmin
        .rpc('vault_read_secret', { secret_name: `whatsapp_token_${user.id}` });
      accessToken = vaultData;
    } catch (e) {
      // Fallback: check if stored in config (less secure, for compatibility)
      const { data: fallbackConfig } = await supabaseAdmin
        .from('whatsapp_config')
        .select('access_token_encrypted')
        .eq('id', config.id)
        .single();

      if (fallbackConfig?.access_token_encrypted) {
        // Decrypt using Supabase's pgsodium if available
        accessToken = fallbackConfig.access_token_encrypted;
      }
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Meta API payload
    const payload = buildMetaPayload(body);
    console.log('[SendMessage] Meta payload:', JSON.stringify(payload, null, 2));

    // Send to Meta API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const metaResult = await metaResponse.json();
    console.log('[SendMessage] Meta response:', metaResult);

    if (!metaResponse.ok) {
      console.error('[SendMessage] Meta API error:', metaResult);
      return new Response(JSON.stringify({
        error: 'Failed to send message',
        details: metaResult.error?.message || 'Unknown error',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageId = metaResult.messages?.[0]?.id;

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        user_id: user.id,
        conversation_id: body.conversation_id,
        message_id: messageId,
        phone_number: body.to,
        direction: 'outbound',
        content: body.type === 'text' ? body.content : getContentPreview(body),
        message_type: body.type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        reply_to_message_id: body.reply_to_message_id || null,
        template_id: body.template ? null : null, // Could link to template if needed
        metadata: {
          wa_message_id: messageId,
          type: body.type,
        },
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[SendMessage] Error saving message:', saveError);
      // Don't fail - message was sent successfully
    }

    // Update conversation
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.type === 'text'
          ? (body.content || '').substring(0, 100)
          : getContentPreview(body),
        last_message_direction: 'outbound',
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.conversation_id);

    return new Response(JSON.stringify({
      success: true,
      message_id: messageId,
      saved_id: savedMessage?.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[SendMessage] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

// =========================================
// Helpers
// =========================================

function buildMetaPayload(body: SendMessageRequest): MetaMessagePayload {
  const payload: MetaMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: body.to.replace(/\D/g, ''), // Remove non-digits
    type: body.type,
  };

  // Add context for replies
  if (body.reply_to_message_id) {
    payload.context = { message_id: body.reply_to_message_id };
  }

  switch (body.type) {
    case 'text':
      payload.text = {
        body: body.content || '',
        preview_url: true,
      };
      break;

    case 'image':
      payload.image = body.media_id
        ? { id: body.media_id, caption: body.caption }
        : { link: body.media_url, caption: body.caption };
      break;

    case 'audio':
      payload.audio = body.media_id
        ? { id: body.media_id }
        : { link: body.media_url };
      break;

    case 'video':
      payload.video = body.media_id
        ? { id: body.media_id, caption: body.caption }
        : { link: body.media_url, caption: body.caption };
      break;

    case 'document':
      payload.document = body.media_id
        ? { id: body.media_id, caption: body.caption }
        : { link: body.media_url, caption: body.caption };
      break;

    case 'template':
      if (body.template) {
        payload.template = {
          name: body.template.name,
          language: { code: body.template.language },
          components: body.template.components,
        };
      }
      break;

    case 'reaction':
      if (body.reaction) {
        payload.reaction = {
          message_id: body.reaction.message_id,
          emoji: body.reaction.emoji,
        };
      }
      break;
  }

  return payload;
}

function getContentPreview(body: SendMessageRequest): string {
  switch (body.type) {
    case 'image':
      return body.caption || '[Imagem]';
    case 'audio':
      return '[Áudio]';
    case 'video':
      return body.caption || '[Vídeo]';
    case 'document':
      return body.caption || '[Documento]';
    case 'template':
      return `[Template: ${body.template?.name}]`;
    case 'reaction':
      return body.reaction?.emoji || '';
    default:
      return `[${body.type}]`;
  }
}

serve(handler);
