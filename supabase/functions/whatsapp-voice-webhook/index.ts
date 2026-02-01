/**
 * Edge Function: whatsapp-voice-webhook
 * Handles incoming WhatsApp Cloud API Voice webhooks
 * - Inbound call notifications
 * - Call status updates
 * - SIP routing
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Status mapping from WhatsApp to our enum
const STATUS_MAP: Record<string, string> = {
    'ringing': 'ringing',
    'connected': 'in_progress',
    'ended': 'completed',
    'failed': 'failed',
    'busy': 'busy',
    'no-answer': 'no_answer',
};

const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'dashmedpro_voice_token';

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[WA-VOICE] Webhook verified');
            return new Response(challenge, { status: 200 });
        }

        return new Response('Forbidden', { status: 403 });
    }

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Handle POST (actual webhook events)
    try {
        const body = await req.json();
        console.log('[WA-VOICE] Webhook received:', JSON.stringify(body, null, 2));

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Process WhatsApp webhook payload
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value;
                    const phoneNumberId = value?.metadata?.phone_number_id;
                    const displayPhoneNumber = value?.metadata?.display_phone_number;

                    // Find config by phone number ID
                    const { data: config } = await supabaseAdmin
                        .from('voip_config')
                        .select('user_id, recording_enabled')
                        .eq('whatsapp_phone_number_id', phoneNumberId)
                        .eq('is_active', true)
                        .maybeSingle();

                    if (!config) {
                        console.log('[WA-VOICE] No config found for phone:', phoneNumberId);
                        continue;
                    }

                    // Handle incoming calls
                    if (change.field === 'calls' && value.calls) {
                        for (const call of value.calls) {
                            console.log('[WA-VOICE] Incoming call:', call);

                            // Create call session for inbound
                            await supabaseAdmin.from('voip_call_sessions').insert({
                                user_id: config.user_id,
                                provider: 'whatsapp',
                                whatsapp_call_id: call.id,
                                from_number: call.from,
                                to_number: displayPhoneNumber,
                                direction: 'inbound',
                                status: 'ringing',
                                initiated_at: new Date(parseInt(call.timestamp) * 1000).toISOString(),
                            });

                            // TODO: Trigger real-time notification to browser via Supabase Realtime
                            // The frontend should listen to voip_call_sessions table for incoming calls
                        }
                    }

                    // Handle call status updates
                    if (value.statuses) {
                        for (const status of value.statuses) {
                            const mappedStatus = STATUS_MAP[status.status] || status.status;

                            const updateData: Record<string, any> = {
                                status: mappedStatus,
                                updated_at: new Date().toISOString(),
                            };

                            if (status.status === 'connected') {
                                updateData.answered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
                            }

                            if (status.status === 'ended' || status.status === 'failed') {
                                updateData.ended_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
                            }

                            if (status.errors && status.errors.length > 0) {
                                updateData.error_code = String(status.errors[0].code);
                                updateData.error_message = status.errors[0].title;
                            }

                            // Update by WhatsApp call ID
                            await supabaseAdmin
                                .from('voip_call_sessions')
                                .update(updateData)
                                .eq('whatsapp_call_id', status.id);
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[WA-VOICE] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};

serve(handler);
