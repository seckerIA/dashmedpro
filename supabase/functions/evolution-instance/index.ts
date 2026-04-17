import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');
    if (!globalApiKey) {
      return new Response(JSON.stringify({ error: 'EVOLUTION_GLOBAL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Helper: build Evolution API URL (no prefix — v2 uses root paths)
    const evoUrl = (baseUrl: string, path: string) => {
      const base = baseUrl.replace(/\/+$/, '');
      return `${base}${path}`;
    };

    // ---- ACTION: CREATE ----
    if (action === 'create') {
      const { instance_name, api_url } = body;
      if (!instance_name || !api_url) {
        return new Response(JSON.stringify({ error: 'instance_name and api_url required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Sanitize instance name (only lowercase, numbers, hyphens)
      const safeName = instance_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);

      const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;

      // Create instance on Evolution API
      const createRes = await fetch(evoUrl(api_url, '/instance/create'), {
        method: 'POST',
        headers: {
          'apikey': globalApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: safeName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          rejectCall: false,
          groupsIgnore: true,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
          webhook: {
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          },
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error('Evolution create error:', errText);
        return new Response(JSON.stringify({
          error: 'Failed to create Evolution instance',
          details: errText,
        }), {
          status: createRes.status === 403 ? 409 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const createData = await createRes.json();
      // Evolution v2: o token da instância pode vir como `hash.apikey` (v1),
      // `hash` (string), `instance.token`, `instance.apikey` ou `apikey` na raiz.
      const instanceToken = (typeof createData.hash === 'string' ? createData.hash : createData.hash?.apikey)
        || createData.instance?.token
        || createData.instance?.apikey
        || createData.apikey
        || '';

      // Save to whatsapp_config
      const { error: upsertError } = await sb.from('whatsapp_config').upsert({
        user_id: user.id,
        provider: 'evolution',
        evolution_instance_name: safeName,
        evolution_instance_token: instanceToken,
        evolution_api_url: api_url,
        evolution_instance_status: 'connecting',
        is_active: false,
      }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Config upsert error:', upsertError);
        return new Response(JSON.stringify({ error: 'Failed to save config' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Try to get QR code immediately
      let qrCode = null;
      try {
        const qrRes = await fetch(evoUrl(api_url, `/instance/connect/${safeName}`), {
          headers: { 'apikey': globalApiKey },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = qrData.base64 || qrData.code || null;
        }
      } catch (_e) {
        // QR will be fetched separately
      }

      return new Response(JSON.stringify({
        success: true,
        instance_name: safeName,
        instance_token: instanceToken,
        qr_code: qrCode,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- ACTION: CONNECT (get QR code) ----
    if (action === 'connect') {
      const { instance_name } = body;

      // Get config to find api_url
      const { data: config } = await sb.from('whatsapp_config')
        .select('evolution_api_url')
        .eq('user_id', user.id)
        .eq('evolution_instance_name', instance_name)
        .single();

      const apiUrl = config?.evolution_api_url || body.api_url;
      if (!apiUrl) {
        return new Response(JSON.stringify({ error: 'Config not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qrRes = await fetch(evoUrl(apiUrl, `/instance/connect/${instance_name}`), {
        headers: { 'apikey': globalApiKey },
      });

      if (!qrRes.ok) {
        const errText = await qrRes.text();
        return new Response(JSON.stringify({ error: 'Failed to get QR code', details: errText }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qrData = await qrRes.json();

      return new Response(JSON.stringify({
        qr_code: qrData.base64 || qrData.code || null,
        pairing_code: qrData.pairingCode || null,
        count: qrData.count || 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- ACTION: STATUS ----
    if (action === 'status') {
      const { instance_name } = body;

      const { data: config } = await sb.from('whatsapp_config')
        .select('evolution_api_url, evolution_instance_status, is_active, display_phone_number')
        .eq('user_id', user.id)
        .eq('evolution_instance_name', instance_name)
        .single();

      const apiUrl = config?.evolution_api_url || body.api_url;
      if (!apiUrl) {
        return new Response(JSON.stringify({ error: 'Config not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch live status from Evolution
      let liveState = config?.evolution_instance_status || 'disconnected';
      try {
        const stateRes = await fetch(evoUrl(apiUrl, `/instance/connectionState/${instance_name}`), {
          headers: { 'apikey': globalApiKey },
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          liveState = stateData.instance?.state || stateData.state || liveState;

          // Update DB if state changed
          if (liveState !== config?.evolution_instance_status) {
            await sb.from('whatsapp_config').update({
              evolution_instance_status: liveState,
              is_active: liveState === 'open',
            }).eq('user_id', user.id).eq('evolution_instance_name', instance_name);
          }
        }
      } catch (_e) {
        // Use cached state
      }

      return new Response(JSON.stringify({
        state: liveState,
        is_active: liveState === 'open',
        display_phone_number: config?.display_phone_number || null,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- ACTION: DELETE ----
    if (action === 'delete') {
      const { instance_name } = body;

      const { data: config } = await sb.from('whatsapp_config')
        .select('evolution_api_url')
        .eq('user_id', user.id)
        .eq('evolution_instance_name', instance_name)
        .single();

      const apiUrl = config?.evolution_api_url;
      if (apiUrl) {
        // Delete from Evolution server
        try {
          await fetch(evoUrl(apiUrl, `/instance/delete/${instance_name}`), {
            method: 'DELETE',
            headers: { 'apikey': globalApiKey },
          });
        } catch (_e) {
          console.error('Failed to delete Evolution instance:', _e);
        }
      }

      // Clean config
      await sb.from('whatsapp_config').update({
        provider: 'meta',
        evolution_instance_name: null,
        evolution_instance_token: null,
        evolution_api_url: null,
        evolution_instance_status: 'disconnected',
        is_active: false,
      }).eq('user_id', user.id).eq('evolution_instance_name', instance_name);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: create, connect, status, delete' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('evolution-instance error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
