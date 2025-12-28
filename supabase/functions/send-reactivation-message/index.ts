import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendReactivationRequest {
  campaign_id: string;
  contact_id: string;
  template_variant?: 'variant_a' | 'variant_b';
  channel?: 'whatsapp' | 'sms' | 'email';
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

    const { campaign_id, contact_id, template_variant, channel = 'whatsapp' }: SendReactivationRequest = await req.json();

    if (!campaign_id || !contact_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id and contact_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('reactivation_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar contato
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('crm_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Selecionar template (A/B testing)
    const templates = campaign.message_templates as any[];
    let selectedTemplate = templates.find(t => t.variant === template_variant);
    
    if (!selectedTemplate && templates.length > 0) {
      // Selecionar aleatoriamente para A/B testing se não especificado
      selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    }

    if (!selectedTemplate) {
      return new Response(
        JSON.stringify({ error: 'No template found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Substituir variáveis no template
    let messageContent = selectedTemplate.content;
    const variables = selectedTemplate.variables || [];
    
    for (const variable of variables) {
      if (variable === '{{nome}}') {
        messageContent = messageContent.replace(/\{\{nome\}\}/g, contact.full_name || 'Cliente');
      } else if (variable === '{{ultima_visita}}') {
        const lastVisit = contact.last_appointment_at 
          ? new Date(contact.last_appointment_at).toLocaleDateString('pt-BR')
          : 'algum tempo';
        messageContent = messageContent.replace(/\{\{ultima_visita\}\}/g, lastVisit);
      } else if (variable === '{{link_agendamento}}') {
        // TODO: Gerar link de agendamento quando implementar
        const appointmentLink = `${Deno.env.get('APP_URL') || 'https://app.dashmedpro.com'}/calendar?contactId=${contact.id}`;
        messageContent = messageContent.replace(/\{\{link_agendamento\}\}/g, appointmentLink);
      }
    }

    // TODO: Enviar mensagem via WhatsApp/SMS/Email
    // Por enquanto, apenas registrar
    const { data: message, error: messageError } = await supabaseAdmin
      .from('reactivation_messages')
      .insert({
        campaign_id: campaign_id,
        contact_id: contact_id,
        template_variant: selectedTemplate.variant,
        message_content: messageContent,
        channel: channel,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      return new Response(
        JSON.stringify({ error: messageError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar contato
    await supabaseAdmin
      .from('crm_contacts')
      .update({
        reactivation_last_sent_at: new Date().toISOString(),
      })
      .eq('id', contact_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: message.id,
        message_content: messageContent,
        channel: channel,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reactivation-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);


