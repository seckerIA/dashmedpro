/**
 * Phase Router — Detecção heurística de fase da conversa (sem LLM)
 * Adaptado do modelo Sophia para contexto médico/clínico
 */

export type ConversationPhase = 'abertura' | 'triagem' | 'agendamento' | 'pos_agendamento' | 'handoff';

export interface LeadData {
  nome?: string | null;
  procedimento_desejado?: string | null;
  convenio?: string | null;
  urgencia?: string | null;
  temperatura_lead?: string | null;
  status?: string | null;
  data_agendamento?: string | null;
}

export interface PhaseResult {
  phase: ConversationPhase;
  shouldLoadRAG: boolean;
  shouldLoadSchedule: boolean;
  reason: string;
}

export function detectPhase(
  messageCount: number,
  leadData: LeadData | null,
  lastInboundMessage: string,
): PhaseResult {
  const msg = (lastInboundMessage || '').toLowerCase().trim();

  // =====================
  // SINAIS DE HANDOFF
  // =====================
  const handoffKeywords = [
    'falar com alguem', 'falar com alguém', 'falar com humano',
    'falar com pessoa', 'atendente', 'recepcionista',
    'reclamação', 'reclamacao', 'insatisfeito', 'insatisfeita',
    'cancelar', 'devolver', 'reembolso',
  ];
  const emergencyKeywords = [
    'emergencia', 'emergência', 'urgente', 'urgência',
    'dor forte', 'sangramento', 'acidente', 'pronto socorro',
    'hospital', 'samu', 'upa',
  ];

  // Emergência médica → handoff imediato
  const hasEmergency = emergencyKeywords.some(k => msg.includes(k));
  if (hasEmergency) {
    return {
      phase: 'handoff',
      shouldLoadRAG: false,
      shouldLoadSchedule: false,
      reason: `Emergência detectada: "${msg.substring(0, 50)}"`,
    };
  }

  // Pediu handoff explicitamente
  const hasHandoffSignal = handoffKeywords.some(k => msg.includes(k));
  if (hasHandoffSignal && messageCount > 2) {
    return {
      phase: 'handoff',
      shouldLoadRAG: false,
      shouldLoadSchedule: false,
      reason: `Sinal de handoff: "${msg.substring(0, 50)}"`,
    };
  }

  // =====================
  // LEAD JÁ AGENDADO
  // Só mantém em pos_agendamento se:
  //  (a) agendamento ainda não aconteceu (é futuro OU foi há menos de 2 dias), E
  //  (b) a nova mensagem NÃO é um pedido explícito de novo agendamento
  // Caso contrário cai no fluxo normal (agendamento/triagem) — evita prender
  // pacientes que voltam depois com nova dúvida/nova marcação.
  // =====================
  const wantsNewBooking = /\b(agendar|marcar|remarcar|outra\s+consulta|nova\s+consulta|mais\s+uma|reagendar|trocar\s+(o\s+)?hor[aá]rio|mudar\s+(o\s+)?hor[aá]rio|proxim[ao]|pr[oó]xim[ao])\b/i.test(msg);
  if ((leadData?.status === 'agendado' || leadData?.data_agendamento) && !wantsNewBooking) {
    const apptTs = leadData.data_agendamento ? new Date(leadData.data_agendamento).getTime() : NaN;
    const now = Date.now();
    const apptIsFresh = !isNaN(apptTs) && (apptTs > now - 48 * 3600 * 1000); // futuro ou <48h atrás
    if (apptIsFresh) {
      return {
        phase: 'pos_agendamento',
        shouldLoadRAG: true,
        shouldLoadSchedule: false,
        reason: 'Lead já agendado — pós-atendimento',
      };
    }
  }

  // =====================
  // ABERTURA (1-3 msgs)
  // =====================
  if (messageCount <= 3) {
    return {
      phase: 'abertura',
      shouldLoadRAG: false,
      shouldLoadSchedule: false,
      reason: `Início da conversa (${messageCount} msgs)`,
    };
  }

  // =====================
  // AGENDAMENTO (procedimento + convênio identificados)
  // =====================
  if (leadData?.procedimento_desejado && leadData?.convenio) {
    return {
      phase: 'agendamento',
      shouldLoadRAG: true,
      shouldLoadSchedule: true,
      reason: `Qualificado — procedimento: ${leadData.procedimento_desejado}, convênio: ${leadData.convenio}`,
    };
  }

  // Sinais de querer agendar (mesmo sem procedimento completo)
  const agendamentoKeywords = [
    'quero agendar', 'quero marcar', 'marcar consulta',
    'agendar consulta', 'tem horario', 'tem horário',
    'horarios disponiveis', 'horários disponíveis',
    'quando posso', 'pode ser', 'qual horario', 'qual horário',
    'tem vaga', 'tem espaço', 'vaga para', 'espaço para',
    'disponibilidade', 'disponivel', 'disponível',
    'agendar', 'agenda', 'consulta',
    'dia da semana', 'semana que vem', 'proxima semana', 'próxima semana',
    'segunda', 'terca', 'terça', 'quarta', 'quinta', 'sexta', 'sabado', 'sábado',
    'de manha', 'da manha', 'da manhã', 'de manhã',
    'de tarde', 'da tarde', 'a tarde', 'à tarde',
    'horario', 'horário', 'horas', 'hrs',
  ];

  // Regex para detectar horários (ex: "10h", "10:00", "10 horas", "10 da manhã", "as 09")
  const timeRegex = /\b([0-1]?[0-9]|2[0-3])\s*[h:]\s*([0-5][0-9])?\b|\b([0-1]?[0-9]|2[0-3])\s*(horas|hrs|da\s*manh[aã]|da\s*tarde)\b|\b[àa]s\s*([0-1]?[0-9]|2[0-3])\b/i;
  const mentionsTime = timeRegex.test(msg);

  // Regex para detectar datas (ex: "dia 24", "24/02", "dia 24 de fevereiro")
  const dateRegex = /\bdia\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i;
  const mentionsDate = dateRegex.test(msg);

  const wantsSchedule = agendamentoKeywords.some(k => msg.includes(k)) || mentionsTime || mentionsDate;
  if (wantsSchedule && messageCount > 1) {
    return {
      phase: 'agendamento',
      shouldLoadRAG: true,
      shouldLoadSchedule: true,
      reason: `Sinal de agendamento: "${msg.substring(0, 50)}"`,
    };
  }

  // =====================
  // CONVERSA LONGA → AGENDAMENTO (se pelo menos procedimento)
  // =====================
  if (messageCount > 10 && leadData?.procedimento_desejado) {
    return {
      phase: 'agendamento',
      shouldLoadRAG: true,
      shouldLoadSchedule: true,
      reason: `Conversa longa com procedimento (${messageCount} msgs)`,
    };
  }

  // =====================
  // TRIAGEM (default para conversa em andamento)
  // =====================
  return {
    phase: 'triagem',
    shouldLoadRAG: true,
    shouldLoadSchedule: false,
    reason: `Triagem — qualificação (${messageCount} msgs)`,
  };
}
