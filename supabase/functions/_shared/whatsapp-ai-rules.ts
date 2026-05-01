/**
 * Regras puras compartilhadas entre whatsapp-ai-agent e whatsapp-followup-cron.
 * Sem dependências Deno — apenas TypeScript executável também via Node (tsx) nos testes.
 */

/** Detecta despedida pura ("obrigado", "tchau", "ate mais", "valeu") sem outras perguntas. */
export function patientFarewell(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (t.length === 0) return false;
  if (/\?/.test(t)) return false;
  if (t.length > 60) return false;
  return /^(\s*(muit[oa]\s+)?obrigad[oa]|\s*valeu|\s*vlw|\s*tchau|\s*at[eé]\s+(mais|logo|breve|j[áa])|\s*abra[çc]o|\s*abs|\s*beij[oa]s?|\s*bj[s]?|\s*ok\s*$|\s*okay\s*$|\s*beleza\s*$|\s*blz\s*$|\s*combinado\s*$|\s*perfeito\s*$|\s*entendi\s*$|\s*bom\s+(dia|tarde|noite)|\s*boa\s+(tarde|noite)|\s*bom\s+fim\s+de\s+semana)[\s.!,👍🙏❤️😊🤗👋✨🌟💕]*$/i.test(t);
}

/** Paciente pausou conversa ("vou pensar", "te chamo depois", "vou deixar pra depois"). */
export function patientDisengaging(text: string): boolean {
  const t = (text || '').toLowerCase();
  if (t.length === 0) return false;
  return /(\bn[aã]o\s+(quero|posso|tenho|consigo|vou)\s+(agora|no\s+momento|hoje|por\s+enquanto)\b|\bn[aã]o\s+pode\s+ser\s+agora\b|\bsem\s+condi[cç][oõ]es\s+(agora|no\s+momento|financeiras)\b|\b(esta|t[áa])\s+fora\s+do\s+(meu\s+)?or[cç]amento\b|\bfora\s+do\s+or[cç]amento\b|\bn[aã]o\s+cabe\s+no\s+(meu\s+)?or[cç]amento\b|\bn[aã]o\s+tenho\s+(esse\s+)?(dinheiro|valor|grana)\b|\bsem\s+grana\b|\bmuito\s+(caro|salgado|alto)\b|\b[eé]\s+caro\b|\bt[áa]\s+caro\b|\bca[ií]ssimo\b|\bn[aã]o\s+(cabe|d[áa])\s+no\s+momento\b|\bvou\s+deixar\s+(pra|para)\s+depois\b|\bdeixo\s+(pra|para)\s+depois\b|\bdeixar\s+(pra|para)\s+depois\b|\bdepois\s+(eu\s+)?(volto|falo|chamo|aviso|entro\s+em\s+contato|retorno|te\s+chamo|te\s+falo)\b|\bentrarei\s+em\s+contato\b|\bt[ee]\s+aviso\b|\bt[ee]\s+chamo\s+(depois|mais\s+tarde|amanh[aã])\b|\bvou\s+(pensar|ver|conversar\s+com|me\s+organizar|analisar|avaliar)\b|\bfica\s+pra\s+(depois|outro\s+dia|semana\s+que\s+vem|mais\s+tarde)\b|\bqualquer\s+coisa\s+(eu\s+)?(falo|chamo|retorno|aviso)\b|\bagend[oa]\s+(em\s+breve|outra\s+hora|depois|mais\s+tarde|amanh[aã])\b|\bligo\s+(em\s+breve|depois|mais\s+tarde|amanh[aã])\b|\bvolto\s+(a\s+)?(falar|te\s+falar|te\s+chamar)\b|\bpreciso\s+(me\s+organizar|ver\s+com|conversar\s+com|pensar)\b|\bdeixa\s+eu\s+(pensar|ver)\b|\bqd\s+(eu\s+)?(puder|tiver\s+tempo)\b|\bquando\s+(eu\s+)?(puder|tiver\s+tempo|me\s+organizar)\b)/i.test(t);
}

/**
 * Lead declinou seguir (financeiro / plano / agradecimento fechado).
 * Usado no agente (sem insistência + followup_disabled) e no cron (skip + disable).
 */
export function declinedFurtherContactInbound(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (t.length < 8) return false;

  const financial =
    /\b(n[aã]o\s+(consigo|posso|vou\s+conseguir|estou\s+podendo)\s+pagar\b|n[aã]o\s+tenho\s+(como\s+)?(pagar|arcar|custear)\b|sem\s+condi[cç][oõ]es\s+(financeiras\s+)?(no\s+momento|agora)|n[aã]o\s+d[aá]\s+(pra\s+mim\s+)?(pagar\s+)?particular\b|particular\s+(n[aã]o\s+d[aá]|est[aá]\s+caro|fora\s+do\s+or[cç]amento))\b/i.test(t) ||
    /\b(no\s+momento\s+)?n[aã]o\s+(estou|t[oô])\s+podendo\s+pagar\b/i.test(t);

  const planNoReimburse =
    /\b(plano|conv[eê]nio|amil|unimed|bradesco)\b.*\b(n[aã]o\s+(cobre|aceita|faz|tem)|sem\s+reembolso|n[aã]o\s+faz\s+(esse\s+)?tipo\s+de\s+reembolso)\b/i.test(t) ||
    /\bn[aã]o\s+(faz|tem)\s+(esse\s+)?tipo\s+de\s+reembolso\b/i.test(t);

  const thanksClose =
    /\b(obrigad[oa]|agrade[cç]o)\b.*\b(pelo|pela)\s+(atendimento|contato|informa[cç][aã]o)\b/i.test(t) ||
    /\bobrigad[oa]\s+pelo\s+seu?\s+atendimento\b/i.test(t);

  if (thanksClose && (financial || planNoReimburse || /\bn[aã]o\s+vou\s+(poder|conseguir)\b/i.test(t))) return true;
  if (financial && (thanksClose || t.length > 40)) return true;
  if (planNoReimburse && thanksClose) return true;
  return false;
}

export function isInvestmentQuestion(text: string): boolean {
  return /(pre[cç]o|valor|investimento|quanto\s+(custa|fica)|condi[cç][oõ]es|parcel|pagamento)/i.test(text || '');
}

/** Pergunta só logística — não disparar vídeos de depoimento. */
export function isLogisticsOnlyInbound(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (t.length === 0) return false;
  if (/\?/.test(t) === false && t.length > 120) return false;
  const logistics =
    /(endere[çc]o|localiza[cç][aã]o|onde\s+(fica|é|e)\s+(a\s+)?(cl[ií]nica|consult[oó]rio)|como\s+chego|mapa|waze|google\s+maps|estacionamento|estaciona|tem\s+vaga\s+pra\s+carro)/i.test(t);
  const price = isInvestmentQuestion(t);
  const pain = /\b(dor|joelho|ombro|consulta\s+com|agendar)\b/i.test(t);
  return logistics && !price && !pain;
}

/** Junta inbound recentes (cronológico) para detectar queixa quando a última msg é só "valores". */
export function buildInboundBlobFromMsgs(msgs: { direction: string; content: string | null }[]): string {
  const parts: string[] = [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].direction === 'inbound' && msgs[i].content) parts.push(msgs[i].content);
  }
  return parts.join('\n');
}

export interface LeadDataLite {
  procedimento_desejado?: string | null;
}

export function shouldSendTestimonialNow(
  phase: string,
  lim: string,
  leadData: LeadDataLite | null,
  outboundCount: number,
  videosAlreadySent: boolean,
  inboundBlob: string,
): boolean {
  if (videosAlreadySent) return false;
  if (outboundCount < 2) return false;
  if (phase !== 'triagem' && phase !== 'agendamento') return false;
  if (patientFarewell(lim) || patientDisengaging(lim) || declinedFurtherContactInbound(lim)) return false;
  if (isLogisticsOnlyInbound(lim)) return false;

  const blob = inboundBlob || lim || '';
  const painSignal =
    /\b(dor|doi|trava|pesad|incomod|machucad|les[aã]o|artrose|tendin|bursit|fasc[ií]te|joelho|ombro|coluna|quadril|tornozelo|cirurgia|fisioterapia|\b\d+\s*(meses|dias)\b)\b/i;
  const hasPain = painSignal.test(blob) || !!(leadData && leadData.procedimento_desejado);
  return hasPain;
}

/** Última outbound foi IA/automação — permitir follow-up programado. */
export function lastOutboundWasAiGenerated(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata['ai_generated'] === true) return true;
  const agent = metadata['agent'];
  return agent === 'whatsapp-ai-agent' || agent === 'whatsapp-followup-cron';
}
