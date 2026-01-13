/**
 * Edge Function: voip-webhook
 * Handles Twilio Voice Webhooks (Answer, Status)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.190.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Twilio Signature Validation (optional but recommended)
async function validateTwilioSignature(req: Request, params: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  // If no auth token configured, skip validation but log warning
  if (!twilioAuthToken) {
    console.warn('[VOIP-WEBHOOK] TWILIO_AUTH_TOKEN not set - signature validation skipped. Set it in Edge Function secrets for security.');
    return { valid: true, message: 'Signature validation skipped (no TWILIO_AUTH_TOKEN)' };
  }

  const signature = req.headers.get('X-Twilio-Signature');
  if (!signature) {
    return { valid: false, message: 'Missing X-Twilio-Signature header' };
  }

  // Build the validation string: URL + sorted params
  const url = req.url.split('?')[0]; // Base URL without query string
  const sortedParams = Object.keys(params).sort().map(key => key + params[key]).join('');
  const dataToSign = url + sortedParams;

  // Create HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(twilioAuthToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const expectedSignature = encodeBase64(new Uint8Array(signatureBuffer));

  if (expectedSignature !== signature) {
    return { valid: false, message: 'Invalid Twilio signature' };
  }

  return { valid: true, message: 'Signature valid' };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  // Twilio sends POST form-data
  let params: Record<string, string> = {};
  try {
    if (req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((val, key) => params[key] = val.toString());
    } else {
      // fallback query params
      const url = new URL(req.url);
      url.searchParams.forEach((val, key) => params[key] = val);
    }
  } catch (e) {
    console.error('Error parsing body', e);
  }

  // Validate Twilio signature (optional security check)
  const signatureValidation = await validateTwilioSignature(req, params);
  if (!signatureValidation.valid) {
    console.error('[VOIP-WEBHOOK] Signature validation failed:', signatureValidation.message);
    return new Response('Forbidden: ' + signatureValidation.message, { status: 403 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Determine Request Type
  // Twilio usually hits the URL defined in TwiML App.
  // We can use a query param ?type=answer or check parameters.
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'answer'; // Default to answer if not specified

  console.log('[VOIP-WEBHOOK] Action:', action, 'Params:', JSON.stringify(params));

  // ==========================================
  // STATUS CALLBACK (Events)
  // ==========================================
  if (action === 'status') {
    const callSid = params.CallSid;
    const callStatus = params.CallStatus; // queued, ringing, in-progress, completed, busy, failed, no-answer, canceled
    const duration = params.CallDuration ? parseInt(params.CallDuration) : 0;

    if (callSid && callStatus) {
      let dbStatus = 'initiating';
      if (['ringing'].includes(callStatus)) dbStatus = 'ringing';
      if (['in-progress'].includes(callStatus)) dbStatus = 'in_progress';
      if (['completed'].includes(callStatus)) dbStatus = 'completed';
      if (['busy', 'failed', 'no-answer', 'canceled'].includes(callStatus)) dbStatus = callStatus === 'canceled' ? 'cancelled' : 'failed'; // map nicely

      const updateData: any = { status: dbStatus, updated_at: new Date().toISOString() };
      if (['completed', 'failed', 'busy', 'no-answer', 'cancelled'].includes(dbStatus)) {
        updateData.ended_at = new Date().toISOString();
        if (duration > 0) updateData.duration_seconds = duration;
      }

      await supabaseAdmin.from('voip_call_sessions').update(updateData).eq('twilio_call_sid', callSid);
    }
    return new Response('OK', { status: 200 });
  }

  // ==========================================
  // ANSWER (Incoming Request to Dial)
  // ==========================================
  if (action === 'answer') {
    // Logic:
    // 1. If params.To is a Client (client:user_id), we are dialing a browser/app.
    // 2. If params.To is a PSTN Number, we are dialing a real phone.
    // 3. If params.From is a Client (Browser), they are making an OUTBOUND call.

    // Assume Browser -> External Number (Outbound)
    if (params.From && params.From.startsWith('client:')) {
      const numberToDial = params.To; // Number passed from frontend device.connect({ params: { To: '+55...' } })
      const userId = params.From.replace('client:', '');

      // Create Call Session
      await supabaseAdmin.from('voip_call_sessions').insert({
        user_id: userId, // approximate, assumes client ID is user ID
        twilio_call_sid: params.CallSid,
        from_number: params.Caller || 'browser',
        to_number: numberToDial,
        direction: 'outbound',
        status: 'initiating'
      });

      // TwiML to Dial Number
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${params.Caller || params.From}" action="${supabaseUrl}/functions/v1/voip-webhook?action=status">
        <Number>${numberToDial}</Number>
    </Dial>
</Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // Incoming Call to Twilio Number -> Browser
    // We need to find who owns this number.
    if (params.To) {
      const { data: config } = await supabaseAdmin.from('voip_config')
        .select('user_id')
        .eq('twilio_phone_number', params.To)
        .eq('is_active', true)
        .maybeSingle();

      if (config) {
        const userId = config.user_id;
        // Create Session
        await supabaseAdmin.from('voip_call_sessions').insert({
          user_id: userId,
          twilio_call_sid: params.CallSid,
          from_number: params.From,
          to_number: params.To,
          direction: 'inbound',
          status: 'ringing'
        });

        // Dial the Client
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial action="${supabaseUrl}/functions/v1/voip-webhook?action=status">
        <Client>
            <Identity>${userId}</Identity>
        </Client>
    </Dial>
</Response>`;
        return new Response(twiml, { headers: { 'Content-Type': 'application/xml' } });
      }
    }

    // Fallback
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Chamada nao configurada.</Say></Response>`, { headers: { 'Content-Type': 'application/xml' } });
  }

  return new Response('Unknown Action', { status: 400 });
};

serve(handler);
