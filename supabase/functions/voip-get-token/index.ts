/**
 * Edge Function: voip-get-token
 * Generates Twilio Access Token for Voice SDK
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Twilio from 'https://esm.sh/twilio@4.19.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    // Check for linked doctor if secretary
    let targetUserId = user.id;
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'secretaria') {
      const { data: links } = await supabaseAdmin
        .from('secretary_doctor_links')
        .select('doctor_id')
        .eq('secretary_id', user.id)
        .eq('is_active', true)
        .limit(1);
      if (links && links.length > 0) targetUserId = links[0].doctor_id;
    }

    // Get Twilio Config
    const { data: config } = await supabaseAdmin
      .from('voip_config')
      .select('account_sid, api_key_sid, api_key_secret, twiml_app_sid, is_active')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!config || !config.is_active) throw new Error('VOIP not configured or inactive');
    if (!config.account_sid || !config.api_key_sid || !config.api_key_secret || !config.twiml_app_sid) {
      throw new Error('Incomplete Twilio configuration');
    }

    // Generate Token
    const AccessToken = Twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: config.twiml_app_sid,
      incomingAllow: true, // Allow incoming calls
    });

    // Identity identifies the user in Twilio (using user ID)
    const identity = user.id;

    const token = new AccessToken(
      config.account_sid,
      config.api_key_sid,
      config.api_key_secret,
      { identity: identity }
    );

    token.addGrant(voiceGrant);

    return new Response(JSON.stringify({
      success: true,
      token: token.toJwt(),
      identity: identity,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[VOIP-TOKEN] Error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
