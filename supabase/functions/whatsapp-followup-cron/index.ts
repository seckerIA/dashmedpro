// WhatsApp AI Follow-up Cron
// Edge Function que roda periodicamente (a cada 30min) e dispara
// mensagens de re-engajamento para conversas onde o paciente parou de responder.
//
// Regras (ORDEM SAGRADA do PDF Jessica):
//  - Tentativa 1: 3h apos ultima outbound
//  - Tentativa 2: 24h apos ultima outbound
//  - Tentativa 3: 72h apos ultima outbound (handoff humano)
//  - Janela horaria: 8h-21h BRT (configuravel por usuario)
//  - Apenas conversas com auto_reply_enabled E ai_autonomous_mode != false
//  - Pula conversas resolved/spam/handoff
//  - Pula conversas com followup_disabled=true
//
// Mensagens contextualizadas conforme fase em que parou.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SU = Deno.env.get('SUPABASE_URL') || '';
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// MENSAGENS CONTEXTUAIS por (attempt, phase)
// ============================================================
function buildFollowupMessage(attempt: number, phase: string, firstName: string, hasPainQueixa: boolean): string[] {
  const fn = firstName ? firstName : '';
  const greet = fn ? fn + ', ' : '';

  if (attempt === 1) {
    if (phase === 'agendamento') {
      return [
        greet + 'ainda dá pra reservar aquele horário pra você 😊',
        'Quer que eu confirme?',
      ];
    }
    if (phase === 'triagem' && hasPainQueixa) {
      return [
        greet + 'fiquei pensando no que você me contou…',
        'Quanto antes a gente identificar o que tá causando isso, mais rápido você volta a se sentir bem.',
        'Quer que eu te explique como o Dr. faz a avaliação?',
      ];
    }
    return [
      greet + 'tô por aqui se quiser conversar 😊',
      'Posso te ajudar com algo?',
    ];
  }

  if (attempt === 2) {
    if (phase === 'agendamento') {
      return [
        greet + 'última chance de reservar aquele horário hoje.',
        'Costumam encher rápido. Confirmo pra você?',
      ];
    }
    if (phase === 'triagem' && hasPainQueixa) {
      return [
        greet + 'sei que decisões assim levam tempo. Mas conviver com dor não é caminho.',
        'Se quiser, eu te mando depoimentos rápidos de pessoas que estavam no seu lugar e hoje tão bem. Posso enviar?',
      ];
    }
    return [
      greet + 'queria saber se você ainda tem interesse na avaliação.',
      'Se for o caso, é só me avisar que retomo daqui.',
    ];
  }

  // attempt 3 — handoff humano
  return [
    greet + 'última tentativa por aqui 🙏',
    'Caso queira retomar, é só me chamar. Vou deixar registrado pra equipe te dar atenção especial quando você responder. Cuide-se!',
  ];
}

// ============================================================
// HEURISTICA DE FASE (simples — espelha router.ts do agente)
// ============================================================
function detectPhaseHeuristic(messageCount: number, hasPainQueixa: boolean, lastInboundContent: string): string {
  const lim = (lastInboundContent || '').toLowerCase();
  const schedRx = /agendar|marcar|hor[aá]rio|reservar|consulta|amanh[aã]|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo|\d{1,2}h\d{0,2}|\d{1,2}\s*(horas|hrs)/i;
  if (schedRx.test(lim)) return 'agendamento';
  if (messageCount <= 2) return 'abertura';
  if (hasPainQueixa) return 'triagem';
  return 'triagem';
}

// ============================================================
// SEND TEXT (mesmo helper do agent — Evolution + Meta)
// ============================================================
async function sendText(cfg: any, to: string, text: string, sb: any, cid: string, uid: string): Promise<boolean> {
  const prov = cfg.provider || 'meta';
  const ir = await sb.from('whatsapp_messages').insert({
    user_id: uid, conversation_id: cid, phone_number: to, content: text, direction: 'outbound',
    message_type: 'text', status: 'pending', sent_at: new Date().toISOString(),
    provider: prov,
    metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-followup-cron' },
  }).select('id').single();
  const sm = ir.data;

  try {
    let wr: Response;
    if (prov === 'evolution') {
      const evoKey = (cfg.evolution_instance_token && cfg.evolution_instance_token.length > 0)
        ? cfg.evolution_instance_token
        : (Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '');
      const cleanNumber = to.replace('+', '').trim();
      wr = await fetch(cfg.evolution_api_url.replace(/\/+$/, '') + '/message/sendText/' + cfg.evolution_instance_name, {
        method: 'POST',
        headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanNumber, textMessage: { text }, text, options: { delay: 1200, presence: 'composing' } }),
      });
    } else {
      wr = await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
      });
    }

    let raw = '';
    try { raw = await wr.text(); } catch (_e) { raw = ''; }
    const ok = wr.ok;

    if (sm) {
      await sb.from('whatsapp_messages').update({
        status: ok ? 'delivered' : 'failed',
        error_message: ok ? null : raw.substring(0, 500),
      }).eq('id', sm.id);
    }
    return ok;
  } catch (e) {
    if (sm) {
      await sb.from('whatsapp_messages').update({ status: 'failed', error_message: String(e).substring(0, 500) }).eq('id', sm.id);
    }
    return false;
  }
}

// ============================================================
// HORARIO BRT
// ============================================================
function nowBRTHour(): number {
  // Brasil = UTC-3 (sem DST desde 2019)
  const utcMs = Date.now();
  const brtMs = utcMs - 3 * 3600 * 1000;
  return new Date(brtMs).getUTCHours();
}

function inWindow(startHour: number, endHour: number): boolean {
  const h = nowBRTHour();
  if (startHour <= endHour) return h >= startHour && h < endHour;
  // janela atravessa meia-noite (raro, mas suportamos)
  return h >= startHour || h < endHour;
}

// ============================================================
// DETERMINA QUAL TENTATIVA EXECUTAR baseado em quanto tempo passou
// ============================================================
function pickAttempt(hoursSinceLastOutbound: number, currentAttempts: number, maxAttempts: number): number | null {
  if (currentAttempts >= maxAttempts) return null;
  // attempt 1 = 3h, attempt 2 = 24h, attempt 3 = 72h
  const wantedAttempt = currentAttempts + 1;
  if (wantedAttempt === 1 && hoursSinceLastOutbound >= 3 && hoursSinceLastOutbound < 24) return 1;
  if (wantedAttempt === 2 && hoursSinceLastOutbound >= 24 && hoursSinceLastOutbound < 72) return 2;
  if (wantedAttempt === 3 && hoursSinceLastOutbound >= 72) return 3;
  // Caso o usuario tenha pulado tempo (ex: 50h e attempts=0), envia o melhor encaixe
  if (currentAttempts === 0 && hoursSinceLastOutbound >= 24 && hoursSinceLastOutbound < 72) return 2;
  if (currentAttempts === 0 && hoursSinceLastOutbound >= 72) return 3;
  if (currentAttempts === 1 && hoursSinceLastOutbound >= 72) return 3;
  return null;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...CORS } });
  }

  const sb = createClient(SU, SK);

  // Para teste manual: aceita ?dry=1 (nao envia, so reporta)
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry') === '1';

  const summary = {
    started_at: new Date().toISOString(),
    candidates_checked: 0,
    eligible: 0,
    sent: 0,
    skipped_window: 0,
    skipped_disabled: 0,
    skipped_max: 0,
    skipped_no_outbound: 0,
    handoffs: 0,
    errors: 0,
    details: [] as any[],
  };

  try {
    // 1. Lista todas as configs de IA com followup_enabled=true
    const cfgRes = await sb.from('whatsapp_ai_config')
      .select('user_id, followup_enabled, followup_window_start_hour, followup_window_end_hour, followup_max_attempts, auto_reply_enabled')
      .eq('followup_enabled', true)
      .eq('auto_reply_enabled', true);

    const aiConfigs = (cfgRes.data || []) as any[];
    if (aiConfigs.length === 0) {
      return new Response(JSON.stringify({ ...summary, message: 'No users with followup_enabled' }), { status: 200, headers: CORS });
    }

    const userIds = aiConfigs.map((c: any) => c.user_id);

    // 2. Busca conversas frias: ultima msg foi outbound, mais de 3h atras
    const cutoff3h = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const convRes = await sb.from('whatsapp_conversations')
      .select('id, user_id, phone_number, contact_name, status, ai_autonomous_mode, last_message_at, last_message_direction, followup_attempts, last_followup_at, followup_disabled')
      .in('user_id', userIds)
      .eq('last_message_direction', 'outbound')
      .eq('followup_disabled', false)
      .lte('last_message_at', cutoff3h)
      .not('status', 'in', '(resolved,spam)');

    const convs = (convRes.data || []) as any[];
    summary.candidates_checked = convs.length;

    for (let i = 0; i < convs.length; i++) {
      const conv = convs[i];
      const userCfg = aiConfigs.find((c: any) => c.user_id === conv.user_id);
      if (!userCfg) continue;

      // ai_autonomous_mode: true = on; false = paused/handoff humano (skip); null = segue global
      if (conv.ai_autonomous_mode === false) { summary.skipped_disabled++; continue; }

      // Janela horaria
      if (!inWindow(userCfg.followup_window_start_hour || 8, userCfg.followup_window_end_hour || 21)) {
        summary.skipped_window++;
        continue;
      }

      // Maximo de tentativas
      const maxAtt = userCfg.followup_max_attempts || 3;
      if ((conv.followup_attempts || 0) >= maxAtt) { summary.skipped_max++; continue; }

      // Quanto tempo desde a ultima outbound
      if (!conv.last_message_at) { summary.skipped_no_outbound++; continue; }
      const lastMs = new Date(conv.last_message_at).getTime();
      const hoursSince = (Date.now() - lastMs) / 3_600_000;

      const attempt = pickAttempt(hoursSince, conv.followup_attempts || 0, maxAtt);
      if (attempt === null) continue;

      // Cooldown: nao enviar dois follow-ups dentro de 1h
      if (conv.last_followup_at) {
        const sinceFu = (Date.now() - new Date(conv.last_followup_at).getTime()) / 3_600_000;
        if (sinceFu < 1) continue;
      }

      summary.eligible++;

      // 3. Carrega contexto: lead qualifications + ultima inbound (pra detectar fase)
      const ldRes = await sb.from('whatsapp_lead_qualifications').select('procedimento_desejado, perfil_paciente, status').eq('conversation_id', conv.id).maybeSingle();
      const lead = ldRes.data || {};
      const hasPain = !!(lead.procedimento_desejado);

      const lastInbRes = await sb.from('whatsapp_messages').select('content').eq('conversation_id', conv.id).eq('direction', 'inbound').order('created_at', { ascending: false }).limit(1).maybeSingle();
      const lastInb = (lastInbRes.data && lastInbRes.data.content) || '';

      const totalMsgsRes = await sb.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id);
      const totalMsgs = totalMsgsRes.count || 0;

      const phase = detectPhaseHeuristic(totalMsgs, hasPain, lastInb);

      // 4. Carrega config WhatsApp (provider, token)
      const wacRes = await sb.from('whatsapp_config').select('*').eq('user_id', conv.user_id).maybeSingle();
      const wac = wacRes.data;
      if (!wac) { summary.errors++; continue; }

      // 5. Compoe e envia
      const firstName = (conv.contact_name || '').trim().split(/\s+/)[0] || '';
      const parts = buildFollowupMessage(attempt, phase, firstName, hasPain);

      const detail: any = { cid: conv.id, name: firstName, phase, attempt, hoursSince: Math.round(hoursSince), parts };

      if (dryRun) {
        summary.details.push({ ...detail, dry: true });
        continue;
      }

      let allOk = true;
      for (let p = 0; p < parts.length; p++) {
        if (p > 0) await sleep(1500);
        const ok = await sendText(wac, conv.phone_number, parts[p], sb, conv.id, conv.user_id);
        if (!ok) { allOk = false; break; }
      }

      if (allOk) {
        summary.sent++;
        const upd: any = {
          followup_attempts: (conv.followup_attempts || 0) + 1,
          last_followup_at: new Date().toISOString(),
        };
        // Tentativa 3 = handoff humano automatico
        if (attempt === 3) {
          upd.ai_autonomous_mode = false;
          upd.priority = 'high';
          upd.status = 'open';
          summary.handoffs++;
        }
        await sb.from('whatsapp_conversations').update(upd).eq('id', conv.id);
        summary.details.push({ ...detail, sent: true, handoff: attempt === 3 });
      } else {
        summary.errors++;
        summary.details.push({ ...detail, sent: false, error: true });
      }

      // pequeno delay entre conversas pra nao floodar
      await sleep(800);
    }

    return new Response(JSON.stringify(summary), { status: 200, headers: CORS });
  } catch (err) {
    console.error('[followup-cron] err:', err);
    return new Response(JSON.stringify({ error: String(err), summary }), { status: 500, headers: CORS });
  }
});
