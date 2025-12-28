import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppWebhookPayload {
  message_id: string;
  phone_number: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  user_id?: string;
  contact_id?: string;
  lead_id?: string;
  metadata?: Record<string, any>;
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

    const payload: WhatsAppWebhookPayload = await req.json();

    if (!payload.phone_number || !payload.content) {
      return new Response(
        JSON.stringify({ error: 'phone_number and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar contato por telefone se não fornecido
    let contactId = payload.contact_id;
    let leadId = payload.lead_id;
    let userId = payload.user_id;

    if (!contactId && payload.phone_number) {
      const { data: contact } = await supabaseAdmin
        .from('crm_contacts')
        .select('id, user_id')
        .eq('phone', payload.phone_number)
        .limit(1)
        .single();

      if (contact) {
        contactId = contact.id;
        userId = contact.user_id;
      }
    }

    // Buscar lead por telefone se não fornecido
    if (!leadId && payload.phone_number) {
      const { data: lead } = await supabaseAdmin
        .from('commercial_leads')
        .select('id, user_id')
        .eq('phone', payload.phone_number)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lead) {
        leadId = lead.id;
        if (!userId) userId = lead.user_id;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Could not determine user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar mensagem
    const { data: message, error: messageError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        contact_id: contactId || null,
        lead_id: leadId || null,
        message_id: payload.message_id,
        direction: payload.direction,
        content: payload.content,
        status: payload.status || 'sent',
        sent_at: payload.timestamp || new Date().toISOString(),
        phone_number: payload.phone_number,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving WhatsApp message:', messageError);
      return new Response(
        JSON.stringify({ error: messageError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se mensagem inbound, atualizar last_contact_at e recalcular score
    if (payload.direction === 'inbound' && contactId) {
      await supabaseAdmin
        .from('crm_contacts')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', contactId);

      // Recalcular score do lead se houver
      if (leadId) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-lead-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ lead_id: leadId, user_id: userId }),
          });
        } catch (error) {
          console.error('Error recalculating lead score:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: message.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in whatsapp-webhook function:", error);
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


