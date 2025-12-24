import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessCampaignRequest {
  campaign_id?: string;
  inactive_months?: number;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { campaign_id, inactive_months = 6, user_id }: ProcessCampaignRequest = await req.json();

    // Se campaign_id fornecido, processar apenas essa campanha
    if (campaign_id) {
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('reactivation_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .eq('enabled', true)
        .single();

      if (campaignError || !campaign) {
        return new Response(
          JSON.stringify({ error: 'Campaign not found or disabled' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return await processCampaign(campaign, supabaseAdmin);
    }

    // Processar todas as campanhas ativas
    const query = supabaseAdmin
      .from('reactivation_campaigns')
      .select('*')
      .eq('enabled', true);
    
    if (user_id) {
      query.eq('user_id', user_id);
    }

    const { data: campaigns, error: campaignsError } = await query;

    if (campaignsError) {
      return new Response(
        JSON.stringify({ error: campaignsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No active campaigns found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    for (const campaign of campaigns) {
      const result = await processCampaign(campaign, supabaseAdmin);
      results.push(JSON.parse(await result.text()));
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_processed: campaigns.length,
        results: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in process-reactivation-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function processCampaign(campaign: any, supabaseAdmin: any): Promise<Response> {
  const inactiveMonths = campaign.inactive_period_months || 6;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - inactiveMonths);

  // Buscar contatos elegíveis
  const { data: eligibleContacts, error: contactsError } = await supabaseAdmin
    .from('crm_contacts')
    .select('*')
    .eq('user_id', campaign.user_id)
    .or(`last_appointment_at.is.null,last_appointment_at.lt.${cutoffDate.toISOString()}`)
    .is('reactivation_eligible', true);

  if (contactsError) {
    return new Response(
      JSON.stringify({ error: contactsError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!eligibleContacts || eligibleContacts.length === 0) {
    return new Response(
      JSON.stringify({ success: true, processed: 0, message: 'No eligible contacts found' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Filtrar contatos que já receberam mensagem recente (últimos 30 dias)
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 30);

  const contactsToProcess = eligibleContacts.filter((contact: any) => {
    if (!contact.reactivation_last_sent_at) return true;
    const lastSent = new Date(contact.reactivation_last_sent_at);
    return lastSent < recentCutoff;
  });

  let processed = 0;
  const errors: string[] = [];

  // Processar em lotes de 10
  const batchSize = 10;
  for (let i = 0; i < contactsToProcess.length; i += batchSize) {
    const batch = contactsToProcess.slice(i, i + batchSize);
    
    const promises = batch.map(async (contact: any) => {
      try {
        // Chamar send-reactivation-message
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-reactivation-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            campaign_id: campaign.id,
            contact_id: contact.id,
            channel: 'whatsapp', // Default
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }

        processed++;
      } catch (error: any) {
        errors.push(`Contact ${contact.id}: ${error.message}`);
      }
    });

    await Promise.allSettled(promises);
  }

  return new Response(
    JSON.stringify({
      success: true,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      eligible_contacts: eligibleContacts.length,
      processed: processed,
      errors: errors.length > 0 ? errors : undefined,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

serve(handler);

