/**
 * Edge Function: whatsapp-media-proxy
 * Proxies media downloads from Meta Graph API.
 *
 * The frontend calls this with a whatsapp_media_id, and we:
 * 1. Look up the media record in our DB
 * 2. Find the user's access_token from whatsapp_config
 * 3. Fetch the media URL from Meta Graph API
 * 4. Stream the actual binary back to the client
 *
 * GET /whatsapp-media-proxy?media_id={whatsapp_media_id}
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPH_API_VERSION = 'v22.0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse media_id from query or body
    let mediaId: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      mediaId = url.searchParams.get('media_id');
    } else {
      const body = await req.json().catch(() => ({}));
      mediaId = body.media_id || null;
    }

    if (!mediaId) {
      return new Response(JSON.stringify({ error: 'media_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the media record — try whatsapp_media_id first, then by message_id
    let mediaRecord: any = null;

    // Try by whatsapp_media_id (Meta messages)
    const { data: byMediaId } = await supabaseAdmin
      .from('whatsapp_media')
      .select('id, media_type, media_mime_type, whatsapp_media_id, media_url, message_id')
      .eq('whatsapp_media_id', mediaId)
      .limit(1)
      .maybeSingle();

    if (byMediaId) {
      mediaRecord = byMediaId;
    } else {
      // Try by message_id (Evolution messages store media_url directly)
      const { data: byMsgId } = await supabaseAdmin
        .from('whatsapp_media')
        .select('id, media_type, media_mime_type, whatsapp_media_id, media_url, message_id')
        .eq('message_id', mediaId)
        .limit(1)
        .maybeSingle();
      mediaRecord = byMsgId;
    }

    if (!mediaRecord) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If media_url is already a direct URL (Evolution/Storage), proxy it directly
    if (mediaRecord.media_url && mediaRecord.media_url.startsWith('http')) {
      const directRes = await fetch(mediaRecord.media_url);
      if (directRes.ok) {
        const contentType = mediaRecord.media_mime_type || directRes.headers.get('content-type') || 'application/octet-stream';
        return new Response(directRes.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    // Get the message to find the conversation
    const { data: message } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('conversation_id')
      .eq('id', mediaRecord.message_id)
      .single();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation to find user_id for access_token
    const { data: conv } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('user_id')
      .eq('id', message.conversation_id)
      .single();

    if (!conv) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token
    const { data: waConfig } = await supabaseAdmin
      .from('whatsapp_config')
      .select('access_token')
      .eq('user_id', conv.user_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!waConfig?.access_token) {
      return new Response(JSON.stringify({ error: 'No WhatsApp access token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Get the download URL from Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
      { headers: { 'Authorization': `Bearer ${waConfig.access_token}` } }
    );

    if (!metaRes.ok) {
      const err = await metaRes.text();
      console.error('[media-proxy] Meta API error:', err);
      return new Response(JSON.stringify({ error: 'Failed to get media URL from Meta' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metaData = await metaRes.json();
    const downloadUrl = metaData.url;

    if (!downloadUrl) {
      return new Response(JSON.stringify({ error: 'No download URL returned' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Download the actual media binary
    const mediaRes = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${waConfig.access_token}` },
    });

    if (!mediaRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to download media' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Stream the binary to client with correct content type
    const contentType = mediaRecord.media_mime_type || metaData.mime_type || 'application/octet-stream';

    return new Response(mediaRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
      },
    });

  } catch (error: any) {
    console.error('[media-proxy] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
