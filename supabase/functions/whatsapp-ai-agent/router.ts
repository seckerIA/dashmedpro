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
  // =====================
  if (leadData?.status === 'agendado' || leadData?.data_agendamento) {
    return {
      phase: 'pos_agendamento',
      shouldLoadRAG: true,
      shouldLoadSchedule: false,
      reason: 'Lead já agendado — pós-atendimento',
    };
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
  ];

  // Regex para detectar horários (ex: "10h", "10:00")
  const timeRegex = /\b([0-1]?[0-9]|2[0-3])[h:]\b|\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b/i;
  const mentionsTime = timeRegex.test(msg);

  const wantsSchedule = agendamentoKeywords.some(k => msg.includes(k)) || mentionsTime;
  if (wantsSchedule && messageCount > 3) {
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
