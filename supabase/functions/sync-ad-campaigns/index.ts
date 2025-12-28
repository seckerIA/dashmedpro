import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  connection_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connection_id }: SyncRequest = await req.json();

    if (!connection_id) {
      return new Response(
        JSON.stringify({ error: 'connection_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar conexão
    const { data: connection, error: connError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status para pending
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({ 
        sync_status: 'pending',
        error_message: null
      })
      .eq('id', connection_id);

    let syncResult;

    // Chamar função específica baseada na plataforma
    if (connection.platform === 'google_ads') {
      syncResult = await syncGoogleAds(connection, supabaseAdmin);
    } else if (connection.platform === 'meta_ads') {
      syncResult = await syncMetaAds(connection, supabaseAdmin);
    } else {
      throw new Error('Unsupported platform');
    }

    // Atualizar status da conexão
    await supabaseAdmin
      .from('ad_platform_connections')
      .update({ 
        sync_status: syncResult.success ? 'success' : 'error',
        last_sync_at: new Date().toISOString(),
        error_message: syncResult.error || null
      })
      .eq('id', connection_id);

    return new Response(
      JSON.stringify(syncResult),
      {
        status: syncResult.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in sync-ad-campaigns function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function syncGoogleAds(connection: any, supabase: any) {
  try {
    // TODO: Implementar chamada real à Google Ads API
    // Por enquanto, retorna estrutura básica
    
    // Exemplo de estrutura esperada:
    // const campaigns = await fetchGoogleAdsCampaigns(connection.api_key, connection.account_id);
    
    // Por enquanto, retorna mock
    return {
      success: true,
      campaigns_synced: 0,
      message: 'Google Ads sync not yet implemented. Please implement Google Ads API integration.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function syncMetaAds(connection: any, supabase: any) {
  try {
    // TODO: Implementar chamada real à Meta Ads API
    // Por enquanto, retorna estrutura básica
    
    // Exemplo de estrutura esperada:
    // const campaigns = await fetchMetaAdsCampaigns(connection.api_key, connection.account_id);
    
    // Por enquanto, retorna mock
    return {
      success: true,
      campaigns_synced: 0,
      message: 'Meta Ads sync not yet implemented. Please implement Meta Ads API integration.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

serve(handler);


