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

    /**
     * Evolution pode estar na raiz ou sob /api (EasyPanel, reverse proxy).
     * Se a primeira URL retorna 404, tenta `${base}/api${path}`.
     */
    const evoRequest = async (
      baseUrl: string,
      path: string,
      init?: RequestInit,
    ): Promise<Response> => {
      const root = baseUrl.replace(/\/+$/, '');
      const primaryUrl = `${root}${path}`;
      let res = await fetch(primaryUrl, init);
      if (res.status === 404) {
        const altUrl = `${root}/api${path}`;
        const alt = await fetch(altUrl, init);
        if (alt.status !== 404) {
          return alt;
        }
      }
      return res;
    };

    const extractInstanceToken = (row: Record<string, unknown>): string => {
      const hash = row.hash as Record<string, string> | string | undefined;
      return (
        (typeof hash === 'string' ? hash : hash?.apikey)
        || (row.instanceApiKey as string)
        || (row.apikey as string)
        || (row.token as string)
        || ((row.instance as Record<string, string>)?.token)
        || ((row.instance as Record<string, string>)?.apikey)
        || ''
      );
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

      const createInit: RequestInit = {
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
      };

      const createRes = await evoRequest(api_url, '/instance/create', createInit);

      let instanceToken = '';
      let qrCode: string | null = null;

      if (!createRes.ok) {
        const errText = await createRes.text();
        // Instância já existe no servidor Evolution — tentar conectar e obter QR / token
        const connRes = await evoRequest(api_url, `/instance/connect/${safeName}`, {
          headers: { 'apikey': globalApiKey },
        });
        if (connRes.ok) {
          const qrData = await connRes.json().catch(() => ({}));
          qrCode = qrData.base64 || qrData.code || null;
          const listRes = await evoRequest(api_url, '/instance/fetchInstances', {
            headers: { 'apikey': globalApiKey },
          });
          if (listRes.ok) {
            const raw = await listRes.json().catch(() => null);
            const instances: Record<string, unknown>[] = Array.isArray(raw)
              ? raw as Record<string, unknown>[]
              : (raw && typeof raw === 'object' && Array.isArray((raw as { instances?: unknown }).instances)
                ? (raw as { instances: Record<string, unknown>[] }).instances
                : []);
            const found = instances.find((x) => {
              const inst = x.instance as Record<string, string> | undefined;
              const n = (inst?.instanceName || x.instanceName || x.name || inst?.name) as string | undefined;
              return n === safeName;
            });
            if (found) {
              instanceToken = extractInstanceToken(found);
            }
          }
          console.warn('[evolution-instance] create failed but instance exists; continuing:', errText.slice(0, 500));
        } else {
          console.error('Evolution create error:', errText);
          return new Response(JSON.stringify({
            error: 'Failed to create Evolution instance',
            details: errText.slice(0, 2000),
          }), {
            status: createRes.status === 403 ? 409 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        const createData = await createRes.json().catch(() => null);
        if (!createData || typeof createData !== 'object') {
          return new Response(JSON.stringify({
            error: 'Resposta invalida da Evolution API ao criar instancia',
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const cd = createData as Record<string, unknown>;
        instanceToken = extractInstanceToken(cd);
        try {
          const qrRes = await evoRequest(api_url, `/instance/connect/${safeName}`, {
            headers: { 'apikey': globalApiKey },
          });
          if (qrRes.ok) {
            const qrData = await qrRes.json().catch(() => ({}));
            qrCode = (qrData as { base64?: string; code?: string }).base64
              || (qrData as { base64?: string; code?: string }).code
              || null;
          }
        } catch (_e) {
          // QR será obtido no polling
        }
      }

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
        return new Response(JSON.stringify({
          error: 'Failed to save config',
          details: upsertError.message,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

      const qrRes = await evoRequest(apiUrl, `/instance/connect/${instance_name}`, {
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
        const stateRes = await evoRequest(apiUrl, `/instance/connectionState/${instance_name}`, {
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
          await evoRequest(apiUrl, `/instance/delete/${instance_name}`, {
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
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
