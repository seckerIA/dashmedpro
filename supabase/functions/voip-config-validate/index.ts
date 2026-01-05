/**
 * Edge Function: voip-config-validate
 * Validates Twilio credentials by fetching Account details
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.190.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { account_sid, auth_token, api_key_sid, api_key_secret, twiml_app_sid, twilio_phone_number } = await req.json();

    if (!account_sid || !auth_token) throw new Error('Account SID and Auth Token required');

    // 1. Validate Account SID & Auth Token (Fetch Account)
    const basicAuth = 'Basic ' + base64Encode(new TextEncoder().encode(`${account_sid}:${auth_token}`));
    const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`, {
      headers: { 'Authorization': basicAuth }
    });

    if (!accRes.ok) throw new Error('Invalid Twilio Account SID or Auth Token');
    const accountData = await accRes.json();

    // 2. Validate API Key (if provided)
    if (api_key_sid && api_key_secret) {
      // We can't easily validate the secret without generating a token and using it,
      // but checking the SID existence is a good start.
      const keyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Keys/${api_key_sid}.json`, {
        headers: { 'Authorization': basicAuth }
      });
      if (!keyRes.ok) throw new Error('Invalid API Key SID');
    }

    // 3. Save to DB
    const { error: upsertError } = await supabaseAdmin
      .from('voip_config')
      .upsert({
        user_id: user.id,
        account_sid,
        auth_token,
        api_key_sid,
        api_key_secret,
        twiml_app_sid,
        twilio_phone_number,
        is_active: true,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({
      success: true,
      account_name: accountData.friendly_name,
      message: 'Twilio configuration validated and saved.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
