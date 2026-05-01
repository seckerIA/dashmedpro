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

// =============================================
// FERIADOS NACIONAIS (BR) — fixos + móveis (Páscoa)
// =============================================
function easterSunday(year: number): Date {
  // Algoritmo de Gauss/Meeus
  var a = year % 19;
  var b = Math.floor(year / 100);
  var c = year % 100;
  var d = Math.floor(b / 4);
  var e = b % 4;
  var f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4);
  var k = c % 4;
  var L = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * L) / 451);
  var month = Math.floor((h + L - 7 * m + 114) / 31); // 3=Mar, 4=Apr
  var day = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function brHolidaysSet(year: number): Set<string> {
  // Retorna chave 'YYYY-MM-DD' (em horário BRT) dos feriados nacionais oficiais
  var fixed = [
    [1, 1],   // Confraternização Universal
    [4, 21],  // Tiradentes
    [5, 1],   // Dia do Trabalho
    [9, 7],   // Independência
    [10, 12], // N. Sra. Aparecida
    [11, 2],  // Finados
    [11, 15], // Proclamação da República
    [11, 20], // Consciência Negra (Lei 14.759/2023 — feriado nacional desde 2024)
    [12, 25], // Natal
  ];
  var s = new Set<string>();
  for (var i = 0; i < fixed.length; i++) {
    var mo = fixed[i][0].toString().padStart(2, '0');
    var dy = fixed[i][1].toString().padStart(2, '0');
    s.add(year + '-' + mo + '-' + dy);
  }
  // Móveis baseados na Páscoa
  var easter = easterSunday(year);
  var carnavalTue = new Date(easter.getTime() - 47 * 86400000);
  var carnavalMon = new Date(easter.getTime() - 48 * 86400000); // ponto facultativo, mas tratamos como feriado prático
  var goodFriday = new Date(easter.getTime() - 2 * 86400000);
  var corpusChristi = new Date(easter.getTime() + 60 * 86400000);
  var addUTC = function (d: Date) {
    var mo = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    var dy = d.getUTCDate().toString().padStart(2, '0');
    s.add(d.getUTCFullYear() + '-' + mo + '-' + dy);
  };
  addUTC(carnavalMon);
  addUTC(carnavalTue);
  addUTC(goodFriday);
  addUTC(corpusChristi);
  return s;
}

function isHolidayBR(d: Date): { holiday: boolean; key: string } {
  // d é UTC; convertemos para o dia em BRT (UTC-3)
  var brt = new Date(d.getTime() + (-3 * 60 * 60 * 1000));
  var year = brt.getUTCFullYear();
  var mo = (brt.getUTCMonth() + 1).toString().padStart(2, '0');
  var dy = brt.getUTCDate().toString().padStart(2, '0');
  var key = year + '-' + mo + '-' + dy;
  return { holiday: brHolidaysSet(year).has(key), key: key };
}

function buildAgentIdentity(c: any): any {
  const nonEmpty = (v: any, fallback: string) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : fallback);
  const optional = (v: any) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);
  return {
    agent_name: nonEmpty(c?.agent_name, 'Sofia'),
    clinic_name: nonEmpty(c?.clinic_name, 'nossa clinica'),
    specialist_name: nonEmpty(c?.specialist_name, 'nossa equipe'),
    agent_greeting: optional(c?.agent_greeting),
    knowledge_base: optional(c?.knowledge_base),
    custom_prompt_instructions: optional(c?.custom_prompt_instructions),
    already_known_info: optional(c?.already_known_info),
    doctor_info: optional(c?.doctor_info),
    pre_investment_videos: optional(c?.pre_investment_videos),
  };
}

/** Preenche knowledge_base e blocos do prompt com a config do médico quando o dono da conversa (ex.: secretária) não tem texto no banco. */
async function resolveConfigForPrompts(sb: any, conv: any, aic: any): Promise<any> {
  if (aic && typeof aic.knowledge_base === 'string' && aic.knowledge_base.trim().length > 0) return aic;
  var lr = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', conv.user_id).eq('is_active', true).limit(1).maybeSingle();
  var doctorId = lr.data ? lr.data.doctor_id : null;
  var dr: any = null;
  if (doctorId) {
    var drr = await sb.from('whatsapp_ai_config').select('*').eq('user_id', doctorId).maybeSingle();
    dr = drr.data;
  }
  if (!dr) return aic;
  if (!aic) return dr;
  var merged = Object.assign({}, dr, aic);
  var fillKeys = ['knowledge_base', 'doctor_info', 'custom_prompt_instructions', 'already_known_info', 'agent_greeting', 'pre_investment_videos', 'clinic_name', 'specialist_name', 'agent_name'];
  for (var fi = 0; fi < fillKeys.length; fi++) {
    var k = fillKeys[fi];
    var av = aic[k];
    if ((typeof av !== 'string' || !String(av).trim()) && dr[k] != null) merged[k] = dr[k];
  }
  return merged;
}

function agendaListHasSlots(schCtx: string): boolean {
  return /\d{1,2}:\d{2}/.test(schCtx || '');
}

function patientMessageSuggestsBooking(lim: string): boolean {
  return /disponib|agendar|agenda|hor[aá]rio|consulta|marcar|vaga|dias?\s+diferentes|essa\s+semana|site\b/i.test(lim || '');
}

function modelInventsAvailabilityWhenNoSlots(text: string): boolean {
  var t = (text || '').toLowerCase();
  if (/sem\s+vagas|n[aã]o\s+(apareceu|tem)\s+(vaga|hor[aá]rio)|agenda\s+n[aã]o\s+mostrou|sem\s+hor[aá]rio\s+livre|n[aã]o\s+apareceu\s+nenhum/i.test(t)) return false;
  return /temos\s+(hor[aá]rios|vagas)|(hor[aá]rios|vagas)\s+dispon|[ée]ssa\s+semana|nesta\s+semana|ainda\s+essa\s+semana|prefere\s+.*(segunda|ter[cç]a|quarta|quinta|sexta)/i.test(text || '');
}

function modelOffersDaysWithoutTimes(text: string, schHasSlots: boolean): boolean {
  if (!schHasSlots) return false;
  if (/\d{1,2}:\d{2}/.test(text || '')) return false;
  return /\b(segunda|ter[cç]a-feira|ter[cç]a|quarta|quinta|sexta|s[aá]bado)\b/i.test(text || '');
}

var FALLBACK_NO_AGENDA_SLOTS = 'Consultei a agenda no sistema e não apareceu horário livre nos próximos dias. [SPLIT] Posso te encaminhar pro time da clínica pra confirmarem certinho, ou você me diz se prefere manhã ou tarde em geral?';

/** Detecta despedida pura ("obrigado", "tchau", "ate mais", "valeu") sem outras perguntas. */
function patientFarewell(text: string): boolean {
  var t = (text || '').trim().toLowerCase();
  if (t.length === 0) return false;
  // Se tem '?' ou pede algo, nao e so despedida
  if (/\?/.test(t)) return false;
  // Frase muito longa raramente e despedida pura
  if (t.length > 60) return false;
  return /^(\s*(muit[oa]\s+)?obrigad[oa]|\s*valeu|\s*vlw|\s*tchau|\s*at[eé]\s+(mais|logo|breve|j[áa])|\s*abra[çc]o|\s*abs|\s*beij[oa]s?|\s*bj[s]?|\s*ok\s*$|\s*okay\s*$|\s*beleza\s*$|\s*blz\s*$|\s*combinado\s*$|\s*perfeito\s*$|\s*entendi\s*$|\s*bom\s+(dia|tarde|noite)|\s*boa\s+(tarde|noite)|\s*bom\s+fim\s+de\s+semana)[\s.!,👍🙏❤️😊🤗👋✨🌟💕]*$/i.test(t);
}

/** Detecta sinal de desengajamento: "vou pensar", "te chamo depois", "agendo em breve", "nao posso agora". */
function patientDisengaging(text: string): boolean {
  var t = (text || '').toLowerCase();
  if (t.length === 0) return false;
  return /(\bn[aã]o\s+(quero|posso|tenho|consigo|vou)\s+(agora|no\s+momento|hoje|por\s+enquanto)\b|\bn[aã]o\s+pode\s+ser\s+agora\b|\bsem\s+condi[cç][oõ]es\s+(agora|no\s+momento)\b|\b(esta|t[áa])\s+fora\s+do\s+(meu\s+)?or[cç]amento\b|\bfora\s+do\s+or[cç]amento\b|\bn[aã]o\s+cabe\s+no\s+(meu\s+)?or[cç]amento\b|\bn[aã]o\s+tenho\s+(esse\s+)?(dinheiro|valor|grana)\b|\bsem\s+grana\b|\bmuito\s+(caro|salgado|alto)\b|\b[eé]\s+caro\b|\bt[áa]\s+caro\b|\bca[ií]ssimo\b|\bn[aã]o\s+(cabe|d[áa])\s+no\s+momento\b|\bdepois\s+(eu\s+)?(volto|falo|chamo|aviso|entro\s+em\s+contato|retorno|te\s+chamo|te\s+falo)\b|\bentrarei\s+em\s+contato\b|\bt[ee]\s+aviso\b|\bt[ee]\s+chamo\s+(depois|mais\s+tarde|amanh[aã])\b|\bvou\s+(pensar|ver|conversar\s+com|me\s+organizar|analisar|avaliar)\b|\bfica\s+pra\s+(depois|outro\s+dia|semana\s+que\s+vem|mais\s+tarde)\b|\bqualquer\s+coisa\s+(eu\s+)?(falo|chamo|retorno|aviso)\b|\bagend[oa]\s+(em\s+breve|outra\s+hora|depois|mais\s+tarde|amanh[aã])\b|\bligo\s+(em\s+breve|depois|mais\s+tarde|amanh[aã])\b|\bvolto\s+(a\s+)?(falar|te\s+falar|te\s+chamar)\b|\bpreciso\s+(me\s+organizar|ver\s+com|conversar\s+com|pensar)\b|\bdeixa\s+eu\s+(pensar|ver)\b|\bqd\s+(eu\s+)?(puder|tiver\s+tempo)\b|\bquando\s+(eu\s+)?(puder|tiver\s+tempo|me\s+organizar)\b)/i.test(t);
}

/** Paciente indica que ja recebeu o material e nao quer repeticao (evita 2o bloco de depoimentos). */
function patientRejectRepeatContent(text: string): boolean {
  var t = (text || '').toLowerCase();
  return /j[aá]\s+(vi|assist(iu)?|recebi)|voc[eê]\s+j[aá]\s+(mandou|enviou)|j[aá]\s+me\s+enviou|de\s+novo\s+n[aã]o|n[aã]o\s+(precisa|preciso)\s+mandar\s+de\s+novo|voc[eê]\s+repetiu|(\b|^)eu\s+vi\s+voce\b/i.test(t);
}

/** Verifica se a ultima mensagem nossa ja foi um fechamento educado — pra nao mandar outro "imagina!" em loop. */
function lastOutboundIsClosing(content: string): boolean {
  var t = (content || '').toLowerCase();
  if (t.length === 0) return false;
  return /(qualquer\s+(d[uú]vida|coisa)\s+(me\s+)?(chama|fala|avisa)|estou\s+aqui|estamos\s+aqui|fico\s+(aqui|por\s+aqui|a\s+disposi[cç][aã]o)|t[oô]\s+por\s+aqui|cuide-?se|abra[çc]o|at[eé]\s+(j[áa]|breve|mais|logo)|imagina|fico\s+feliz|bom\s+te\s+conhecer|tranquil[oa]|sem\s+problema|combinado|t[ée]\s+(aguardo|espero)\s+(quando|qd))/i.test(t);
}

/** Emergência: não aplicar atraso humanizado. */
function emergencySkipDelay(text: string): boolean {
  var t = (text || '').toLowerCase();
  return /emerg[eê]ncia|urgente|urg[eê]ncia|samu|\bupa\b|pronto.?socorro|socorro|sangr|desmai|acidente|infarto|convuls[aã]o|n[aã]o consigo respirar|falta de ar/i.test(t);
}

/**
 * Atraso aleatório entre min e max (segundos) configurável em whatsapp_ai_config.
 *
 * IMPORTANTE: Supabase Edge Functions tem wall-clock máximo (~150s). Se o sleep
 * ultrapassar esse limite a função morre antes de gerar/enviar a resposta e o
 * lock fica preso por minutos, bloqueando inbound subsequente. Por isso aplicamos
 * um cap rígido em 110s (margem segura) sobre min/max — ainda preserva o "ar
 * humano" sem comprometer a entrega.
 */
var AI_DELAY_HARD_CAP_S = 110;

function computeHumanReplyDelayMs(aic: any): number {
  var minS = 30;
  var maxS = 90;
  if (aic) {
    if (typeof aic.ai_reply_delay_min_seconds === 'number' && !isNaN(aic.ai_reply_delay_min_seconds)) {
      minS = Math.max(0, Math.floor(aic.ai_reply_delay_min_seconds));
    }
    if (typeof aic.ai_reply_delay_max_seconds === 'number' && !isNaN(aic.ai_reply_delay_max_seconds)) {
      maxS = Math.max(0, Math.floor(aic.ai_reply_delay_max_seconds));
    }
  }
  if (minS > AI_DELAY_HARD_CAP_S) minS = AI_DELAY_HARD_CAP_S;
  if (maxS > AI_DELAY_HARD_CAP_S) maxS = AI_DELAY_HARD_CAP_S;
  if (maxS < minS) {
    var tmp = minS;
    minS = maxS;
    maxS = tmp;
  }
  var span = maxS - minS;
  var jitter = span <= 0 ? 0 : Math.floor(Math.random() * (span + 1));
  return (minS + jitter) * 1000;
}

var WA_CFG_COLS = 'phone_number_id, access_token, provider, evolution_instance_name, evolution_instance_token, evolution_api_url';

/**
 * Baixa um arquivo HTTP e devolve em base64 (raw, sem prefixo data:).
 * Usado para enviar videos como MP4 nativo no Evolution/WhatsApp em vez
 * de "link clicavel" — assim o cliente WhatsApp renderiza o player de video
 * e nao um preview de URL.
 */
async function fetchAsBase64(url: string): Promise<{ base64: string; mimeType: string; bytes: number } | null> {
  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    var mimeType = res.headers.get('content-type') || 'video/mp4';
    var buf = await res.arrayBuffer();
    var bytes = new Uint8Array(buf);
    var binary = '';
    var chunkSize = 0x8000;
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(slice) as any);
    }
    return { base64: btoa(binary), mimeType: mimeType, bytes: bytes.length };
  } catch (_e) {
    return null;
  }
}

async function getWAConfig(sb: any, uid: string): Promise<any> {
  var r = await sb.from('whatsapp_config').select(WA_CFG_COLS).eq('user_id', uid).eq('is_active', true).maybeSingle();
  if (r.data) return r.data;
  var r2 = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', uid).eq('is_active', true);
  if (r2.data && r2.data.length > 0) {
    var ids: string[] = [];
    for (var i = 0; i < r2.data.length; i++) ids.push(r2.data[i].doctor_id);
    var r3 = await sb.from('whatsapp_config').select(WA_CFG_COLS).in('user_id', ids).eq('is_active', true).limit(1).maybeSingle();
    if (r3.data) return r3.data;
  }
  var r4 = await sb.from('whatsapp_config').select(WA_CFG_COLS).eq('is_active', true).limit(1).maybeSingle();
  return r4.data;
}

async function callGPT(sys: string, msgs: any[], conv: any, temperature?: number): Promise<string> {
  var bt = new Date(Date.now() + BRO).toISOString().replace('T', ' ').substring(0, 16);
  var rev = msgs.slice().reverse();
  var lines: string[] = [];
  for (var i = 0; i < rev.length; i++) {
    var prefix = rev[i].direction === 'inbound' ? 'PACIENTE' : 'CLINICA';
    lines.push(prefix + ': ' + (rev[i].content || '[midia]'));
  }
  var mc = lines.join('\n');
  var up = 'DATA E HORA ATUAL: ' + bt + ' (Horario de Brasilia)\n\nCONVERSA ATUAL:\n' + mc + '\n\nPACIENTE: ' + (conv.contact_name || 'Nome nao identificado') + '\nTELEFONE: ' + conv.phone_number + '\n\nOBRIGATORIO: Cada fato na sua resposta deve estar no system prompt (blocos do banco) ou na AGENDA com HH:MM. Proibido inventar. Responda como a assistente. Use [SPLIT] para mensagens curtas.';
  var temp = typeof temperature === 'number' && !isNaN(temperature) ? temperature : 0.2;
  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + OAI, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: sys }, { role: 'user', content: up }], temperature: temp, max_tokens: 500 }),
  });
  if (!res.ok) {
    var errData = await res.json();
    throw new Error('OpenAI: ' + (errData.error?.message || 'Unknown'));
  }
  var d = await res.json();
  return (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content : '';
}

function stripWrappingQuotes(s: string): string {
  // Remove aspas envolventes (", ", ', ', `, ', ') que o GPT às vezes deixa nos exemplos do prompt
  var t = s.trim();
  // loop até estabilizar (caso tenha ""texto"")
  for (var i = 0; i < 3; i++) {
    var m = t.match(/^["'`\u201C\u201D\u2018\u2019]+(.*?)["'`\u201C\u201D\u2018\u2019]+$/s);
    if (!m) break;
    t = m[1].trim();
  }
  return t;
}

/**
 * Sanitizacao de texto antes de partir em mensagens:
 *  - Remove URLs do bucket "whatsapp-media" coladas pelo GPT (videos sao enviados
 *    via API, nao como link cru no texto — caso Sandra/Joao Paulo).
 *  - Remove placeholders "[Video de depoimento]" / "[Audio]" / "[Imagem]".
 */
function sanitizeAIText(text: string): string {
  if (!text) return '';
  var t = text;
  t = t.replace(/https?:\/\/[^\s<>"']*\/storage\/v1\/object\/public\/whatsapp-(?:media|testimonials)\/[^\s<>"']+/gi, '');
  t = t.replace(/\[\s*(?:v[ií]deo(?:\s+de\s+depoimento)?|video[\s-]?testemunho|audio|imagem|foto|file|midia|media)\s*\]/gi, '');
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Split inteligente em sentencas que NAO quebra em abreviacoes comuns
 * ("Av.", "Dr.", "Sra.", "Ex.", iniciais). Evita o caso real de
 * "A clinica do Dr. Rafael..." sair em 2 baloes ("...do Dr." | "Rafael...").
 */
function splitIntoSentences(text: string): string[] {
  var ABREV = /(?:av|dr|dra|sr|sra|sras|drs|prof|profa|exmo|exma|ex|n|no|p|pg|pag|fl|cap|art|ed|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|seg|ter|qua|qui|sex|sab|dom|tel|cel|cep|ltda|s\.?\s*a)$/i;
  var out: string[] = [];
  var current = '';
  var i = 0;
  while (i < text.length) {
    current += text[i];
    if (/[.!?]/.test(text[i])) {
      var rest = text.substring(i + 1);
      var nextChar = rest.match(/^\s+/);
      if (nextChar && nextChar[0].length > 0) {
        var lookbackMatch = current.match(/(\S+)$/);
        var lastToken = lookbackMatch ? lookbackMatch[1].replace(/[.!?]+$/, '') : '';
        var followsCapital = /^\s+["'(]?[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(rest);
        var prevIsAbbrev = ABREV.test(lastToken) || /^[A-Z]$/.test(lastToken);
        if (followsCapital && !prevIsAbbrev) {
          out.push(current.trim());
          current = '';
          i += 1 + nextChar[0].length;
          continue;
        }
      }
    }
    i++;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

var MAX_PARTS_PER_TURN = 3;

function postProcess(text: string): string[] {
  var cleaned = text.replace(/^(Sofia|Jessica|Assistente|IA|Bot|Atendente|Secretaria|Secretária)\s*:\s*/gim, '').trim();
  cleaned = sanitizeAIText(cleaned);
  cleaned = stripWrappingQuotes(cleaned);
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
    var t = stripWrappingQuotes(rawParts[i]).trim();
    if (t.length > 0) trimmed.push(t);
  }
  var finalParts: string[] = [];
  for (var j = 0; j < trimmed.length; j++) {
    var part = trimmed[j];
    if (part.length <= 160) {
      finalParts.push(part);
      continue;
    }
    var sentences = splitIntoSentences(part);
    var current = '';
    for (var k = 0; k < sentences.length; k++) {
      var combined = current ? current + ' ' + sentences[k] : sentences[k];
      if (combined.length > 160 && current) {
        finalParts.push(current.trim());
        current = sentences[k];
      } else {
        current = combined;
      }
    }
    if (current.trim()) finalParts.push(current.trim());
  }
  if (finalParts.length === 0) finalParts.push(cleaned || 'Ola! Como posso te ajudar?');
  if (finalParts.length > MAX_PARTS_PER_TURN) {
    var head = finalParts.slice(0, MAX_PARTS_PER_TURN - 1);
    var tail = finalParts.slice(MAX_PARTS_PER_TURN - 1).join(' ').trim();
    if (tail) head.push(tail);
    finalParts = head;
  }
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
  // Marca a mensagem como lida (Meta only — funciona como "visto" mas nao mostra typing).
  if (cfg.provider !== 'evolution') {
    try {
      await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: mid }),
      });
    } catch (_e) { /* ignore */ }
  }
}

// Envia status de presenca ("digitando...", "gravando audio/video...", "online", "parado").
// Evolution API v2: POST /chat/sendPresence/{instance}
// presence: composing | recording | available | paused | unavailable
async function sendPresence(cfg: any, to: string, presence: 'composing' | 'recording' | 'paused' | 'available', durationMs: number = 4000): Promise<void> {
  try {
    if (cfg.provider === 'evolution') {
      var evoKey = cfg.evolution_instance_token && cfg.evolution_instance_token.length > 0
        ? cfg.evolution_instance_token
        : (Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '');
      var cleanNumber = to.replace('+', '').trim();
      await fetch(cfg.evolution_api_url.replace(/\/+$/, '') + '/chat/sendPresence/' + cfg.evolution_instance_name, {
        method: 'POST',
        headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: cleanNumber,
          presence: presence,
          delay: durationMs,
        }),
      });
      return;
    }
    // Meta API: ainda nao oferece endpoint publico de typing indicator (apenas "read").
    // Nao precisamos fazer nada aqui; quando ela liberar, expandimos.
  } catch (_e) { /* ignore presence errors silently */ }
}

// Helper: dispara typing repetidamente em background ate o controlador parar.
// Evolution mantem o status por durationMs, entao re-enviamos a cada 3s pra continuar visivel.
function startTypingHeartbeat(cfg: any, to: string, presence: 'composing' | 'recording' = 'composing') {
  var stopped = false;
  (async function loop() {
    while (!stopped) {
      try { await sendPresence(cfg, to, presence, 4000); } catch (_e) { /* ignore */ }
      // intervalo curto pra renovar o status (Evolution emite stop apos delay)
      for (var t = 0; t < 30 && !stopped; t++) await sleep(100);
    }
  })();
  return function stop() {
    stopped = true;
    // Sinaliza fim explicito da digitacao (opcional — alguns clients nao mostram)
    sendPresence(cfg, to, 'paused', 500).catch(function() {});
  };
}

async function sendVideoWA(cfg: any, to: string, videoUrl: string, caption: string, sb: any, cid: string, uid: string): Promise<boolean> {
  var prov = cfg.provider || 'meta';
  var ir = await sb.from('whatsapp_messages').insert({
    user_id: uid, conversation_id: cid, phone_number: to,
    content: caption || '[Vídeo de depoimento]', direction: 'outbound',
    message_type: 'video', status: 'pending', sent_at: new Date().toISOString(),
    provider: prov,
    metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-ai-agent', testimonial: true, media_url: videoUrl },
  }).select('id').single();
  var sm = ir.data;
  try {
    var wr: Response;
    if (prov === 'evolution') {
      var evoKey = cfg.evolution_instance_token && cfg.evolution_instance_token.length > 0
        ? cfg.evolution_instance_token
        : (Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '');
      var cleanNumber = to.replace('+', '').trim();
      // Baixa o video e envia como base64 (MP4 nativo) — garante que o WhatsApp
      // renderize o player de video em vez de um preview de URL/link.
      var dlV = await fetchAsBase64(videoUrl);
      var mediaPayloadV: string = dlV ? dlV.base64 : videoUrl;
      var mimeV: string = (dlV && dlV.mimeType) || 'video/mp4';
      await safeDebugLog(sb, 'sendVideoWA media prep', {
        cid, mode: dlV ? 'base64' : 'url-fallback', bytes: dlV ? dlV.bytes : null, mime: mimeV,
      });
      // Evolution API v2 espera mediatype/media/caption NO NÍVEL RAIZ.
      // Mantemos mediaMessage como fallback para versões antigas.
      wr = await fetch(cfg.evolution_api_url.replace(/\/+$/, '') + '/message/sendMedia/' + cfg.evolution_instance_name, {
        method: 'POST',
        headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: cleanNumber,
          mediatype: 'video',
          media: mediaPayloadV,
          caption: caption || '',
          mimetype: mimeV,
          delay: 1500,
          mediaMessage: { mediatype: 'video', media: mediaPayloadV, caption: caption || '' },
          options: { delay: 1500 },
        }),
      });
    } else {
      wr = await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'video', video: { link: videoUrl, caption: caption || '' } }),
      });
    }
    var rawBody = '';
    try { rawBody = await wr.text(); } catch (_e) { rawBody = ''; }
    var wd: any = null;
    try { wd = rawBody ? JSON.parse(rawBody) : null; } catch (_e) { wd = null; }
    await safeDebugLog(sb, 'sendVideoWA response', { cid, provider: prov, httpStatus: wr.status, ok: wr.ok, bodyPreview: rawBody.substring(0, 400) });
    if (!sm) return wr.ok;
    if (!wr.ok) {
      await sb.from('whatsapp_messages').update({
        status: 'failed',
        error_message: (wd && (wd.message || wd.error)) || ('HTTP ' + wr.status + ': ' + rawBody.substring(0, 200)),
      }).eq('id', sm.id);
      return false;
    }
    var wid: string | null = null;
    if (prov === 'evolution' && wd) {
      wid = (wd.key && wd.key.id) || wd.id || wd.messageId || (wd.data && wd.data.id) || null;
    } else if (wd) {
      wid = (wd.messages && wd.messages[0] && wd.messages[0].id) || null;
    }
    await sb.from('whatsapp_messages').update({ status: 'sent', message_id: wid, sent_at: new Date().toISOString() }).eq('id', sm.id);
    return true;
  } catch (e) {
    console.error('[Agent] Send video error:', e);
    await safeDebugLog(sb, 'sendVideoWA exception', { cid, error: String(e) });
    if (sm) await sb.from('whatsapp_messages').update({ status: 'failed', error_message: String(e) }).eq('id', sm.id);
    return false;
  }
}

async function getTestimonialVideoUrls(sb: any, uid: string): Promise<{ url: string; caption: string | null }[]> {
  // Pega vídeos ativos do médico (e dos médicos linkados, no caso de secretárias)
  var ids: string[] = [uid];
  var lr = await sb.from('secretary_doctor_links').select('doctor_id').eq('secretary_id', uid).eq('is_active', true);
  if (lr.data && lr.data.length > 0) for (var i = 0; i < lr.data.length; i++) ids.push(lr.data[i].doctor_id);
  var vr = await sb.from('whatsapp_testimonial_videos').select('storage_path, caption, display_order, mime_type').in('user_id', ids).eq('is_active', true).order('display_order', { ascending: true }).limit(3);
  if (!vr.data || vr.data.length === 0) return [];
  var SUPABASE_URL_BASE = Deno.env.get('SUPABASE_URL') || '';
  var out: { url: string; caption: string | null }[] = [];
  for (var v = 0; v < vr.data.length; v++) {
    var sp = vr.data[v].storage_path as string;
    if (!sp) continue;
    // Normaliza: aceita 'bucket/file' ou só 'file' (assume whatsapp-media)
    var bucket = 'whatsapp-media';
    var pathInBucket = sp;
    if (sp.indexOf('/') !== -1) {
      var firstSlash = sp.indexOf('/');
      var maybeBucket = sp.substring(0, firstSlash);
      // Se começar com bucket conhecido, separe
      if (maybeBucket === 'whatsapp-media' || maybeBucket === 'whatsapp-testimonials') {
        bucket = maybeBucket;
        pathInBucket = sp.substring(firstSlash + 1);
      }
    }
    var publicUrl = SUPABASE_URL_BASE + '/storage/v1/object/public/' + bucket + '/' + pathInBucket;
    out.push({ url: publicUrl, caption: vr.data[v].caption || null });
  }
  return out;
}

/**
 * GATE de envio do bloco "valor antes do investimento" (3 vídeos de depoimento).
 *
 * REGRAS DE OURO (todas precisam ser TRUE para disparar):
 *  1. Vídeos ainda nao foram enviados nesta conversa.
 *  2. Estamos em triagem ou agendamento (nunca em abertura).
 *  3. Paciente ja teve pelo menos 2 turnos (>= 2 inbounds), pra garantir que ele
 *     nao recebeu o pitch logo apos um simples "oi"/"boa tarde".
 *  4. A IA ja teve pelo menos 1 outbound de qualificacao (apresentacao+pergunta).
 *  5. O paciente verbalizou queixa CLINICA explicita em qualquer mensagem da
 *     historia inbound (nao basta um "consulta") OU `lead.procedimento_desejado`
 *     ja foi extraido com algo especifico (nao "consulta" generica).
 *  6. Paciente nao esta se despedindo nem desengajando agora.
 *
 * Casos reais que essa regra fecha:
 *  - Jessica Carvalho ("oii"+"boa tarde" -> pitch imediato): bloqueado por (3) e (5).
 *  - Sandra perguntando "Sera q doi mt?" depois de ja ter recebido pitch: bloqueado por (1).
 *  - Joao Paulo ja recebeu pitch, depois pergunta valor e recebe pitch DE NOVO: bloqueado por (1).
 */
function shouldSendTestimonialNow(
  phase: string,
  lim: string,
  leadData: any,
  outboundCount: number,
  videosAlreadySent: boolean,
  inboundCount: number,
  inboundHistory: string,
): boolean {
  if (videosAlreadySent) return false;
  if (phase !== 'triagem' && phase !== 'agendamento') return false;

  if (inboundCount < 2) return false;
  if (outboundCount < 1) return false;

  if (patientFarewell(lim) || patientDisengaging(lim)) return false;
  if (patientRejectRepeatContent(lim) || patientRejectRepeatContent(inboundHistory || '')) return false;

  var painRegex = /\b(dor|d[oó]i|trava|pesad|incomod|machucad|les[aã]o|artrose|artrite|tendin|bursit|fasc[ií]te|joelho|ombro|coluna|cervic|lombar|quadril|tornozelo|punho|cotovelo|coxa|nervo|h[eé]rnia|protese|infiltra[cç][aã]o|cisto|menisc|ligament|cirurgia|fisioterapia|inflama)\b/i;
  var historyHasPain = painRegex.test(inboundHistory || '');

  var procStr = (leadData && typeof leadData.procedimento_desejado === 'string')
    ? leadData.procedimento_desejado.toLowerCase().trim()
    : '';
  var procIsSpecific = procStr.length > 0 && procStr !== 'consulta' && procStr !== 'avaliacao' && procStr !== 'avaliação';

  if (!historyHasPain && !procIsSpecific) return false;
  return true;
}

async function sendWA(cfg: any, to: string, text: string, sb: any, cid: string, uid: string): Promise<void> {
  var prov = cfg.provider || 'meta';
  var ir = await sb.from('whatsapp_messages').insert({
    user_id: uid, conversation_id: cid, phone_number: to, content: text, direction: 'outbound',
    message_type: 'text', status: 'pending', sent_at: new Date().toISOString(),
    provider: prov,
    metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-ai-agent' },
  }).select('id').single();
  var sm = ir.data;
  try {
    var wr: Response;
      if (prov === 'evolution') {
      var evoKey = cfg.evolution_instance_token && cfg.evolution_instance_token.length > 0
        ? cfg.evolution_instance_token
        : (Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '');
      var cleanNumber = to.replace('+', '').trim();
      wr = await fetch(cfg.evolution_api_url.replace(/\/+$/, '') + '/message/sendText/' + cfg.evolution_instance_name, {
        method: 'POST',
        headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanNumber, textMessage: { text: text }, text: text, options: { delay: 1200, presence: 'composing' } }),
      });
    } else {
      wr = await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'text', text: { body: text } }),
      });
    }
    var rawBody = '';
    try { rawBody = await wr.text(); } catch (_e) { rawBody = ''; }
    var wd: any = null;
    try { wd = rawBody ? JSON.parse(rawBody) : null; } catch (_e) { wd = null; }

    await safeDebugLog(sb, 'sendWA response', {
      cid, provider: prov, httpStatus: wr.status, ok: wr.ok, bodyPreview: rawBody.substring(0, 400),
    });

    if (!sm) return;

    if (!wr.ok) {
      await sb.from('whatsapp_messages').update({
        status: 'failed',
        error_message: (wd && (wd.message || wd.error)) || ('HTTP ' + wr.status + ': ' + rawBody.substring(0, 200)),
      }).eq('id', sm.id);
      return;
    }

    // 200 OK — try to extract provider message id; if not found, still mark as sent
    var wid: string | null = null;
    if (prov === 'evolution' && wd) {
      wid = (wd.key && wd.key.id) || wd.id || wd.messageId || (wd.data && wd.data.id) || null;
    } else if (wd) {
      wid = (wd.messages && wd.messages[0] && wd.messages[0].id) || null;
    }
    await sb.from('whatsapp_messages').update({
      status: 'sent',
      message_id: wid,
      sent_at: new Date().toISOString(),
    }).eq('id', sm.id);
  } catch (e) {
    console.error('[Agent] Send error:', e);
    await safeDebugLog(sb, 'sendWA exception', { cid, error: String(e) });
    if (sm) await sb.from('whatsapp_messages').update({ status: 'failed', error_message: String(e) }).eq('id', sm.id);
  }
}

async function sendWAVideo(cfg: any, to: string, mediaUrl: string, caption: string | undefined, sb: any, cid: string, uid: string): Promise<void> {
  var prov = cfg.provider || 'meta';
  var ir = await sb.from('whatsapp_messages').insert({
    user_id: uid, conversation_id: cid, phone_number: to, content: caption || '[Vídeo]', direction: 'outbound',
    message_type: 'video', status: 'pending', sent_at: new Date().toISOString(),
    provider: prov,
    metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-ai-agent', pre_investment_video: true },
  }).select('id').single();
  var sm = ir.data;
  if (!sm) return;

  await sb.from('whatsapp_media').insert({
    message_id: sm.id,
    media_type: 'video',
    media_url: mediaUrl,
    file_name: 'pre-investment-video.mp4',
    media_mime_type: 'video/mp4',
  });

  try {
    var wr: Response;
    if (prov === 'evolution') {
      var evoKey = cfg.evolution_instance_token && cfg.evolution_instance_token.length > 0
        ? cfg.evolution_instance_token
        : (Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '');
      var cleanNumber = to.replace('+', '').trim();
      // Baixa o video e envia como base64 (MP4 nativo) — mesmo motivo de
      // sendVideoWA: garantir player de video no WhatsApp em vez de link.
      var dlPV = await fetchAsBase64(mediaUrl);
      var mediaPayloadPV: string = dlPV ? dlPV.base64 : mediaUrl;
      var mimePV: string = (dlPV && dlPV.mimeType) || 'video/mp4';
      await safeDebugLog(sb, 'sendWAVideo media prep', {
        cid, mode: dlPV ? 'base64' : 'url-fallback', bytes: dlPV ? dlPV.bytes : null, mime: mimePV,
      });
      wr = await fetch(cfg.evolution_api_url.replace(/\/+$/, '') + '/message/sendMedia/' + cfg.evolution_instance_name, {
        method: 'POST',
        headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: cleanNumber,
          mediatype: 'video',
          media: mediaPayloadPV,
          caption: caption || '',
          mimetype: mimePV,
          delay: 1200,
          mediaMessage: { mediatype: 'video', media: mediaPayloadPV, caption: caption || '' },
          options: { delay: 1200 },
        }),
      });
    } else {
      wr = await fetch('https://graph.facebook.com/v18.0/' + cfg.phone_number_id + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'video',
          video: {
            link: mediaUrl,
            caption: caption || '',
          },
        }),
      });
    }

    var rawBody = '';
    try { rawBody = await wr.text(); } catch (_e) { rawBody = ''; }
    var wd: any = null;
    try { wd = rawBody ? JSON.parse(rawBody) : null; } catch (_e) { wd = null; }

    await safeDebugLog(sb, 'sendWAVideo response', {
      cid, provider: prov, httpStatus: wr.status, ok: wr.ok, bodyPreview: rawBody.substring(0, 400),
    });

    if (!wr.ok) {
      await sb.from('whatsapp_messages').update({
        status: 'failed',
        error_message: (wd && (wd.message || wd.error)) || ('HTTP ' + wr.status + ': ' + rawBody.substring(0, 200)),
      }).eq('id', sm.id);
      return;
    }

    var wid: string | null = null;
    if (prov === 'evolution' && wd) {
      wid = (wd.key && wd.key.id) || wd.id || wd.messageId || (wd.data && wd.data.id) || null;
    } else if (wd) {
      wid = (wd.messages && wd.messages[0] && wd.messages[0].id) || null;
    }
    await sb.from('whatsapp_messages').update({
      status: 'sent',
      message_id: wid,
      sent_at: new Date().toISOString(),
    }).eq('id', sm.id);
  } catch (e) {
    console.error('[Agent] Send video error:', e);
    await safeDebugLog(sb, 'sendWAVideo exception', { cid, error: String(e) });
    await sb.from('whatsapp_messages').update({ status: 'failed', error_message: String(e) }).eq('id', sm.id);
  }
}

function parseVideoUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  var lines = raw.split('\n');
  var urls: string[] = [];
  for (var i = 0; i < lines.length; i++) {
    var u = lines[i].trim();
    if (!u) continue;
    if (/^https?:\/\//i.test(u)) urls.push(u);
  }
  var unique: string[] = [];
  for (var j = 0; j < urls.length; j++) {
    if (unique.indexOf(urls[j]) === -1) unique.push(urls[j]);
  }
  return unique;
}

function isInvestmentQuestion(text: string): boolean {
  return /(pre[cç]o|valor|investimento|quanto\s+(custa|fica)|condi[cç][oõ]es|parcel|pagamento)/i.test(text || '');
}

async function hasSentAnyVideoFromList(sb: any, cid: string, videoUrls: string[]): Promise<boolean> {
  if (videoUrls.length === 0) return false;
  var mr = await sb.from('whatsapp_messages').select('id').eq('conversation_id', cid).eq('direction', 'outbound').eq('message_type', 'video').limit(50);
  var mids: string[] = [];
  if (mr.data) {
    for (var i = 0; i < mr.data.length; i++) mids.push(mr.data[i].id);
  }
  if (mids.length === 0) return false;
  var wr = await sb.from('whatsapp_media').select('media_url').in('message_id', mids).in('media_url', videoUrls).limit(1);
  return !!(wr.data && wr.data.length > 0);
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
    // Verificar feriado nacional para o dia em BRT
    var holidayInfo = isHolidayBR(new Date(ts));
    var dayLabel = wn[dow] + ', ' + ds + (holidayInfo.holiday ? ' — FERIADO NACIONAL (sem atendimento)' : '');
    var dayOut = '\n[' + dayLabel + ']';
    if (holidayInfo.holiday) {
      if (di < 3) dc.push(dayOut + '\n  (Sem atendimento — feriado)');
      continue;
    }
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
  if (!res.ok) {
    await safeDebugLog(sb, 'extractLeadData GPT failed', { cid: cid, status: res.status });
    return;
  }
  var d = await res.json();
  var ct = (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content : null;
  if (!ct) {
    await safeDebugLog(sb, 'extractLeadData empty response', { cid: cid });
    return;
  }
  try {
    var ex = JSON.parse(ct.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    await safeDebugLog(sb, 'extractLeadData parsed', {
      cid: cid,
      nome: ex.nome || null,
      proc: ex.procedimento_desejado || null,
      conv: ex.convenio || null,
      temp: ex.temperatura_lead || null,
      ag_confirmed: ex.agendamento_confirmado ? !!ex.agendamento_confirmado.is_confirmed : false,
      ag_data: ex.agendamento_confirmado ? (ex.agendamento_confirmado.data_iso || null) : null,
    });
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
    var canBook = bcr.data && bcr.data.auto_scheduling_enabled && ex.agendamento_confirmado && ex.agendamento_confirmado.is_confirmed && ex.agendamento_confirmado.data_iso;
    if (!canBook) {
      await safeDebugLog(sb, 'extractLeadData skip booking', {
        cid: cid,
        autoSchedEnabled: !!(bcr.data && bcr.data.auto_scheduling_enabled),
        hasAgConfirmed: !!ex.agendamento_confirmado,
        isConfirmed: ex.agendamento_confirmado ? !!ex.agendamento_confirmado.is_confirmed : false,
        hasDataIso: ex.agendamento_confirmado ? !!ex.agendamento_confirmado.data_iso : false,
      });
    }
    if (canBook) {
      // Ensure contact exists before booking
      await ensureCRMContact(sb, conv, cid);
      var bd2 = new Date(ex.agendamento_confirmado.data_iso);
      if (isNaN(bd2.getTime())) {
        await safeDebugLog(sb, 'extractLeadData invalid data_iso', { cid: cid, raw: ex.agendamento_confirmado.data_iso });
        return;
      }
      var ed2 = new Date(bd2.getTime() + 1800000);
      var did2 = ex.agendamento_confirmado.medico_id || conv.user_id;
      var cfr = await sb.from('medical_appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', did2).neq('status', 'cancelled').lt('start_time', ed2.toISOString()).gt('end_time', bd2.toISOString());
      if (cfr.count && cfr.count > 0) {
        await safeDebugLog(sb, 'extractLeadData booking conflict', { cid: cid, did: did2, start: bd2.toISOString(), conflicts: cfr.count });
      }
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
          await safeDebugLog(sb, 'extractLeadData booking SUCCESS', { cid: cid, did: did2, start: bd2.toISOString() });
        } else {
          await safeDebugLog(sb, 'extractLeadData booking insert failed', { cid: cid, error: String(bkr.error.message || bkr.error) });
        }
      }
    }
  } catch (e) {
    await safeDebugLog(sb, 'extractLeadData parse error', { cid: cid, error: String(e), preview: ct ? ct.substring(0, 300) : null });
  }
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

/** Outbound humano ou legado recente — evita corrida IA x secretaria. */
async function recentHumanOutbound(sb: any, cid: string, withinMinutes: number): Promise<boolean> {
  var sinceIso = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
  var r = await sb.from('whatsapp_messages').select('id, metadata').eq('conversation_id', cid).eq('direction', 'outbound').gte('sent_at', sinceIso).order('sent_at', { ascending: false }).limit(8);
  var rows = r.data || [];
  for (var i = 0; i < rows.length; i++) {
    var m = rows[i].metadata as any;
    if (m && m.ai_generated === true) continue;
    return true;
  }
  return false;
}

async function runHandoffAndReturn(
  sb: any,
  wac: any,
  conv: any,
  cid: string,
  msgs: any[],
  inb: any[],
  lim: string,
  aic: any,
): Promise<Response> {
  var hId = buildAgentIdentity(aic || {});
  var hPr = buildPhasePrompt('handoff', hId);
  var hRes = await callGPT(hPr, msgs, conv, 0.4);
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

    await safeDebugLog(sb, 'Started', { cid: cid, hasOpenAIKey: !!OAI, envKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('OPENAI') || k.includes('SUPABASE')).join(',') });

    if (!OAI) {
      await safeDebugLog(sb, 'OPENAI_API_KEY missing', { cid: cid });
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 200, headers: CORS });
    }

    // STEP 1: LOCK
    // Lock longo o bastante para atraso humanizado (até ~5 min) + GPT + envio
    var lr = await sb.rpc('try_acquire_ai_lock', { p_conversation_id: cid, p_lock_seconds: 540 });
    if (!lr.data) {
      await safeDebugLog(sb, 'Lock FAILED', { cid: cid, lockData: lr.data, lockError: lr.error ? String(lr.error.message) : null });
      return new Response(JSON.stringify({ status: 'locked' }), { status: 200, headers: CORS });
    }
    await safeDebugLog(sb, 'Lock OK', { cid: cid });

    // Humano ativo nesta conversa nos ultimos minutos -> nao competir com a equipe
    if (await recentHumanOutbound(sb, cid, 10)) {
      await safeDebugLog(sb, 'Skip: recent human outbound (pre-debounce)', { cid: cid });
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'skipped_human_active' }), { status: 200, headers: CORS });
    }

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
    var aicForPrompt = await resolveConfigForPrompts(sb, conv, aic);
    var localOn = conv.ai_autonomous_mode === true;
    var localOff = conv.ai_autonomous_mode === false;
    var globalOn = aic ? aic.auto_reply_enabled === true : false;
    if (!(localOn || (!localOff && globalOn))) {
      await safeDebugLog(sb, 'Auto-reply DISABLED', { cid: cid, localOn: localOn, localOff: localOff, globalOn: globalOn, aiMode: conv.ai_autonomous_mode });
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'auto_reply_disabled' }), { status: 200, headers: CORS });
    }
    await safeDebugLog(sb, 'Auto-reply ON', { cid: cid, localOn: localOn, globalOn: globalOn });

    // Humano respondeu nos ultimos minutos -> nao competir com a secretaria
    if (await recentHumanOutbound(sb, cid, 10)) {
      await safeDebugLog(sb, 'Skipped: recent human outbound', { cid: cid });
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'human_active_skip' }), { status: 200, headers: CORS });
    }

    // STEP 3b: MARK AS READ
    var wac = await getWAConfig(sb, conv.user_id);
    if (wac) {
      var lir = await sb.from('whatsapp_messages').select('message_id').eq('conversation_id', cid).eq('direction', 'inbound').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (lir.data && lir.data.message_id && (wac.provider || 'meta') !== 'evolution') {
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
    var msr = await sb.from('whatsapp_messages').select('id, message_id, direction, content, message_type, sent_at, metadata').eq('conversation_id', cid).order('sent_at', { ascending: false }).limit(20);
    var msgs = msr.data || [];
    if (msgs.length === 0) throw new Error('No messages found');

    var inb: any[] = [];
    var outb: any[] = [];
    for (var mi = 0; mi < msgs.length; mi++) {
      if (msgs[mi].direction === 'inbound') inb.push(msgs[mi]);
      else outb.push(msgs[mi]);
    }
    var lim = (inb.length > 0 && inb[0].content) ? inb[0].content : '';
    var inbCountR = await sb.from('whatsapp_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', cid).eq('direction', 'inbound');
    var userTurnCount = inbCountR.count || 0;

    // STEP 5: LOAD LEAD DATA
    var ldr = await sb.from('whatsapp_lead_qualifications').select('*').eq('conversation_id', cid).maybeSingle();
    var leadRow: any = ldr.data || null;
    var videosAlreadySent = !!(leadRow && leadRow.videos_sent_at);

    // STEP 6: DETECT PHASE
    var phr = detectPhase(userTurnCount, leadRow, lim);

    // STEP 6a: CREATE CRM CONTACT ONLY WHEN PATIENT SHOWS INTEREST
    if (phr.phase === 'agendamento' || phr.phase === 'pos_agendamento') {
      await ensureCRMContact(sb, conv, cid);
    }

    // HANDOFF (imediato — sem atraso humanizado)
    if (phr.phase === 'handoff') {
      return await runHandoffAndReturn(sb, wac, conv, cid, msgs, inb, lim, aicForPrompt || aic);
    }

    // STEP 6.5: ENCERRAMENTO EDUCADO
    // Se o paciente apenas se despediu E nossa ultima mensagem ja foi um fechamento educado,
    // o sistema NAO responde mais — evita ping-pong eterno de "imagina!" / "obrigado!".
    var lastOutboundContent = (outb.length > 0 && outb[0].content) ? outb[0].content : '';
    if (patientFarewell(lim) && lastOutboundIsClosing(lastOutboundContent)) {
      await safeDebugLog(sb, 'Conversation closed (farewell after closing)', {
        cid: cid, lastInbound: lim.substring(0, 80), lastOutbound: lastOutboundContent.substring(0, 80),
      });
      try { await sb.from('whatsapp_conversations').update({ status: 'closed' }).eq('id', cid); } catch (_e) { /* ignore */ }
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'farewell_no_reply' }), { status: 200, headers: CORS });
    }

    // Detecta desengajamento ("vou pensar", "te chamo depois", "agendo em breve") OU despedida
    // pura (mesmo sem fechamento previo — ex: paciente comeca dizendo "Obrigado, depois te chamo").
    // Em ambos os casos, prompta o GPT pra responder UMA vez de forma curta e educada,
    // sem oferecer agenda nem mandar video.
    var softCloseSignal = patientDisengaging(lim) || patientFarewell(lim);

    // Atraso humanizado antes de responder (padrão 2–5 min; desliga só em palavras de emergência
    // ou quando o paciente apenas se despediu — fechamento curto deve sair rapido)
    if (!emergencySkipDelay(lim) && !softCloseSignal) {
      var delayMs = computeHumanReplyDelayMs(aic);
      await safeDebugLog(sb, 'Human reply delay', { cid: cid, delayMs: delayMs });
      var delayStartedAt = Date.now();
      await sleep(delayMs);
      await safeDebugLog(sb, 'Resumed after delay', { cid: cid, requestedMs: delayMs, actualMs: Date.now() - delayStartedAt });

      // Recarregar mensagens após o delay (paciente pode ter mandado mais)
      var msr2 = await sb.from('whatsapp_messages').select('id, message_id, direction, content, message_type, sent_at, metadata').eq('conversation_id', cid).order('sent_at', { ascending: false }).limit(20);
      msgs = msr2.data || [];
      inb = [];
      outb = [];
      for (var rmi = 0; rmi < msgs.length; rmi++) {
        if (msgs[rmi].direction === 'inbound') inb.push(msgs[rmi]);
        else outb.push(msgs[rmi]);
      }
      lim = (inb.length > 0 && inb[0].content) ? inb[0].content : '';
      var inbCountR2 = await sb.from('whatsapp_messages').select('*', { count: 'exact', head: true }).eq('conversation_id', cid).eq('direction', 'inbound');
      userTurnCount = inbCountR2.count || 0;
      var ldr2 = await sb.from('whatsapp_lead_qualifications').select('*').eq('conversation_id', cid).maybeSingle();
      ldr = ldr2;
      leadRow = ldr.data || null;
      videosAlreadySent = !!(leadRow && leadRow.videos_sent_at);
      phr = detectPhase(userTurnCount, leadRow, lim);

      // RE-CHECK 1: ai_autonomous_mode pode ter sido desativado durante o delay
      // (caso Sandra: humana clica em "desativar IA" no inbox enquanto o agent estava
      // dormindo; sem este re-check a IA acordava e respondia mesmo assim).
      var rcr = await sb.from('whatsapp_conversations')
        .select('ai_autonomous_mode, status')
        .eq('id', cid).single();
      if (rcr.data) {
        if (rcr.data.ai_autonomous_mode === false) {
          await safeDebugLog(sb, 'Aborting after delay: ai_autonomous_mode=false', { cid: cid });
          await safeReleaseLock(sb, cid);
          return new Response(JSON.stringify({ status: 'auto_reply_disabled_after_delay' }), { status: 200, headers: CORS });
        }
        if (rcr.data.status === 'closed' || rcr.data.status === 'resolved') {
          await safeDebugLog(sb, 'Aborting after delay: conversation closed', { cid: cid, status: rcr.data.status });
          await safeReleaseLock(sb, cid);
          return new Response(JSON.stringify({ status: 'conversation_closed' }), { status: 200, headers: CORS });
        }
      }

      // RE-CHECK 2: humano respondeu durante o delay -> pausa a IA
      // (evita corrida IA/humano - caso Andrea: IA dizendo "vou verificar"
      // enquanto humana ja mandava os horarios reais).
      var humanIntervened = false;
      var humanWindowMs = 5 * 60 * 1000; // 5 minutos
      var nowTs = Date.now();
      for (var ohi = 0; ohi < outb.length; ohi++) {
        var om = outb[ohi];
        var sentTs = om.sent_at ? new Date(om.sent_at).getTime() : 0;
        if (nowTs - sentTs > humanWindowMs) break;
        var meta = om.metadata || {};
        var isAi = meta.ai_generated === true || meta.agent === 'whatsapp-ai-agent' || meta.agent === 'whatsapp-followup-cron';
        if (!isAi) { humanIntervened = true; break; }
      }
      if (humanIntervened) {
        await safeDebugLog(sb, 'Aborting after delay: human intervention detected', { cid: cid });
        // Desliga a IA pra essa conversa (humano pegou o caso)
        try { await sb.from('whatsapp_conversations').update({ ai_autonomous_mode: false, priority: 'high' }).eq('id', cid); } catch (_e) { /* ignore */ }
        await safeReleaseLock(sb, cid);
        return new Response(JSON.stringify({ status: 'human_intervened' }), { status: 200, headers: CORS });
      }

      if (phr.phase === 'agendamento' || phr.phase === 'pos_agendamento') {
        await ensureCRMContact(sb, conv, cid);
      }
      if (phr.phase === 'handoff') {
        return await runHandoffAndReturn(sb, wac, conv, cid, msgs, inb, lim, aicForPrompt || aic);
      }
    }

    // Se ancoragem de video foi enviada mas nenhum MP4 entregou, o GPT precisa recuperar o fio
    var videoAnchorsButSendFailed = false;

    // STEP 6b: AVALIAR ENVIO DE VÍDEO DE DEPOIMENTO (antes de gerar prompt)
    var inboundHistoryText = inb.map(function(m: any) { return m.content || ''; }).join('\n');
    var willSendVideo = shouldSendTestimonialNow(
      phr.phase,
      lim,
      leadRow,
      outb.length,
      videosAlreadySent,
      userTurnCount,
      inboundHistoryText,
    );

    // STEP 6c: SE FOR ENVIAR VÍDEO AGORA, FAZ O FLUXO DETERMINÍSTICO:
    //   ancoragem (texto curto) -> 3 vídeos -> RETURN (sem chamar GPT).
    //   Isso garante a ORDEM SAGRADA do PDF: vídeos ANTES do preço.
    //   Na próxima inbound, GPT volta com videoSent=true e fala preço/CTA.
    if (willSendVideo && wac) {
      try {
        var videosPre = await getTestimonialVideoUrls(sb, conv.user_id);
        if (videosPre.length > 0) {
          var firstName = (conv.contact_name || '').trim().split(/\s+/)[0] || '';
          var anchorMsg1 = (firstName ? firstName + ', a' : 'A') + 'ntes de te falar sobre o investimento, quero te mostrar o relato de um paciente com um caso parecido com o seu 👇';
          var anchorMsg2 = 'Olha os resultados:';

          var preLimid = inb.length > 0 ? inb[0].message_id : null;
          if (preLimid) await sendTyping(wac, preLimid);

          // Inicia "digitando..." enquanto a IA "le" e "pensa"
          var stopTypingV = startTypingHeartbeat(wac, conv.phone_number, 'composing');
          try {
            await readingDelay(lim.length);
            await typingDelay(anchorMsg1);
          } finally { stopTypingV(); }
          await sendWA(wac, conv.phone_number, anchorMsg1, sb, cid, conv.user_id);

          await sleep(800);
          var stopTypingV2 = startTypingHeartbeat(wac, conv.phone_number, 'composing');
          try { await typingDelay(anchorMsg2); } finally { stopTypingV2(); }
          await sendWA(wac, conv.phone_number, anchorMsg2, sb, cid, conv.user_id);

          await safeDebugLog(sb, 'Sending testimonial videos (deterministic)', { cid: cid, count: videosPre.length });
          var anyOk = false;
          for (var pvi = 0; pvi < videosPre.length; pvi++) {
            // Mostra "gravando video..." entre cada envio (UX premium)
            var stopRec = startTypingHeartbeat(wac, conv.phone_number, 'recording');
            try { await sleep(1500); } finally { stopRec(); }
            var okv = await sendVideoWA(wac, conv.phone_number, videosPre[pvi].url, videosPre[pvi].caption || '', sb, cid, conv.user_id);
            if (okv) anyOk = true;
            else await safeDebugLog(sb, 'Video send failed', { cid: cid, idx: pvi, url: videosPre[pvi].url });
          }
          if (anyOk) {
            await sb.from('whatsapp_lead_qualifications').upsert({
              conversation_id: cid,
              phone_number: conv.phone_number,
              videos_sent_at: new Date().toISOString(),
            }, { onConflict: 'conversation_id' });
            videosAlreadySent = true;
          } else {
            await safeDebugLog(sb, 'All video sends failed after anchor — falling through to GPT', { cid: cid });
            videoAnchorsButSendFailed = true;
          }

          if (anyOk) {
            try {
              await sb.from('whatsapp_conversation_analysis').upsert({
                conversation_id: cid, user_id: conv.user_id, lead_status: 'morno',
                last_analyzed_at: new Date().toISOString(), message_count_analyzed: msgs.length,
                ai_model_used: 'agent (anchor+video, no GPT)', suggested_next_action: 'Aguardar reacao aos videos antes de falar preco',
              }, { onConflict: 'conversation_id' });
            } catch (_e) { /* ignore */ }
            await safeReleaseLock(sb, cid);
            return new Response(JSON.stringify({ status: 'success', mode: 'video-anchor', videos: videosPre.length }), {
              status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }
          willSendVideo = false;
        } else {
          await safeDebugLog(sb, 'Wanted to send video but none configured', { cid: cid, userId: conv.user_id });
          // segue fluxo normal sem video
          willSendVideo = false;
        }
      } catch (eVid) {
        await safeDebugLog(sb, 'Video anchor flow failed', { cid: cid, error: String(eVid) });
        willSendVideo = false;
      }
    }

    // STEP 7: SCHEDULE
    var schCtx = '';
    var schRx = /disponib|agendar|agenda|horario|consulta|dia\s+\d|segunda|ter[cç]a|quarta|quinta|sexta|\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(horas|hrs|da\s*manh|da\s*tarde)/i;
    if (phr.shouldLoadSchedule || phr.phase === 'agendamento' || schRx.test(lim)) {
      try { schCtx = await buildScheduleContext(sb, conv.user_id); }
      catch (se) { console.error('[Agent] Sched err:', se); schCtx = '(Erro ao carregar agenda)'; }
      await safeDebugLog(sb, 'Schedule', { cid: cid, ctx: schCtx.substring(0, 2000), phase: phr.phase });
    }

    // STEP 8: RAG
    var ragCtx = '';
    if (phr.shouldLoadRAG) {
      var kbForRag = (aicForPrompt && aicForPrompt.knowledge_base) ? aicForPrompt.knowledge_base : (aic ? aic.knowledge_base : undefined);
      ragCtx = await searchKB(sb, conv.user_id, lim, kbForRag);
    }

    // STEP 9: BUILD PROMPT
    var ident = buildAgentIdentity(aicForPrompt || aic || {});
    var sp = buildPhasePrompt(phr.phase, ident, {
      shouldSendVideoNow: willSendVideo,
      videoSent: videosAlreadySent,
      softClose: softCloseSignal,
    });
    var ext = '';

    if (outb.length > 0) {
      ext = ext + '\n\nINSTRUCAO OBRIGATORIA: Voce JA SE APRESENTOU nesta conversa (' + outb.length + ' msgs anteriores). NAO se apresente novamente. Comece DIRETO com a resposta.\n';
    }
    if (videosAlreadySent) {
      ext = ext + '\n\nCONTEXTO CRITICO — VIDEOS JA ENVIADOS NESTA CONVERSA:\n- PROIBIDO iniciar de novo com \"antes de te falar sobre o investimento\" / \"quero te mostrar o relato\" ou qualquer frase equivalente ao primeiro envio.\n- PROIBIDO sugerir reenviar depoimentos se o paciente disse \"ja vi\" / \"ja mandou\" — reconheça e siga em frente (duvidas objetivas sobre consulta ou encerramento educado).\n- Responda somente a ultima pergunta do paciente usando a BASE DE CONHECIMENTO.\n';
    }
    if (videoAnchorsButSendFailed) {
      ext = ext + '\n\nCONTEXTO URGENTE — FALHA TECNICA NO ENVIO DOS VIDEOS:\nVoce (sistema) acabou de prometer enviar videos de depoimento, mas o envio tecnico pelo WhatsApp falhou.\n- Peca desculpas em UMA linha, sem drama.\n- NAO cole links de arquivo nem URLs do storage.\n- Se o paciente estava esperando valor/investimento, pode apresentar o valor conforme BASE DE CONHECIMENTO (ordem sagrada preservada).\n';
    }
    if (schCtx) {
      ext = ext + '\n\nAGENDA DE HORARIOS DISPONIVEIS (resultado da consulta automatica a agenda do sistema — horarios ocupados e expediente do medico ja descontados):\n' + schCtx + '\n\nREGRAS DE HORARIOS (OBRIGATORIO):\n- SOMENTE ofereca horarios que aparecem EXPLICITAMENTE na lista acima (formato HH:MM).\n- Se NAO houver nenhum HH:MM na lista acima, e PROIBIDO dizer que tem vaga ou perguntar "prefere quinta ou sexta?" — diga que a agenda nao mostrou horario livre e ofereca encaminhar ao time.\n- Se o paciente pedir um horario que NAO esta na lista, diga que nao esta disponivel e ofereca alternativas que ESTEJAM na lista.\n- PROIBIDO deduzir que um horario esta livre. Se nao esta listado, NAO esta disponivel.\n- Ao oferecer marcacao com vagas na lista, cada opcao DEVE trazer dia + horario HH:MM copiados da lista (nao apenas o nome do dia).\n- Ao fechar horario com dados completos e confirmacao do paciente, o sistema pode gravar o agendamento automaticamente na agenda (se habilitado na clinica).\n';
    }
    if (ragCtx) {
      ext = ext + '\n\nBASE DE CONHECIMENTO COMPLEMENTAR (RAG — use junto com a configuração fixa acima):\n' + ragCtx + '\n';
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

    // STEP 10: CALL GPT (com indicador "digitando..." enquanto GPT processa)
    var aiText = '';
    var stopGptType = wac ? startTypingHeartbeat(wac, conv.phone_number, 'composing') : function(){};
    try {
      aiText = await callGPT(fsp, msgs, conv, 0.2);
    } catch (ge) {
      stopGptType();
      console.error('[Agent] GPT failed:', ge);
      await safeDebugLog(sb, 'GPT Failed', { cid: cid, error: String(ge) });
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ error: 'GPT failed' }), { status: 200, headers: CORS });
    }
    stopGptType();

    if (!aiText) {
      await safeReleaseLock(sb, cid);
      return new Response(JSON.stringify({ status: 'empty_response' }), { status: 200, headers: CORS });
    }

    // STEP 10b: AGENDA GUARD — bloqueia inventário e força lista real quando faltarem HH:MM
    var schHas = agendaListHasSlots(schCtx);
    var bookingLim = patientMessageSuggestsBooking(lim);
    if (bookingLim && !schHas && modelInventsAvailabilityWhenNoSlots(aiText)) {
      await safeDebugLog(sb, 'Agenda guard: bloqueou inventario sem slots', { cid: cid });
      aiText = FALLBACK_NO_AGENDA_SLOTS;
    } else if (bookingLim && schHas && modelOffersDaysWithoutTimes(aiText, true)) {
      await safeDebugLog(sb, 'Agenda guard: resposta sem HH:MM — injeta lista', { cid: cid });
      aiText = 'Olhei a agenda agora, esses sao os horarios livres no sistema:' + '\n\n' + schCtx + '\n\n[SPLIT]Me diz qual voce prefere que eu sigo com voce.';
    }

    // STEP 11: POST-PROCESS & SEND (com "digitando..." em cada split)
    var parts = postProcess(aiText);
    if (wac) {
      var limid = inb.length > 0 ? inb[0].message_id : null;
      if (limid) await sendTyping(wac, limid);
      // "Lendo" a mensagem
      var stopReading = startTypingHeartbeat(wac, conv.phone_number, 'composing');
      try { await readingDelay(lim.length); } finally { stopReading(); }

      for (var si = 0; si < parts.length; si++) {
        if (limid) await sendTyping(wac, limid);
        if (si > 0) await sleep(Math.min(Math.max(800, parts[si - 1].length * 25), 2000));
        // "Digitando" enquanto simula tempo de digitacao da parte
        var stopPart = startTypingHeartbeat(wac, conv.phone_number, 'composing');
        try { await typingDelay(parts[si]); } finally { stopPart(); }
        await sendWA(wac, conv.phone_number, parts[si], sb, cid, conv.user_id);
      }
    }

    // STEP 11b removido: envio de video agora ocorre no STEP 6c (deterministico)
    //                    para garantir ORDEM SAGRADA (videos ANTES de preco).

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
