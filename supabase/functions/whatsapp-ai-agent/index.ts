import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { detectPhase } from './router.ts';
import { buildPhasePrompt, buildLeadExtractionPrompt } from './prompt.ts';

var CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
var SU = Deno.env.get('SUPABASE_URL') || '';
var SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
var OAI = Deno.env.get('OPENAI_API_KEY') || '';
var BRO = -3 * 60 * 60 * 1000;

function sleep(ms: number): Promise<void> { return new Promise(function(r) { setTimeout(r, ms); }); }

function buildAgentIdentity(c: any): any {
  return {
    agent_name: c?.agent_name || 'Sofia',
    clinic_name: c?.clinic_name || 'nossa clinica',
    specialist_name: c?.specialist_name || 'nossa equipe',
    agent_greeting: c?.agent_greeting || undefined,
    custom_prompt_instructions: c?.custom_prompt_instructions || undefined,
    already_known_info: c?.already_known_info || undefined,
    doctor_info: c?.doctor_info || undefined,
  };
}

async function getWAConfig(sb: any, uid: string): Promise<any> {
  var r = await sb.from('whatsapp_config').select('phone_number_id, access_token').eq('user_id', uid).eq('is_active', true).filter('access_token', 'not.is', null).maybeSingle();
  if (r.data) return r.data;
  var r2 = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', uid).eq('is_active', true);
  if (r2.data && r2.data.length > 0) {
    var ids: string[] = [];
    for (var i = 0; i < r2.data.length; i++) ids.push(r2.data[i].doctor_id);
    var r3 = await sb.from('whatsapp_config').select('phone_number_id, access_token').in('user_id', ids).eq('is_active', true).filter('access_token', 'not.is', null).limit(1).maybeSingle();
    if (r3.data) return r3.data;
  }
  var r4 = await sb.from('whatsapp_config').select('phone_number_id, access_token').eq('is_active', true).filter('access_token', 'not.is', null).limit(1).maybeSingle();
  return r4.data;
}

async function callGPT(sys: string, msgs: any[], conv: any): Promise<string> {
  var bt = new Date(Date.now() + BRO).toISOString().replace('T', ' ').substring(0, 16);
  var rev = msgs.slice().reverse();
  var lines: string[] = [];
  for (var i = 0; i < rev.length; i++) {
    var prefix = rev[i].direction === 'inbound' ? 'PACIENTE' : 'CLINICA';
    lines.push(prefix + ': ' + (rev[i].content || '[midia]'));
  }
  var mc = lines.join('\n');
  var up = 'DATA E HORA ATUAL: ' + bt + ' (Horario de Brasilia)\n\nCONVERSA ATUAL:\n' + mc + '\n\nPACIENTE: ' + (conv.contact_name || 'Nome nao identificado') + '\nTELEFONE: ' + conv.phone_number + '\n\nResponda como a assistente da clinica. Use [SPLIT] para dividir em mensagens curtas.';
  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OAI, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: sys }, { role: 'user', content: up }], temperature: 0.75, max_tokens: 500 }),
  });
  if (!res.ok) {
    var errData = await res.json();
    throw new Error('OpenAI: ' + (errData.error?.message || 'Unknown'));
  }
  var d = await res.json();
  return (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content : '';
}

function postProcess(text: string): string[] {
  var cleaned = text.replace(/^(Sofia|Assistente|IA|Bot)\s*:\s*/gim, '').trim();
  var emojiRegex = /\p{Emoji_Presentation}/gu;
  var emojis = cleaned.match(emojiRegex) || [];
  if (emojis.length > 1) {
    var emojiCount = 0;
    cleaned = cleaned.replace(emojiRegex, function(match) {
      emojiCount++;
      return emojiCount <= 1 ? match : '';
    });
  }
  var rawParts = cleaned.split(/\[SPLIT\]/i);
  var trimmed: string[] = [];
  for (var i = 0; i < rawParts.length; i++) {
    var t = rawParts[i].trim();
    if (t.length > 0) trimmed.push(t);
  }
  var finalParts: string[] = [];
  for (var j = 0; j < trimmed.length; j++) {
    var part = trimmed[j];
    if (part.length <= 120) {
      finalParts.push(part);
    } else {
      var sentences = part.split(/(?<=[.!?])\s+/);
      var current = '';
      for (var k = 0; k < sentences.length; k++) {
        if ((current + ' ' + sentences[k]).trim().length > 120 && current) {
          finalParts.push(current.trim());
          current = sentences[k];
        } else {
          current = current ? current + ' ' + sentences[k] : sentences[k];
        }
      }
      if (current.trim()) finalParts.push(current.trim());
    }
  }
  if (finalParts.length === 0) finalParts.push(cleaned || 'Ola! Como posso te ajudar?');
  return finalParts;
}

async function typingDelay(text: string): Promise<void> {
  var len = text.length;
  var bd = len < 20 ? 1500 + Math.floor(Math.random()*1000) : len < 60 ? 2500 + Math.floor(Math.random()*1500) : len < 120 ? 4000 + Math.floor(Math.random()*2000) : 5000 + Math.floor(Math.random()*3000);
  await sleep(Math.max(1200, bd));
}

async function readingDelay(len: number): Promise<void> {
  await sleep(Math.max(1500, Math.min(len * 40, 4000)) + Math.floor(Math.random() * 1000));
}

async function sendTyping(cfg: any, mid: string): Promise<void> {
  try {
    await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: mid }),
    });
  } catch (_e) { /* ignore */ }
}

async function sendWA(cfg: any, to: string, text: string, sb: any, cid: string, uid: string): Promise<void> {
  var ir = await sb.from('whatsapp_messages').insert({
    user_id: uid, conversation_id: cid, phone_number: to, content: text, direction: 'outbound',
    message_type: 'text', status: 'pending', sent_at: new Date().toISOString(),
    metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-ai-agent' },
  }).select('id').single();
  var sm = ir.data;
  try {
    var wr = await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'text', text: { body: text } }),
    });
    if (wr.ok && sm) {
      var wd = await wr.json();
      var wid = (wd.messages && wd.messages[0]) ? wd.messages[0].id : null;
      if (wid) await sb.from('whatsapp_messages').update({ status: 'sent', message_id: wid }).eq('id', sm.id);
    }
  } catch (e) {
    console.error('[Agent] Send error:', e);
    if (sm) await sb.from('whatsapp_messages').update({ status: 'failed', error_message: String(e) }).eq('id', sm.id);
  }
}

async function buildScheduleContext(sb: any, uid: string): Promise<string> {
  var tids = [uid];
  var lr = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', uid);
  if (lr.data && lr.data.length > 0) {
    for (var i = 0; i < lr.data.length; i++) tids.push(lr.data[i].doctor_id);
  }
  var pr = await sb.from('profiles').select('id, full_name').in('id', tids);
  var dp = pr.data || [];
  var now = new Date();
  var n5 = new Date(); n5.setDate(now.getDate() + 5);
  var ar = await sb.from('medical_appointments').select('start_time, end_time, status, doctor_id').in('doctor_id', tids).gte('start_time', now.toISOString()).lte('start_time', n5.toISOString()).neq('status', 'cancelled').order('start_time', { ascending: true });
  var appts = ar.data || [];
  var mr = await sb.from('general_meetings').select('start_time, end_time, title, is_busy').in('user_id', tids).eq('is_busy', true).gte('start_time', now.toISOString()).lte('start_time', n5.toISOString()).neq('status', 'cancelled').order('start_time', { ascending: true });
  var meets = mr.data || [];
  var hr = await sb.from('doctor_working_hours').select('user_id, day_of_week, start_time, end_time').in('user_id', tids);
  var wh = hr.data || [];
  var dc: string[] = [];
  var na = new Date();
  var nbt = na.getTime() + BRO;
  for (var di = 0; di < 5; di++) {
    var ts = nbt + (di * 86400000);
    var d = new Date(ts);
    var dow = d.getUTCDay();
    var ds = d.getUTCDate().toString().padStart(2, '0') + '/' + (d.getUTCMonth() + 1).toString().padStart(2, '0');
    var wn = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
    var dayOut = '\n[' + wn[dow] + ', ' + ds + ']';
    var hs = false;
    for (var ui = 0; ui < tids.length; ui++) {
      var did = tids[ui];
      var ah = wh.filter(function(h: any) { return h.user_id === did; });
      var dh = ah.filter(function(h: any) { return h.day_of_week === dow; });
      if (ah.length === 0 && dow !== 0 && dow !== 6) dh = [{ start_time: '08:00:00', end_time: '18:00:00' }];
      if (dh.length === 0) continue;
      var de: Array<{ start: number; end: number }> = [];
      for (var ai = 0; ai < appts.length; ai++) {
        if (appts[ai].doctor_id === did) de.push({ start: new Date(appts[ai].start_time).getTime(), end: new Date(appts[ai].end_time).getTime() });
      }
      for (var mi2 = 0; mi2 < meets.length; mi2++) {
        if (meets[mi2].user_id === did) de.push({ start: new Date(meets[mi2].start_time).getTime(), end: new Date(meets[mi2].end_time).getTime() });
      }
      de.sort(function(a, b) { return a.start - b.start; });
      var fs: string[] = [];
      for (var hi2 = 0; hi2 < dh.length; hi2++) {
        var interval = dh[hi2];
        var sp2 = interval.start_time.split(':');
        var ep = interval.end_time.split(':');
        var sHU = parseInt(sp2[0], 10) + 3;
        var sM2 = parseInt(sp2[1], 10);
        var eHU = parseInt(ep[0], 10) + 3;
        var eM2 = parseInt(ep[1], 10);
        var sc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), sHU, sM2, 0));
        var eb = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), eHU, eM2, 0));
        while (sc.getTime() < eb.getTime()) {
          var ss2 = sc.getTime();
          var se2 = ss2 + 1800000;
          if (se2 > eb.getTime()) break;
          if (ss2 > (na.getTime() + 900000)) {
            var busy = false;
            for (var ei = 0; ei < de.length; ei++) {
              if (ss2 < de[ei].end && se2 > de[ei].start) { busy = true; break; }
            }
            if (!busy) fs.push(sc.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }));
          }
          sc = new Date(sc.getTime() + 1800000);
        }
      }
      if (fs.length > 0) {
        hs = true;
        var dn = 'Medico';
        for (var pi = 0; pi < dp.length; pi++) { if (dp[pi].id === did) { dn = dp[pi].full_name; break; } }
        dayOut = dayOut + '\n  - ' + dn + ': ' + fs.join(', ');
      }
    }
    if (hs) dc.push(dayOut);
    else if (di < 3) dc.push(dayOut + '\n  (Sem horarios livres)');
  }
  return dc.join('\n');
}

async function searchKB(sb: any, uid: string, q: string, fb: string | undefined): Promise<string> {
  try {
    var er = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OAI, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: q.substring(0, 2000) }),
    });
    if (er.ok) {
      var ed = await er.json();
      var qe = (ed.data && ed.data[0]) ? ed.data[0].embedding : null;
      if (qe) {
        var mr2 = await sb.rpc('match_knowledge', { p_user_id: uid, p_query_embedding: qe, p_match_threshold: 0.5, p_match_count: 3 });
        if (mr2.data && mr2.data.length > 0) {
          var parts: string[] = [];
          for (var i = 0; i < mr2.data.length; i++) parts.push('[' + mr2.data[i].category + '] ' + mr2.data[i].title + ':\n' + mr2.data[i].content);
          return parts.join('\n\n');
        }
      }
    }
  } catch (_e) { /* ignore */ }
  return fb || '';
}

async function extractLeadData(sb: any, cid: string, msgs: any[], conv: any, uid: string): Promise<void> {
  var rev = msgs.slice().reverse();
  var lines: string[] = [];
  for (var i = 0; i < rev.length; i++) lines.push((rev[i].direction === 'inbound' ? 'PACIENTE' : 'CLINICA') + ': ' + (rev[i].content || '[midia]'));
  var mc = lines.join('\n');
  var ep = buildLeadExtractionPrompt();
  var bt = new Date(Date.now() + BRO).toISOString().replace('T', ' ').substring(0, 16);
  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OAI, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ep },
        { role: 'user', content: 'DATA/HORA: ' + bt + ' (Brasilia UTC-3)\n\nCONVERSA:\n' + mc + '\n\nPACIENTE: ' + (conv.contact_name || 'Desconhecido') + '\nTELEFONE: ' + conv.phone_number },
      ],
      temperature: 0.1, max_tokens: 400, response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) return;
  var d = await res.json();
  var ct = (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content : null;
  if (!ct) return;
  try {
    var ex = JSON.parse(ct.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    var lu: any = { conversation_id: cid, phone_number: conv.phone_number };
    if (ex.nome) lu.nome = ex.nome;
    if (ex.procedimento_desejado) lu.procedimento_desejado = ex.procedimento_desejado;
    if (ex.convenio) lu.convenio = ex.convenio;
    if (ex.urgencia) lu.urgencia = ex.urgencia;
    if (ex.como_conheceu) lu.como_conheceu = ex.como_conheceu;
    if (ex.temperatura_lead) lu.temperatura_lead = ex.temperatura_lead;
    await sb.from('whatsapp_lead_qualifications').upsert(lu, { onConflict: 'conversation_id' });
    if (conv.contact_id) {
      var cu: any = {};
      if (ex.full_name_correction) cu.full_name = ex.full_name_correction;
      else if (ex.nome) cu.full_name = ex.nome;
      if (ex.email) cu.email = ex.email;
      if (ex.cpf) {
        var ccr = await sb.from('crm_contacts').select('custom_fields').eq('id', conv.contact_id).single();
        cu.custom_fields = Object.assign({}, (ccr.data && ccr.data.custom_fields) || {}, { cpf: ex.cpf });
      }
      if (Object.keys(cu).length > 0) {
        await sb.from('crm_contacts').update(cu).eq('id', conv.contact_id);
        // Also update conversation contact_name for UI consistency
        if (cu.full_name) await sb.from('whatsapp_conversations').update({ contact_name: cu.full_name }).eq('id', cid);
      }
    }
    var bcr = await sb.from('whatsapp_ai_config').select('auto_scheduling_enabled').eq('user_id', uid).maybeSingle();
    if (bcr.data && bcr.data.auto_scheduling_enabled && ex.agendamento_confirmado && ex.agendamento_confirmado.is_confirmed && ex.agendamento_confirmado.data_iso) {
      // Ensure contact exists before booking
      await ensureCRMContact(sb, conv, cid);
      var bd2 = new Date(ex.agendamento_confirmado.data_iso);
      var ed2 = new Date(bd2.getTime() + 1800000);
      var did2 = ex.agendamento_confirmado.medico_id || conv.user_id;
      var cfr = await sb.from('medical_appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', did2).neq('status', 'cancelled').lt('start_time', ed2.toISOString()).gt('end_time', bd2.toISOString());
      if (!cfr.count || cfr.count === 0) {
        var prr = await sb.from('profiles').select('organization_id').eq('id', uid).single();
        var oid = prr.data ? prr.data.organization_id : null;
        var pn = conv.contact_name || 'Paciente';
        if (conv.contact_id) {
          var ctr = await sb.from('crm_contacts').select('full_name').eq('id', conv.contact_id).single();
          if (ctr.data && ctr.data.full_name) pn = ctr.data.full_name;
        }
        var at2 = 'first_visit';
        if (conv.contact_id) {
          var pcr = await sb.from('medical_appointments').select('*', { count: 'exact', head: true }).eq('contact_id', conv.contact_id).neq('status', 'cancelled');
          if (pcr.count && pcr.count > 0) at2 = 'follow_up';
        }
        var prn = ex.agendamento_confirmado.procedimento || 'Consulta';
        var bkr = await sb.from('medical_appointments').insert({
          doctor_id: did2, contact_id: conv.contact_id, user_id: uid, organization_id: oid,
          start_time: bd2.toISOString(), end_time: ed2.toISOString(), status: 'scheduled',
          title: prn + ' - ' + pn, appointment_type: at2, duration_minutes: 30,
          notes: 'Agendado via IA (whatsapp-ai-agent)',
        });
        if (!bkr.error) {
          if (conv.contact_id) await sb.from('crm_deals').update({ stage: 'agendado' }).eq('contact_id', conv.contact_id).not('stage', 'in', '("fechado_ganho","fechado_perdido")');
          await sb.from('whatsapp_lead_qualifications').upsert({ conversation_id: cid, phone_number: conv.phone_number, status: 'agendado', data_agendamento: bd2.toISOString() }, { onConflict: 'conversation_id' });
        }
      }
    }
  } catch (_e) { /* ignore parse errors */ }
}

async function ensureCRMContact(sb: any, conv: any, cid: string): Promise<void> {
  // Check if contact_id is missing or orphaned
  var needsCreate = false;
  if (!conv.contact_id) {
    needsCreate = true;
  } else {
    var vcr = await sb.from('crm_contacts').select('id').eq('id', conv.contact_id).maybeSingle();
    if (!vcr.data) needsCreate = true;
  }
  if (!needsCreate) return;

  var prfr = await sb.from('profiles').select('organization_id').eq('id', conv.user_id).single();
  var orgId = (prfr.data && prfr.data.organization_id) ? prfr.data.organization_id : null;
  var ncr = await sb.from('crm_contacts').insert({
    user_id: conv.user_id,
    organization_id: orgId,
    full_name: conv.contact_name || conv.phone_number,
    phone: conv.phone_number,
    tags: ['whatsapp_auto'],
    lead_score: 30,
  }).select('id').single();
  if (!ncr.error && ncr.data) {
    conv.contact_id = ncr.data.id;
    await sb.from('whatsapp_conversations').update({ contact_id: ncr.data.id }).eq('id', cid);
    await sb.from('crm_deals').insert({
      user_id: conv.user_id,
      organization_id: orgId,
      contact_id: ncr.data.id,
      title: 'Oportunidade: ' + (conv.contact_name || conv.phone_number),
      stage: 'lead_novo',
      value: 0,
      description: 'Lead criado via IA - paciente demonstrou interesse em agendamento',
    });
    try { await sb.from('debug_logs').insert({ function_name: 'whatsapp-ai-agent', message: 'CRM contact created (interest)', data: { cid: cid, contactId: ncr.data.id, name: conv.contact_name } }); } catch (_e) { /* ignore */ }
  }
}

async function safeDebugLog(sb: any, msg: string, data: any): Promise<void> {
  try { await sb.from('debug_logs').insert({ function_name: 'whatsapp-ai-agent', message: msg, data: data }); } catch (_e) { /* ignore */ }
}

async function safeReleaseLock(sb: any, cid: string): Promise<void> {
  try { await sb.rpc('release_ai_lock', { p_conversation_id: cid }); } catch (_e) { /* ignore */ }
}

// =============================================
// MAIN HANDLER
// =============================================

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  var sb = createClient(SU, SK, { auth: { autoRefreshToken: false, persistSession: false } });
  var cid = '';
  try {
    var body = await req.json();
    cid = body.conversation_id || '';
    if (!cid) throw new Error('conversation_id required');

    await safeDebugLog(sb, 'Started', { cid: cid });

    // STEP 1: LOCK
    var lr = await sb.rpc('try_acquire_ai_lock', { p_conversation_id: cid, p_lock_seconds: 60 });
    if (!lr.data) return new Response(JSON.stringify({ status: 'locked' }), { status: 200, headers: CORS });

    // STEP 2: SMART DEBOUNCE
    var cr0 = await sb.from('whatsapp_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', cid).eq('direction', 'inbound');
    var lkc = cr0.count || 0;
    var lma = Date.now();
    var dbs = Date.now();
    while (Date.now() - lma < 8000) {
      if (Date.now() - dbs > 30000) break;
      await sleep(1500);
      var pr0 = await sb.from('whatsapp_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', cid).eq('direction', 'inbound');
      if ((pr0.count || 0) > lkc) { lkc = pr0.count || 0; lma = Date.now(); }
    }

    // STEP 3: LOAD CONVERSATION + CONFIG
    var cvr = await sb.from('whatsapp_conversations').select('id, contact_id, contact_name, phone_number, user_id, status, ai_autonomous_mode, phone_number_id').eq('id', cid).single();
    var conv = cvr.data;
    if (!conv) throw new Error('Conversation not found');

    var cfr = await sb.from('whatsapp_ai_config').select('*').eq('user_id', conv.user_id).maybeSingle();
    var aic = cfr.data;
    var localOn = conv.ai_autonomous_mode === true;
    var localOff = conv.ai_autonomous_mode === false;
    var globalOn = aic ? aic.auto_reply_enabled === true : false;
    if (!(localOn || (!localOff && globalOn))) {
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'auto_reply_disabled' }), { status: 200, headers: CORS });
    }

    // STEP 3b: MARK AS READ
    var wac = await getWAConfig(sb, conv.user_id);
    if (wac) {
      var lir = await sb.from('whatsapp_messages').select('message_id').eq('conversation_id', cid).eq('direction', 'inbound').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (lir.data && lir.data.message_id) {
        try {
          await fetch('https://graph.facebook.com/v18.0/' + wac.phone_number_id + '/messages', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + wac.access_token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: lir.data.message_id }),
          });
        } catch (_e) { /* ignore */ }
      }
    }

    // STEP 4: LOAD HISTORY
    var msr = await sb.from('whatsapp_messages').select('id, message_id, direction, content, message_type, sent_at').eq('conversation_id', cid).order('sent_at', { ascending: false }).limit(20);
    var msgs = msr.data || [];
    if (msgs.length === 0) throw new Error('No messages found');

    var inb: any[] = [];
    var outb: any[] = [];
    for (var mi = 0; mi < msgs.length; mi++) {
      if (msgs[mi].direction === 'inbound') inb.push(msgs[mi]);
      else outb.push(msgs[mi]);
    }
    var lim = (inb.length > 0 && inb[0].content) ? inb[0].content : '';
    var tic = inb.length;

    // STEP 5: LOAD LEAD DATA
    var ldr = await sb.from('whatsapp_lead_qualifications').select('*').eq('conversation_id', cid).maybeSingle();

    // STEP 6: DETECT PHASE
    var phr = detectPhase(tic, ldr.data, lim);

    // STEP 6a: CREATE CRM CONTACT ONLY WHEN PATIENT SHOWS INTEREST
    if (phr.phase === 'agendamento' || phr.phase === 'pos_agendamento') {
      await ensureCRMContact(sb, conv, cid);
    }

    // HANDOFF
    if (phr.phase === 'handoff') {
      var hId = buildAgentIdentity(aic);
      var hPr = buildPhasePrompt('handoff', hId);
      var hRes = await callGPT(hPr, msgs, conv);
      if (hRes && wac) {
        var hmid = inb.length > 0 ? inb[0].message_id : null;
        if (hmid) await sendTyping(wac, hmid);
        await readingDelay(lim.length);
        var hParts = postProcess(hRes);
        for (var hp = 0; hp < hParts.length; hp++) {
          if (hmid) await sendTyping(wac, hmid);
          if (hp > 0) await sleep(Math.min(Math.max(800, hParts[hp - 1].length * 25), 2000));
          await typingDelay(hParts[hp]);
          await sendWA(wac, conv.phone_number, hParts[hp], sb, cid, conv.user_id);
        }
      }
      await sb.from('whatsapp_conversations').update({ ai_autonomous_mode: false, priority: 'high', status: 'open' }).eq('id', cid);
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'handoff' }), { status: 200, headers: CORS });
    }

    // STEP 7: SCHEDULE
    var schCtx = '';
    var schRx = /disponib|agendar|agenda|horario|consulta|dia\s+\d|segunda|ter[cç]a|quarta|quinta|sexta|\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(horas|hrs|da\s*manh|da\s*tarde)/i;
    if (phr.shouldLoadSchedule || schRx.test(lim)) {
      try { schCtx = await buildScheduleContext(sb, conv.user_id); }
      catch (se) { console.error('[Agent] Sched err:', se); schCtx = '(Erro ao carregar agenda)'; }
      await safeDebugLog(sb, 'Schedule', { cid: cid, ctx: schCtx.substring(0, 2000), phase: phr.phase });
    }

    // STEP 8: RAG
    var ragCtx = '';
    if (phr.shouldLoadRAG) {
      ragCtx = await searchKB(sb, conv.user_id, lim, aic ? aic.knowledge_base : undefined);
    }

    // STEP 9: BUILD PROMPT
    var ident = buildAgentIdentity(aic);
    var sp = buildPhasePrompt(phr.phase, ident);
    var ext = '';

    if (outb.length > 0) {
      ext = ext + '\n\nINSTRUCAO OBRIGATORIA: Voce JA SE APRESENTOU nesta conversa (' + outb.length + ' msgs anteriores). NAO se apresente novamente. Comece DIRETO com a resposta.\n';
    }
    if (schCtx) {
      ext = ext + '\n\nAGENDA DE HORARIOS DISPONIVEIS:\n' + schCtx + '\n\nREGRAS DE HORARIOS (OBRIGATORIO):\n- SOMENTE ofereca horarios que aparecem EXPLICITAMENTE na lista acima.\n- Se o paciente pedir um horario que NAO esta na lista, diga que nao esta disponivel.\n- PROIBIDO deduzir que um horario esta livre. Se nao esta listado, NAO esta disponivel.\n';
    }
    if (ragCtx) {
      ext = ext + '\n\nBASE DE CONHECIMENTO:\n' + ragCtx + '\n';
    }

    // PROCEDURES
    var ptids = [conv.user_id];
    var dlr = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', conv.user_id);
    if (dlr.data && dlr.data.length > 0) {
      for (var dli = 0; dli < dlr.data.length; dli++) ptids.push(dlr.data[dli].doctor_id);
    }
    var prr2 = await sb.from('commercial_procedures').select('id, name, category, price').in('user_id', ptids).eq('is_active', true).limit(30);
    if (prr2.data && prr2.data.length > 0) {
      var pl: string[] = [];
      for (var pi2 = 0; pi2 < prr2.data.length; pi2++) {
        var p = prr2.data[pi2];
        pl.push('- ' + p.name + ' (' + (p.category || 'geral') + '): R$ ' + (p.price || 'consultar'));
      }
      ext = ext + '\n\nPROCEDIMENTOS DA CLINICA:\n' + pl.join('\n') + '\n';
    }

    // PATIENT DATA
    if (conv.contact_id) {
      var ccr2 = await sb.from('crm_contacts').select('id, full_name, email, phone').eq('id', conv.contact_id).single();
      var cc = ccr2.data;
      var par = await sb.from('medical_appointments').select('*', { count: 'exact', head: true }).eq('contact_id', conv.contact_id).neq('status', 'cancelled');
      var ifv = !par.count || par.count === 0;
      var mf: string[] = [];
      if (!cc || !cc.email) mf.push('email');
      var nw = (cc ? cc.full_name : null) || conv.contact_name || '';
      if (nw.trim().split(/\s+/).length < 2) mf.push('nome completo (sobrenome)');
      ext = ext + '\n\nDADOS DO PACIENTE NO SISTEMA:';
      ext = ext + '\n- Nome: ' + ((cc ? cc.full_name : null) || conv.contact_name || 'Nao identificado');
      ext = ext + '\n- Telefone: ' + conv.phone_number + ' (ja coletado via WhatsApp)';
      ext = ext + '\n- Email: ' + ((cc ? cc.email : null) || 'NAO INFORMADO');
      ext = ext + '\n- Tipo: ' + (ifv ? 'PRIMEIRA CONSULTA (paciente novo)' : 'Retorno (paciente ja conhecido)');
      if (mf.length > 0) {
        ext = ext + '\n\nDADOS FALTANTES PARA AGENDAMENTO: ' + mf.join(', ');
        ext = ext + '\nAntes de confirmar o agendamento, pergunte esses dados de forma NATURAL (uma pergunta por vez).';
      } else {
        ext = ext + '\n\nDADOS COMPLETOS - Pode confirmar o agendamento quando o paciente aceitar o horario.';
      }
    }

    var fsp = sp + ext;
    await safeDebugLog(sb, 'Before GPT', { cid: cid, phase: phr.phase, promptLen: fsp.length, msgCount: msgs.length });

    // STEP 10: CALL GPT
    var aiText = '';
    try {
      aiText = await callGPT(fsp, msgs, conv);
    } catch (ge) {
      console.error('[Agent] GPT failed:', ge);
      await safeDebugLog(sb, 'GPT Failed', { cid: cid, error: String(ge) });
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ error: 'GPT failed' }), { status: 200, headers: CORS });
    }

    if (!aiText) {
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'empty_response' }), { status: 200, headers: CORS });
    }

    // STEP 11: POST-PROCESS & SEND
    var parts = postProcess(aiText);
    if (wac) {
      var limid = inb.length > 0 ? inb[0].message_id : null;
      if (limid) await sendTyping(wac, limid);
      await readingDelay(lim.length);
      for (var si = 0; si < parts.length; si++) {
        if (limid) await sendTyping(wac, limid);
        if (si > 0) await sleep(Math.min(Math.max(800, parts[si - 1].length * 25), 2000));
        await typingDelay(parts[si]);
        await sendWA(wac, conv.phone_number, parts[si], sb, cid, conv.user_id);
      }
    }

    // STEP 12: BACKGROUND LEAD EXTRACTION
    extractLeadData(sb, cid, msgs, conv, conv.user_id).then(function() {}).catch(function(e: any) { console.warn('[Agent] Extract err:', e); });

    // STEP 13: UPDATE ANALYSIS
    try {
      var sm: Record<string, string> = { abertura: 'novo', triagem: 'morno', agendamento: 'quente', pos_agendamento: 'convertido', handoff: 'quente' };
      await sb.from('whatsapp_conversation_analysis').upsert({
        conversation_id: cid, user_id: conv.user_id, lead_status: sm[phr.phase] || 'novo',
        last_analyzed_at: new Date().toISOString(), message_count_analyzed: msgs.length,
        ai_model_used: 'gpt-4o (agent)', suggested_next_action: 'Fase: ' + phr.phase,
      }, { onConflict: 'conversation_id' });
    } catch (_e) { /* ignore */ }

    // STEP 14: RELEASE LOCK
    await safeReleaseLock(sb, cid);

    return new Response(JSON.stringify({ status: 'success', phase: phr.phase, parts: parts.length }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('[Agent] Error:', err);
    if (cid) {
      var cs = createClient(SU, SK);
      await safeReleaseLock(cs, cid);
      await safeDebugLog(cs, 'Error', { cid: cid, error: String(err) });
    }
    return new Response(JSON.stringify({ error: String(err) }), { status: 200, headers: CORS });
  }
}

serve(handler);
