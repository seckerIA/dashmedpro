import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const EVOLUTION_GLOBAL_API_KEY = Deno.env.get("EVOLUTION_GLOBAL_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type WhatsAppConfig = {
  provider: "meta" | "evolution";
  access_token: string | null;
  phone_number_id: string | null;
  evolution_instance_name: string | null;
  evolution_instance_token: string | null;
  evolution_api_url: string | null;
};

const formatBRDateTime = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const normalizePhone = (value?: string | null) => (value || "").replace(/\D/g, "");

async function sendReminderMessage(
  sb: ReturnType<typeof createClient>,
  cfg: WhatsAppConfig,
  to: string,
  text: string,
  userId: string,
  contactId: string,
): Promise<{ ok: boolean; error?: string }> {
  const provider = cfg.provider || "meta";
  let requestOk = false;
  let requestError = "";

  const pendingInsert = await sb
    .from("whatsapp_messages")
    .insert({
      user_id: userId,
      contact_id: contactId,
      phone_number: to,
      content: text,
      direction: "outbound",
      message_type: "text",
      status: "pending",
      sent_at: new Date().toISOString(),
      provider,
      metadata: {
        auto_reminder: true,
        reminder_type: "appointment_2h",
        agent: "appointment-reminder-cron",
      },
    })
    .select("id")
    .single();

  const messageId = pendingInsert.data?.id;

  try {
    if (provider === "evolution") {
      if (!cfg.evolution_instance_name || !cfg.evolution_api_url) {
        throw new Error("Config Evolution incompleta");
      }
      const apiKey = cfg.evolution_instance_token || EVOLUTION_GLOBAL_API_KEY;
      if (!apiKey) {
        throw new Error("Token Evolution não configurado");
      }

      const response = await fetch(
        `${cfg.evolution_api_url.replace(/\/+$/, "")}/message/sendText/${cfg.evolution_instance_name}`,
        {
          method: "POST",
          headers: { "apikey": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            number: normalizePhone(to),
            textMessage: { text },
            text,
            options: { delay: 700, presence: "composing" },
          }),
        },
      );
      requestOk = response.ok;
      if (!response.ok) requestError = (await response.text()).slice(0, 500);
    } else {
      if (!cfg.access_token || !cfg.phone_number_id) {
        throw new Error("Config Meta incompleta");
      }
      const response = await fetch(`https://graph.facebook.com/v18.0/${cfg.phone_number_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfg.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(to),
          type: "text",
          text: { body: text },
        }),
      });
      requestOk = response.ok;
      if (!response.ok) requestError = (await response.text()).slice(0, 500);
    }
  } catch (e) {
    requestOk = false;
    requestError = String(e).slice(0, 500);
  }

  if (messageId) {
    await sb
      .from("whatsapp_messages")
      .update({
        status: requestOk ? "delivered" : "failed",
        error_message: requestOk ? null : requestError || "Falha ao enviar lembrete",
      })
      .eq("id", messageId);
  }

  return { ok: requestOk, error: requestOk ? undefined : requestError };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = new Date();
  const windowStart = new Date(now.getTime() + 115 * 60 * 1000); // 1h55
  const windowEnd = new Date(now.getTime() + 125 * 60 * 1000); // 2h05

  const summary = {
    checked: 0,
    eligible: 0,
    sent: 0,
    skipped_no_phone: 0,
    skipped_no_config: 0,
    skipped_duplicate: 0,
    failed: 0,
    details: [] as Array<Record<string, unknown>>,
  };

  try {
    const { data: appointments, error: apptError } = await sb
      .from("medical_appointments")
      .select(`
        id,
        user_id,
        contact_id,
        title,
        start_time,
        status,
        contact:crm_contacts!medical_appointments_contact_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .in("status", ["scheduled", "confirmed"])
      .gte("start_time", windowStart.toISOString())
      .lte("start_time", windowEnd.toISOString());

    if (apptError) throw apptError;

    const list = appointments || [];
    summary.checked = list.length;

    for (const appt of list as any[]) {
      const contactPhone = appt.contact?.phone || "";
      const contactName = appt.contact?.full_name || "Paciente";
      if (!contactPhone) {
        summary.skipped_no_phone++;
        continue;
      }

      // Deduplicação forte por appointment_id + reminder_type (unique index)
      const reminderInsert = await sb
        .from("medical_appointment_reminders")
        .insert({
          appointment_id: appt.id,
          user_id: appt.user_id,
          contact_id: appt.contact_id,
          reminder_type: "2h_before",
          scheduled_for: new Date(new Date(appt.start_time).getTime() - 2 * 60 * 60 * 1000).toISOString(),
          status: "processing",
        })
        .select("id")
        .single();

      if (reminderInsert.error) {
        if (String(reminderInsert.error.message).toLowerCase().includes("duplicate")) {
          summary.skipped_duplicate++;
          continue;
        }
        throw reminderInsert.error;
      }

      const reminderId = reminderInsert.data?.id;
      summary.eligible++;

      const { data: cfg } = await sb
        .from("whatsapp_config")
        .select("provider, access_token, phone_number_id, evolution_instance_name, evolution_instance_token, evolution_api_url")
        .eq("user_id", appt.user_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!cfg) {
        summary.skipped_no_config++;
        if (reminderId) {
          await sb
            .from("medical_appointment_reminders")
            .update({ status: "failed", error_message: "Configuração WhatsApp não encontrada" })
            .eq("id", reminderId);
        }
        continue;
      }

      const when = formatBRDateTime(appt.start_time);
      const text =
        `Oi, ${contactName}! Passando para lembrar da sua consulta agendada para ${when}. ` +
        `Já estamos com tudo preparado para te receber. ❤️`;

      const sendResult = await sendReminderMessage(
        sb,
        cfg as WhatsAppConfig,
        contactPhone,
        text,
        appt.user_id,
        appt.contact_id,
      );

      if (sendResult.ok) {
        summary.sent++;
        if (reminderId) {
          await sb
            .from("medical_appointment_reminders")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              message: text,
              error_message: null,
            })
            .eq("id", reminderId);
        }
      } else {
        summary.failed++;
        if (reminderId) {
          await sb
            .from("medical_appointment_reminders")
            .update({
              status: "failed",
              error_message: sendResult.error || "Falha desconhecida no envio",
              message: text,
            })
            .eq("id", reminderId);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, windowStart, windowEnd, summary }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: String(error), windowStart, windowEnd, summary }),
      { status: 500, headers: corsHeaders },
    );
  }
});
