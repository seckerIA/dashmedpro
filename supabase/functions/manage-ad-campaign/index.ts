import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageRequest {
  campaign_id: string;
  action: 'pause' | 'activate';
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

    const { campaign_id, action }: ManageRequest = await req.json();

    if (!campaign_id || !action) {
      return new Response(
        JSON.stringify({ error: 'campaign_id and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'pause' && action !== 'activate') {
      return new Response(
        JSON.stringify({ error: 'action must be "pause" or "activate"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar campanha sincronizada
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns_sync')
      .select(`
        *,
        connection:ad_platform_connections(*)
      `)
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connection = campaign.connection;

    if (!connection) {
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    // Chamar API da plataforma correspondente
    if (connection.platform === 'google_ads') {
      result = await manageGoogleAdsCampaign(
        connection.api_key,
        connection.account_id,
        campaign.platform_campaign_id,
        action
      );
    } else if (connection.platform === 'meta_ads') {
      result = await manageMetaAdsCampaign(
        connection.api_key,
        connection.account_id,
        campaign.platform_campaign_id,
        action
      );
    } else {
      throw new Error('Unsupported platform');
    }

    if (result.success) {
      // Atualizar status no banco
      const newStatus = action === 'pause' ? 'paused' : 'active';
      await supabaseAdmin
        .from('ad_campaigns_sync')
        .update({ status: newStatus })
        .eq('id', campaign_id);
    }

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in manage-ad-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function manageGoogleAdsCampaign(
  apiKey: string,
  accountId: string,
  campaignId: string,
  action: 'pause' | 'activate'
) {
  try {
    // TODO: Implementar chamada real à Google Ads API
    // Por enquanto, retorna estrutura básica
    return {
      success: true,
      message: `Google Ads campaign ${action} not yet implemented. Please implement Google Ads API integration.`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function manageMetaAdsCampaign(
  apiKey: string,
  accountId: string,
  campaignId: string,
  action: 'pause' | 'activate'
) {
  try {
    // TODO: Implementar chamada real à Meta Ads API
    // Por enquanto, retorna estrutura básica
    return {
      success: true,
      message: `Meta Ads campaign ${action} not yet implemented. Please implement Meta Ads API integration.`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

serve(handler);

