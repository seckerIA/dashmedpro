// =====================================================
// AI Behavior Tester — DashMedPro
// Testa o comportamento da IA (whatsapp-ai-agent) frente
// a interacoes reais de pacientes, identificando pontos
// onde a IA falha em responder ou se comporta incorretamente.
//
// Este teste foca EXCLUSIVAMENTE na camada de IA:
//   1. Roteador de fases (detectPhase)
//   2. Pos-processamento de mensagens (postProcess)
//   3. Identidade do agente (buildAgentIdentity)
//   4. Regras de auto-reply (gating)
//   5. Cenarios completos de conversa simulada
//
// Roda 100% offline, sem Supabase/OpenAI, importando
// diretamente os modulos do agente.
// =====================================================

import { createRequire } from 'module';
import { detectPhase, type LeadData, type PhaseResult } from '../../supabase/functions/whatsapp-ai-agent/router.ts';

const require = createRequire(import.meta.url);

// =====================================================
// Cores e formatacao
// =====================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function header(text: string) {
  console.log('');
  console.log(`${COLORS.bright}${COLORS.blue}=========================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.blue}  ${text}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.blue}=========================================================${COLORS.reset}`);
}

function subheader(text: string) {
  console.log('');
  console.log(`${COLORS.cyan}--- ${text} ---${COLORS.reset}`);
}

function pass(text: string) {
  console.log(`  ${COLORS.green}[PASS]${COLORS.reset} ${text}`);
}

function fail(text: string, details?: string) {
  console.log(`  ${COLORS.red}[FAIL]${COLORS.reset} ${text}`);
  if (details) console.log(`         ${COLORS.dim}${details}${COLORS.reset}`);
}

function warn(text: string, details?: string) {
  console.log(`  ${COLORS.yellow}[WARN]${COLORS.reset} ${text}`);
  if (details) console.log(`         ${COLORS.dim}${details}${COLORS.reset}`);
}

function info(text: string) {
  console.log(`  ${COLORS.dim}[INFO] ${text}${COLORS.reset}`);
}

// =====================================================
// Resultados acumulados
// =====================================================

interface TestRecord {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
  expected?: string;
  actual?: string;
  patientMsg?: string;
}

const results: TestRecord[] = [];

function record(r: TestRecord) {
  results.push(r);
}

// =====================================================
// Helpers replicados do agent (para teste isolado)
// =====================================================

// Replica buildAgentIdentity do index.ts (linhas 14-26)
function buildAgentIdentity(c: any): any {
  const nonEmpty = (v: any, fallback: string) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : fallback);
  const optional = (v: any) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);
  return {
    agent_name: nonEmpty(c?.agent_name, 'Sofia'),
    clinic_name: nonEmpty(c?.clinic_name, 'nossa clinica'),
    specialist_name: nonEmpty(c?.specialist_name, 'nossa equipe'),
    agent_greeting: optional(c?.agent_greeting),
    custom_prompt_instructions: optional(c?.custom_prompt_instructions),
    already_known_info: optional(c?.already_known_info),
    doctor_info: optional(c?.doctor_info),
  };
}

// Replica postProcess do index.ts (linhas 67-105)
function postProcess(text: string): string[] {
  let cleaned = text.replace(/^(Sofia|Assistente|IA|Bot)\s*:\s*/gim, '').trim();
  const emojiRegex = /\p{Emoji_Presentation}/gu;
  const emojis = cleaned.match(emojiRegex) || [];
  if (emojis.length > 1) {
    let emojiCount = 0;
    cleaned = cleaned.replace(emojiRegex, (match) => {
      emojiCount++;
      return emojiCount <= 1 ? match : '';
    });
  }
  const rawParts = cleaned.split(/\[SPLIT\]/i);
  const trimmed: string[] = [];
  for (let i = 0; i < rawParts.length; i++) {
    const t = rawParts[i].trim();
    if (t.length > 0) trimmed.push(t);
  }
  const finalParts: string[] = [];
  for (let j = 0; j < trimmed.length; j++) {
    const part = trimmed[j];
    if (part.length <= 120) {
      finalParts.push(part);
    } else {
      const sentences = part.split(/(?<=[.!?])\s+/);
      let current = '';
      for (let k = 0; k < sentences.length; k++) {
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

// Replica regra de auto-reply gating do index.ts (linhas 473-476)
function shouldReplyByGate(args: { ai_autonomous_mode: boolean | null | undefined; auto_reply_enabled_global: boolean | null | undefined }): boolean {
  const localOn = args.ai_autonomous_mode === true;
  const localOff = args.ai_autonomous_mode === false;
  const globalOn = args.auto_reply_enabled_global === true;
  return localOn || (!localOff && globalOn);
}

// Replica regra do schedule context loader (linha 547)
function scheduleRegexMatches(msg: string): boolean {
  const schRx = /disponib|agendar|agenda|horario|consulta|dia\s+\d|segunda|ter[cç]a|quarta|quinta|sexta|\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(horas|hrs|da\s*manh|da\s*tarde)/i;
  return schRx.test(msg);
}

// =====================================================
// Test Suite 1 — Roteador de Fases
// =====================================================

function testRouter() {
  header('TEST SUITE 1 — ROTEADOR DE FASES (detectPhase)');

  const cases: Array<{
    desc: string;
    messageCount: number;
    leadData: LeadData | null;
    msg: string;
    expectedPhase: PhaseResult['phase'];
    note?: string;
  }> = [
    {
      desc: 'Primeiro contato — "Oi"',
      messageCount: 1,
      leadData: null,
      msg: 'oi',
      expectedPhase: 'abertura',
    },
    {
      desc: 'Primeiro contato — Saudacao com pergunta',
      messageCount: 1,
      leadData: null,
      msg: 'Bom dia, vcs atendem convenio Unimed?',
      expectedPhase: 'abertura',
    },
    {
      desc: 'CRITICO — "Quero agendar uma consulta" como PRIMEIRA mensagem',
      messageCount: 1,
      leadData: null,
      msg: 'Quero agendar uma consulta',
      expectedPhase: 'abertura',
      note: 'PROBLEMA: msg=1 sempre cai em abertura, mesmo com intencao clara de agendamento. Schedule context NAO eh carregado.',
    },
    {
      desc: 'Triagem — quarta mensagem sem dados',
      messageCount: 4,
      leadData: { temperatura_lead: 'morno' },
      msg: 'Pode me explicar como funciona?',
      expectedPhase: 'triagem',
    },
    {
      desc: 'Agendamento — paciente menciona "tem horario"',
      messageCount: 4,
      leadData: { procedimento_desejado: 'consulta cardiologica' },
      msg: 'Tem horario disponivel pra essa semana?',
      expectedPhase: 'agendamento',
    },
    {
      desc: 'Agendamento — qualificado (procedimento + convenio)',
      messageCount: 6,
      leadData: { procedimento_desejado: 'rinoplastia', convenio: 'particular' },
      msg: 'Qual valor?',
      expectedPhase: 'agendamento',
    },
    {
      desc: 'BUG-CONFIRMADO — horario "10h" na 3a msg deveria ir agendamento, mas vai abertura',
      messageCount: 3,
      leadData: null,
      msg: 'Pode ser as 10h da manha?',
      expectedPhase: 'agendamento',
      note: 'BUG: detectPhase verifica messageCount<=3 ANTES de checar timeRegex/dateRegex. Paciente que ja na 2a/3a msg manda horario nao avanca — IA fica genérica em fase abertura, sem carregar agenda.',
    },
    {
      desc: 'BUG-CONFIRMADO — data "dia 24" na 3a msg deveria ir agendamento, mas vai abertura',
      messageCount: 3,
      leadData: null,
      msg: 'Tenho disponibilidade dia 24',
      expectedPhase: 'agendamento',
      note: 'BUG: dateRegex nao eh consultado em mensagens 1-3. Cliente adianta data → IA ignora.',
    },
    {
      desc: 'Pos-agendamento — lead ja agendado (futuro)',
      messageCount: 8,
      leadData: {
        status: 'agendado',
        data_agendamento: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      },
      msg: 'Posso levar acompanhante?',
      expectedPhase: 'pos_agendamento',
    },
    {
      desc: 'Pos-agendamento → agendamento se paciente quer remarcar',
      messageCount: 8,
      leadData: {
        status: 'agendado',
        data_agendamento: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      },
      msg: 'Preciso remarcar minha consulta',
      expectedPhase: 'agendamento',
      note: 'wantsNewBooking + agendamentoKeywords ("remarcar") → cai em agendamento (CORRETO).',
    },
    {
      desc: 'Handoff — emergencia detectada',
      messageCount: 2,
      leadData: null,
      msg: 'Estou com sangramento muito forte',
      expectedPhase: 'handoff',
    },
    {
      desc: 'Handoff — paciente pede atendente humano',
      messageCount: 5,
      leadData: { temperatura_lead: 'frio' },
      msg: 'quero falar com humano por favor',
      expectedPhase: 'handoff',
    },
    {
      desc: 'CRITICO — palavra "cancelar" mata IA mesmo em contexto neutro',
      messageCount: 5,
      leadData: { temperatura_lead: 'morno' },
      msg: 'Posso cancelar minha consulta de amanha?',
      expectedPhase: 'handoff',
      note: 'PROBLEMA: "cancelar" silencia a IA permanentemente (handoff fixa ai_autonomous_mode=false).',
    },
    {
      desc: 'Conversa longa com procedimento → agendamento',
      messageCount: 12,
      leadData: { procedimento_desejado: 'avaliacao ortopedica' },
      msg: 'qual outro horario?',
      expectedPhase: 'agendamento',
    },
    {
      desc: 'Triagem default em msg media',
      messageCount: 5,
      leadData: { temperatura_lead: 'morno' },
      msg: 'Quanto custa?',
      expectedPhase: 'triagem',
    },
    {
      desc: 'Sintoma curto — fica em abertura sem evoluir',
      messageCount: 1,
      leadData: null,
      msg: 'to com dor no joelho',
      expectedPhase: 'abertura',
      note: 'OK em abertura, mas se o paciente NAO mandar mais nada, IA fica perdida. Precisa proativa.',
    },
    {
      desc: 'CRITICO — lead agendado e pede agendamento NOVO → agendamento',
      messageCount: 5,
      leadData: {
        status: 'agendado',
        data_agendamento: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      },
      msg: 'queria marcar uma outra consulta',
      expectedPhase: 'agendamento',
      note: 'wantsNewBooking detectado → sai de pos_agendamento → "marcar" trigger agendamento. CORRETO.',
    },
  ];

  for (const c of cases) {
    const result = detectPhase(c.messageCount, c.leadData, c.msg);
    const ok = result.phase === c.expectedPhase;
    if (ok) {
      pass(`${c.desc} → ${result.phase} (${result.reason})`);
      record({
        category: 'router',
        name: c.desc,
        status: c.note ? 'warn' : 'pass',
        patientMsg: c.msg,
        expected: c.expectedPhase,
        actual: result.phase,
        detail: c.note,
      });
    } else {
      fail(`${c.desc}`, `Esperado: ${c.expectedPhase}, Obteve: ${result.phase} (${result.reason})`);
      record({
        category: 'router',
        name: c.desc,
        status: 'fail',
        patientMsg: c.msg,
        expected: c.expectedPhase,
        actual: result.phase,
        detail: c.note || result.reason,
      });
    }
  }
}

// =====================================================
// Test Suite 2 — Identidade do Agente
// =====================================================

function testIdentity() {
  header('TEST SUITE 2 — IDENTIDADE DO AGENTE');

  // Cenario 1: Nenhuma config no whatsapp_ai_config
  const noConfig = buildAgentIdentity(null);
  if (noConfig.agent_name === 'Sofia' && noConfig.clinic_name === 'nossa clinica' && noConfig.specialist_name === 'nossa equipe') {
    pass('Fallback default quando config eh null');
    record({ category: 'identity', name: 'fallback default', status: 'pass' });
  } else {
    fail('Fallback default nao aplicado corretamente', JSON.stringify(noConfig));
    record({ category: 'identity', name: 'fallback default', status: 'fail', detail: JSON.stringify(noConfig) });
  }

  // Cenario 2: Config com strings vazias
  const emptyConfig = buildAgentIdentity({ agent_name: '', clinic_name: '   ', specialist_name: '' });
  if (emptyConfig.agent_name === 'Sofia' && emptyConfig.specialist_name === 'nossa equipe') {
    pass('Strings vazias caem no fallback');
    record({ category: 'identity', name: 'empty strings → fallback', status: 'pass' });
  } else {
    fail('Strings vazias nao caem no fallback', JSON.stringify(emptyConfig));
    record({ category: 'identity', name: 'empty strings → fallback', status: 'fail' });
  }

  // Cenario 3: Config completa
  const fullConfig = buildAgentIdentity({
    agent_name: 'Maria',
    clinic_name: 'Clinica Vita',
    specialist_name: 'Dr. Joao',
    doctor_info: 'Cardiologista',
  });
  if (fullConfig.agent_name === 'Maria' && fullConfig.specialist_name === 'Dr. Joao' && fullConfig.doctor_info === 'Cardiologista') {
    pass('Config completa eh respeitada');
    record({ category: 'identity', name: 'config completa', status: 'pass' });
  } else {
    fail('Config completa nao foi mapeada', JSON.stringify(fullConfig));
    record({ category: 'identity', name: 'config completa', status: 'fail' });
  }

  // Cenario CRITICO: agent_name salvo como espaco em branco
  const whitespaceConfig = buildAgentIdentity({ agent_name: '\t\n', clinic_name: '   ' });
  if (whitespaceConfig.agent_name === 'Sofia') {
    pass('Whitespace puro cai no fallback');
    record({ category: 'identity', name: 'whitespace → fallback', status: 'pass' });
  } else {
    fail('Whitespace puro NAO caiu no fallback');
    record({ category: 'identity', name: 'whitespace → fallback', status: 'fail' });
  }
}

// =====================================================
// Test Suite 3 — Pos-processamento
// =====================================================

function testPostProcess() {
  header('TEST SUITE 3 — POS-PROCESSAMENTO DE RESPOSTAS');

  // Cenario: Resposta tipica em 3 partes
  const r1 = postProcess('Oi![SPLIT]Sou a Sofia, assistente do Dr. Rafael[SPLIT]Como posso te ajudar?');
  if (r1.length === 3 && r1[0] === 'Oi!' && r1[2].includes('Como posso')) {
    pass('Splitting basico [SPLIT] funciona');
    record({ category: 'postprocess', name: 'split basico', status: 'pass' });
  } else {
    fail('Splitting basico falhou', JSON.stringify(r1));
    record({ category: 'postprocess', name: 'split basico', status: 'fail' });
  }

  // Cenario: Prefixo "Sofia:" na resposta
  const r2 = postProcess('Sofia: Bom dia! Como vai?');
  if (!r2[0].startsWith('Sofia:')) {
    pass('Prefixo "Sofia:" eh removido');
    record({ category: 'postprocess', name: 'remove prefix Sofia:', status: 'pass' });
  } else {
    fail('Prefixo "Sofia:" NAO foi removido', r2[0]);
    record({ category: 'postprocess', name: 'remove prefix Sofia:', status: 'fail' });
  }

  // Cenario: Multiplos emojis (deve manter so 1)
  const r3 = postProcess('Otimo! 😊 Vou agendar 📅 pra voce ✅');
  const emojiCount = (r3.join('').match(/\p{Emoji_Presentation}/gu) || []).length;
  if (emojiCount <= 1) {
    pass(`Limita a 1 emoji por resposta (${emojiCount})`);
    record({ category: 'postprocess', name: 'limita emojis', status: 'pass' });
  } else {
    fail(`Mais de 1 emoji passou (${emojiCount})`, r3.join(' / '));
    record({ category: 'postprocess', name: 'limita emojis', status: 'fail' });
  }

  // Cenario: Mensagem muito longa (>120 char) deve ser quebrada em frases
  const longText = 'Voce tem razao, agora vamos ver se conseguimos um horario bom pra voce. Tenho terca-feira disponivel. Quer essa data ou prefere quinta? Ambas tem otima disponibilidade.';
  const r4 = postProcess(longText);
  const allShort = r4.every(p => p.length <= 200);
  if (r4.length >= 2 && allShort) {
    pass(`Mensagem longa eh dividida em ${r4.length} partes`);
    record({ category: 'postprocess', name: 'split long sentences', status: 'pass' });
  } else {
    fail('Mensagem longa nao foi dividida adequadamente', JSON.stringify(r4));
    record({ category: 'postprocess', name: 'split long sentences', status: 'fail' });
  }

  // Cenario: Resposta vazia - fallback
  const r5 = postProcess('');
  if (r5.length === 1 && r5[0].length > 0) {
    pass('Fallback ativa em resposta vazia');
    record({ category: 'postprocess', name: 'fallback empty', status: 'pass' });
  } else {
    fail('Fallback de resposta vazia falhou', JSON.stringify(r5));
    record({ category: 'postprocess', name: 'fallback empty', status: 'fail' });
  }

  // Cenario CRITICO: [SPLIT] no meio de "Dr. Rafael"
  const r6 = postProcess('O Dr.[SPLIT]Rafael Carvalho pode te atender amanha');
  // Verifica se nome ficou separado (problema critico)
  const splitInName = r6[0] === 'O Dr.' && r6[1] && r6[1].startsWith('Rafael');
  if (splitInName) {
    warn('Modelo dividiu nome de medico em SPLIT (postProcess nao protege)', JSON.stringify(r6));
    record({ category: 'postprocess', name: '[SPLIT] em nome de medico', status: 'warn', detail: 'IA pode dividir "Dr. Rafael" em duas mensagens. Sem fix automatico no codigo, depende do prompt.' });
  } else {
    pass('Nome de medico mantido junto');
    record({ category: 'postprocess', name: '[SPLIT] em nome de medico', status: 'pass' });
  }
}

// =====================================================
// Test Suite 4 — Auto-Reply Gate
// =====================================================

function testAutoReplyGate() {
  header('TEST SUITE 4 — REGRAS DE AUTO-REPLY (GATING)');

  const cases: Array<{ desc: string; ai_autonomous_mode: boolean | null; global: boolean; expected: boolean; note?: string }> = [
    { desc: 'IA global ON, conversa neutra (null)', ai_autonomous_mode: null, global: true, expected: true },
    { desc: 'IA global ON, conversa LOCAL OFF', ai_autonomous_mode: false, global: true, expected: false, note: 'Local OFF prevalece sobre global ON.' },
    { desc: 'IA global OFF, conversa LOCAL ON', ai_autonomous_mode: true, global: false, expected: true, note: 'Local ON prevalece sobre global OFF.' },
    { desc: 'IA global OFF, conversa neutra', ai_autonomous_mode: null, global: false, expected: false, note: 'Default state — silenciosa. Configuracao nunca ativada na clinica.' },
    { desc: 'IA global undefined (sem registro), conversa neutra', ai_autonomous_mode: null, global: undefined as any, expected: false, note: 'PROBLEMA: clinica que nunca abriu o dialog → nao ha row em whatsapp_ai_config → IA nao responde nunca.' },
    { desc: 'IA global undefined, conversa LOCAL ON', ai_autonomous_mode: true, global: undefined as any, expected: true },
  ];

  for (const c of cases) {
    const r = shouldReplyByGate({ ai_autonomous_mode: c.ai_autonomous_mode, auto_reply_enabled_global: c.global });
    if (r === c.expected) {
      pass(`${c.desc} → reply=${r}`);
      record({ category: 'gate', name: c.desc, status: c.note ? 'warn' : 'pass', detail: c.note });
    } else {
      fail(`${c.desc}`, `Esperado=${c.expected}, Obteve=${r}`);
      record({ category: 'gate', name: c.desc, status: 'fail', detail: `expected=${c.expected} got=${r}` });
    }
  }
}

// =====================================================
// Test Suite 5 — Schedule Regex (linha 547 do agent)
// =====================================================

function testScheduleRegex() {
  header('TEST SUITE 5 — TRIGGER DE AGENDA (REGEX SCHEDULE)');

  const cases: Array<{ desc: string; msg: string; expected: boolean; note?: string }> = [
    { desc: 'Paciente pergunta horario', msg: 'tem horario amanha?', expected: true },
    { desc: 'Paciente quer agendar', msg: 'gostaria de agendar', expected: true },
    { desc: 'Cita "consulta"', msg: 'qual o valor da consulta?', expected: true, note: 'Trigger excessivo: pergunta de PRECO carrega agenda inutilmente.' },
    { desc: 'Cita dia da semana', msg: 'pode ser segunda-feira?', expected: true },
    { desc: 'Cita horario especifico', msg: 'as 10h ta bom', expected: true },
    { desc: 'Pergunta neutra (custo)', msg: 'quanto custa?', expected: false, note: 'OK — nao deve carregar agenda.' },
    { desc: 'Pergunta de localizacao', msg: 'qual o endereco?', expected: false },
    { desc: 'Saudacao simples', msg: 'oi', expected: false },
  ];

  for (const c of cases) {
    const r = scheduleRegexMatches(c.msg);
    if (r === c.expected) {
      pass(`${c.desc} → trigger=${r}`);
      record({ category: 'schedule_regex', name: c.desc, status: c.note ? 'warn' : 'pass', patientMsg: c.msg, detail: c.note });
    } else {
      fail(`${c.desc}`, `Esperado=${c.expected}, Obteve=${r}`);
      record({ category: 'schedule_regex', name: c.desc, status: 'fail', patientMsg: c.msg, expected: String(c.expected), actual: String(r) });
    }
  }
}

// =====================================================
// Test Suite 6 — Simulacao de Conversa Completa
// =====================================================

function testFullConversationSimulation() {
  header('TEST SUITE 6 — SIMULACAO COMPLETA: PESSOA REAL');
  info('Simulando conversas tipicas de pacientes com a IA...');

  // ===== CENARIO A: Lead vindo de anuncio Meta — alta intencao =====
  subheader('CENARIO A — Lead quente vindo de anuncio Meta');
  console.log(`  ${COLORS.dim}Persona: Mulher 35a, viu anuncio sobre harmonizacao facial.${COLORS.reset}`);

  const flowA = [
    { msgIn: 'Oi, vi o anuncio de voces no Instagram', expectedPhase: 'abertura' as const, lead: null as LeadData | null },
    { msgIn: 'Queria saber sobre harmonizacao facial', expectedPhase: 'abertura' as const, lead: null, note: 'msg=2 ainda em abertura por regra <=3 (poderia ja ir triagem se procedimento detectado).' },
    { msgIn: 'Voces atendem Unimed?', expectedPhase: 'abertura' as const, lead: { procedimento_desejado: 'harmonizacao facial' }, note: 'Mesmo com procedimento detectado, msg=3 ainda em abertura. Triagem so depois da 4a msg.' },
    { msgIn: 'Tem horario essa semana?', expectedPhase: 'agendamento' as const, lead: { procedimento_desejado: 'harmonizacao facial', convenio: 'Unimed' } },
    { msgIn: 'Pode ser quinta as 10h', expectedPhase: 'agendamento' as const, lead: { procedimento_desejado: 'harmonizacao facial', convenio: 'Unimed' } },
    { msgIn: 'Sim, pode confirmar', expectedPhase: 'agendamento' as const, lead: { procedimento_desejado: 'harmonizacao facial', convenio: 'Unimed' } },
  ];

  let msgCount = 0;
  for (const step of flowA) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn.substring(0, 40)}...") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_A', name: label, status: 'pass', patientMsg: step.msgIn, actual: r.phase });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_A', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO B: Lead frio, paciente seco =====
  subheader('CENARIO B — Lead seco, mensagens curtas');
  console.log(`  ${COLORS.dim}Persona: Homem 50a, manda so "oi" e responde monossilabico.${COLORS.reset}`);

  const flowB = [
    { msgIn: 'oi', expectedPhase: 'abertura' as const, lead: null as LeadData | null },
    { msgIn: 'consulta', expectedPhase: 'abertura' as const, lead: null, note: 'msg=2 e nada qualificado: cai em abertura. POREM regex de schedule pega "consulta" e carrega agenda mesmo assim.' },
    { msgIn: 'sim', expectedPhase: 'abertura' as const, lead: null },
    { msgIn: 'particular', expectedPhase: 'triagem' as const, lead: null, note: 'msg=4: padrao triagem. IA precisa puxar conversa.' },
  ];

  msgCount = 0;
  for (const step of flowB) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn}") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_B', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_B', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO C: Cliente pedindo CANCELAMENTO de consulta =====
  subheader('CENARIO C — Cliente quer CANCELAR consulta (caso critico)');
  console.log(`  ${COLORS.dim}Persona: paciente ja agendado quer cancelar consulta de amanha.${COLORS.reset}`);

  const flowC = [
    { msgIn: 'Bom dia', expectedPhase: 'pos_agendamento' as const, lead: { status: 'agendado', data_agendamento: new Date(Date.now() + 86400000).toISOString() } },
    { msgIn: 'Preciso cancelar minha consulta', expectedPhase: 'pos_agendamento' as const, lead: { status: 'agendado', data_agendamento: new Date(Date.now() + 86400000).toISOString() }, note: 'INESPERADO: lead com data_agendamento futura mantem-se em pos_agendamento mesmo com keyword "cancelar". Handoff so vale se messageCount>2 E nao tem proteção pos_agendamento → IA tenta tratar cancelamento sozinha.' },
  ];

  msgCount = 0;
  for (const step of flowC) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn}") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_C', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_C', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO D: Reagendamento (paciente ja agendado) =====
  subheader('CENARIO D — Cliente quer REMARCAR (transicao pos_agendamento → triagem)');

  const futureLead = { status: 'agendado', data_agendamento: new Date(Date.now() + 86400 * 1000 * 2).toISOString() };

  const flowD = [
    { msgIn: 'Oi tudo bem?', expectedPhase: 'pos_agendamento' as const, lead: futureLead },
    { msgIn: 'Preciso REMARCAR minha consulta', expectedPhase: 'agendamento' as const, lead: futureLead, note: 'wantsNewBooking=true (palavra "remarcar") → sai de pos_agendamento → cai em agendamento.' },
    { msgIn: 'Tem horario sexta?', expectedPhase: 'pos_agendamento' as const, lead: futureLead, note: 'PROBLEMA SUTIL: "tem horario" sem palavra de novo agendamento mantem em pos_agendamento. shouldLoadSchedule=false → IA nao oferece horarios.' },
  ];

  msgCount = 5; // Simulando que ja teve historico
  for (const step of flowD) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn.substring(0, 35)}...") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_D', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_D', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO E: Sintoma grave (emergencia) =====
  subheader('CENARIO E — Emergencia medica');
  const flowE = [
    { msgIn: 'Oi', expectedPhase: 'abertura' as const, lead: null as LeadData | null },
    { msgIn: 'estou com muita dor forte no peito', expectedPhase: 'handoff' as const, lead: null, note: '"dor forte" → handoff de emergencia. CORRETO. IA orienta procurar PS.' },
  ];

  msgCount = 0;
  for (const step of flowE) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn.substring(0, 35)}...") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_E', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_E', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO F: Mensagem com agressividade ("reclamacao") =====
  subheader('CENARIO F — Cliente reclamando');
  const flowF = [
    { msgIn: 'Oi', expectedPhase: 'abertura' as const, lead: null as LeadData | null },
    { msgIn: 'esse atendimento esta uma reclamacao, demoraram muito', expectedPhase: 'abertura' as const, lead: null, note: 'BUG-CONFIRMADO: handoff exige messageCount>2 (router linha 60). Na 2a msg, mesmo com "reclamacao", cai em abertura e IA TENTA responder ao inves de transferir.' },
  ];

  msgCount = 0;
  for (const step of flowF) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn.substring(0, 35)}...") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_F', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_F', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }

  // ===== CENARIO G: Lead com horario passado HOJE =====
  subheader('CENARIO G — Lead pede horario que ja passou (mesmo dia)');
  const flowG = [
    { msgIn: 'Voces tem horario?', expectedPhase: 'agendamento' as const, lead: { procedimento_desejado: 'consulta' }, note: 'Cai em agendamento. Schedule context vai listar somente horarios futuros (filtra na linha 250 do index.ts).' },
    { msgIn: 'pode ser as 09h hoje?', expectedPhase: 'agendamento' as const, lead: { procedimento_desejado: 'consulta', convenio: 'particular' }, note: 'IA deve detectar horario passado e oferecer alternativas. Depende do prompt (regra 9 em prompt.ts).' },
  ];

  msgCount = 4;
  for (const step of flowG) {
    msgCount++;
    const r = detectPhase(msgCount, step.lead, step.msgIn);
    const ok = r.phase === step.expectedPhase;
    const label = `Msg ${msgCount} ("${step.msgIn.substring(0, 35)}...") → ${r.phase}`;
    if (ok) {
      pass(label);
      record({ category: 'flow_G', name: label, status: step.note ? 'warn' : 'pass', patientMsg: step.msgIn, actual: r.phase, detail: step.note });
    } else {
      fail(label, `Esperado ${step.expectedPhase}`);
      record({ category: 'flow_G', name: label, status: 'fail', patientMsg: step.msgIn, expected: step.expectedPhase, actual: r.phase });
    }
  }
}

// =====================================================
// Test Suite 7 — Pontos de Falha Conhecidos
// =====================================================

function testKnownFailures() {
  header('TEST SUITE 7 — PONTOS CRITICOS DE FALHA OPERACIONAL');
  info('Verificando questoes que impedem IA de responder em producao...');

  const findings: Array<{ id: string; severity: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO'; titulo: string; sintoma: string; raiz: string; fix: string }> = [
    {
      id: 'F-01',
      severity: 'CRITICO',
      titulo: 'Auto-reply OFF por default (clinica nunca configurou)',
      sintoma: 'IA nunca responde nada. Cliente reclama que mensagens chegam mas IA fica muda.',
      raiz: 'whatsapp_ai_config.auto_reply_enabled tem DEFAULT false. Se o usuario nunca abriu AISettingsDialog, sequer ha row na tabela. Resultado: globalOn=false → gate retorna false → status: "auto_reply_disabled".',
      fix: 'Considerar default=true ao criar config inicial; OU mostrar banner amarelo na UI quando config.auto_reply_enabled=false; OU criar trigger que insere row default quando primeiro webhook chega.',
    },
    {
      id: 'F-02',
      severity: 'CRITICO',
      titulo: 'Handoff fixa ai_autonomous_mode=false PERMANENTE',
      sintoma: 'Apos paciente dizer "cancelar", "reclamacao", ou ter emergencia, IA nunca mais responde NESSA conversa, mesmo dias depois.',
      raiz: 'Linha 540 do whatsapp-ai-agent/index.ts: UPDATE whatsapp_conversations SET ai_autonomous_mode=false. Sem reset automatico ou expiracao.',
      fix: 'Adicionar coluna handoff_until (timestamp). Apos 24h, voltar a false→null. Ou criar funcao que reseta handoff quando paciente envia nova msg apos N horas.',
    },
    {
      id: 'F-03',
      severity: 'ALTO',
      titulo: 'Palavra "cancelar" tem trigger amplo demais',
      sintoma: 'Frases como "posso cancelar minha consulta de amanha" ou "vou cancelar o convenio antigo" tragam IA → handoff. Cliente legitimo perde atendimento automatizado.',
      raiz: 'router.ts linha 39 inclui "cancelar" sem analise de contexto. Match exato sem distincao de cancelamento de consulta vs cancelamento de assinatura/convenio.',
      fix: 'Restringir handoff de "cancelar" para casos onde o cliente NAO esta no fluxo de agendamento. OU adicionar fase "remarcacao" que oferece reagendamento antes de handoff.',
    },
    {
      id: 'F-04',
      severity: 'ALTO',
      titulo: 'Lock de 60s pode prender IA se houver crash silencioso',
      sintoma: 'Se uma chamada para GPT-4o falha com excecao nao capturada apos lock_acquire mas antes do release, lock fica ate 60s. Mensagens nesse intervalo retornam status:locked sem aviso.',
      raiz: 'Linha 447: try_acquire_ai_lock(60s). Se OAI da timeout/rate limit no callGPT (linha 620), o catch chama safeReleaseLock — OK. Mas erros em buildScheduleContext (linha 549), ou em searchKB (linha 557), nao tem try/catch dedicado de release no caminho.',
      fix: 'Embrulhar bloco principal em try-finally que SEMPRE libera lock. Atualmente o catch global libera no linha 671, mas dentro do try ha vacios. Adicionar try-finally explicito.',
    },
    {
      id: 'F-05',
      severity: 'ALTO',
      titulo: 'OPENAI_API_KEY ausente retorna sucesso mudo',
      sintoma: 'IA retorna 200 OK mas nao envia nada. Webhook nao detecta falha. Cliente vai esperar resposta que nunca chega.',
      raiz: 'Linha 441-444: if (!OAI) return 200 com error msg. Mas webhook usa fire-and-forget — nao loga isso na conversa nem alerta admin.',
      fix: 'Inserir mensagem outbound de fallback ("Estamos com instabilidade, retornaremos em breve") quando OAI faltar. OU enviar evento para tabela debug_alerts visivel ao admin.',
    },
    {
      id: 'F-06',
      severity: 'MEDIO',
      titulo: 'Debounce de 8s pode atrasar respostas',
      sintoma: 'Paciente digita 1 mensagem e espera ate 8s para IA comecar a digitar. Em conversa fluida, parece que IA travou.',
      raiz: 'Linhas 459-464: while loop espera 8s sem nova msg para soltar. Em conversa rapida, esse acumulo de delays parece "robo lento".',
      fix: 'Reduzir para 4-5s e/ou interromper quando primeira msg do batch tem >100 caracteres (provavel msg unica completa).',
    },
    {
      id: 'F-07',
      severity: 'MEDIO',
      titulo: 'Lead extraction silencioso: dados sumindo',
      sintoma: 'Paciente diz "meu nome e Filipe Silva, tenho Bradesco" — mas extractLeadData (gpt-4o-mini) pode falhar silenciosamente (linhas 296-379). IA pergunta de novo.',
      raiz: 'extractLeadData eh chamado em background (linha 648). Se OpenAI retorna nao-JSON ou rate limit, tudo eh silenciado pelo try-catch generico. Sem retry.',
      fix: 'Adicionar log explicito (debug_logs) quando extractLeadData falha. Implementar retry com backoff. Validar JSON com schema antes de upsert.',
    },
    {
      id: 'F-08',
      severity: 'MEDIO',
      titulo: 'CRM contact criado tarde demais',
      sintoma: 'Lead conversa por 5+ msgs em fase "triagem" mas crm_contact nao eh criado. Se paciente abandona conversa antes do agendamento, lead se perde.',
      raiz: 'Linha 519-521: ensureCRMContact so eh chamado nas fases agendamento/pos_agendamento.',
      fix: 'Criar contact desde fase triagem com tag "lead_em_qualificacao". Permite resgatar leads abandonados via remarketing.',
    },
    {
      id: 'F-09',
      severity: 'MEDIO',
      titulo: 'Schedule regex pega "consulta" ate em pergunta de preco',
      sintoma: 'Trigger desnecessario de buildScheduleContext em mensagens irrelevantes (carrega agenda full toda vez). Lentidao acumulada.',
      raiz: 'Linha 547 schRx inclui "consulta" sem qualificadores.',
      fix: 'Restringir para "agendar consulta", "marcar consulta" ou usar contexto com phr.shouldLoadSchedule isoladamente.',
    },
    {
      id: 'F-10',
      severity: 'BAIXO',
      titulo: 'Conversation sem phone_number_id em provider Evolution',
      sintoma: 'Em ambiente Evolution, mark-as-read pula via guard. OK. Mas se historico tem msgs com `provider=meta` antigas, o getWAConfig pode pegar config errada.',
      raiz: 'getWAConfig (linha 30) seleciona is_active=true sem filtro por provider. Se medico tem 2 configs (meta + evolution), retorna a primeira.',
      fix: 'Filtrar getWAConfig pelo provider da conversa OU usar a config primaria (com prioridade definida).',
    },
    {
      id: 'F-11',
      severity: 'ALTO',
      titulo: 'Sem fallback em falha de GPT-4o (linha 619-625)',
      sintoma: 'Se OpenAI da rate limit ou erro 500, IA simplesmente nao responde. Sem retry, sem mensagem de fallback ao paciente.',
      raiz: 'try-catch retorna 200 e libera lock — paciente fica esperando indefinidamente.',
      fix: 'Implementar fallback: enviar "Estou com um momento de instabilidade, ja te respondo!" como mensagem outbound + retry em backoff exponencial.',
    },
    {
      id: 'F-12',
      severity: 'MEDIO',
      titulo: 'Identidade da IA depende 100% de whatsapp_ai_config',
      sintoma: 'Se medico nao preencheu agent_name/specialist_name, IA se chama "Sofia" e o doutor de "nossa equipe". Cliente acha estranho.',
      raiz: 'buildAgentIdentity (linha 14-26) tem fallback Sofia/nossa clinica/nossa equipe.',
      fix: 'Forcar onboarding obrigatorio: na primeira ativacao do auto_reply_enabled, exigir preenchimento de specialist_name + clinic_name.',
    },
    {
      id: 'F-13',
      severity: 'CRITICO',
      titulo: 'Webhook chama agent fire-and-forget sem garantia de execucao',
      sintoma: 'Em ambientes que nao suportam EdgeRuntime.waitUntil (ex: deploy custom), o fetch eh feito sem aguardar — pode morrer com a resposta do webhook.',
      raiz: 'whatsapp-webhook/index.ts linhas 453-479: usa EdgeRuntime.waitUntil quando disponivel, senao fire-and-forget puro.',
      fix: 'Em vez de fire-and-forget, gravar tarefa em fila (ex: pg_cron / supabase_functions.queue) e processar com worker dedicado. Garante retry e observabilidade.',
    },
    {
      id: 'F-14',
      severity: 'ALTO',
      titulo: 'Mark-as-read com timeout pode bloquear thread',
      sintoma: 'Se Meta API esta lenta, mark-as-read (linha 489-494) sem await timeout pode segurar a execucao por muito tempo.',
      raiz: 'fetch sem AbortController. Try/catch protege erro mas nao timeout.',
      fix: 'Adicionar AbortController com timeout 3s no fetch.',
    },
    {
      id: 'F-15',
      severity: 'BAIXO',
      titulo: 'RAG threshold 0.5 pode ser baixo demais',
      sintoma: 'Resultados irrelevantes da knowledge_base podem poluir prompt.',
      raiz: 'searchKB (linha 284): p_match_threshold: 0.5. Para text-embedding-3-small isso eh permissivo.',
      fix: 'Subir para 0.65-0.7 e medir taxa de KB-hit. Adicionar log de similaridade no debug_logs.',
    },
  ];

  for (const f of findings) {
    const tag = f.severity === 'CRITICO' ? `${COLORS.bgRed}${COLORS.bright} CRITICO ` :
                f.severity === 'ALTO' ? `${COLORS.bgYellow} ALTO    ` :
                f.severity === 'MEDIO' ? `${COLORS.yellow} MEDIO   ` : `${COLORS.dim} BAIXO   `;
    console.log(`  ${tag}${COLORS.reset} [${f.id}] ${COLORS.bright}${f.titulo}${COLORS.reset}`);
    console.log(`     ${COLORS.dim}Sintoma: ${f.sintoma}${COLORS.reset}`);
    console.log(`     ${COLORS.dim}Raiz:    ${f.raiz}${COLORS.reset}`);
    console.log(`     ${COLORS.cyan}Fix:     ${f.fix}${COLORS.reset}`);
    console.log('');
    record({
      category: 'finding',
      name: `${f.id} — ${f.titulo}`,
      status: f.severity === 'CRITICO' || f.severity === 'ALTO' ? 'fail' : 'warn',
      detail: `${f.severity}\nSintoma: ${f.sintoma}\nRaiz: ${f.raiz}\nFix: ${f.fix}`,
    });
  }
}

// =====================================================
// Relatorio Final
// =====================================================

function finalReport() {
  header('RELATORIO FINAL — COMPORTAMENTO DA IA');

  const total = results.length;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;

  console.log('');
  console.log(`  ${COLORS.bright}Total de checagens: ${total}${COLORS.reset}`);
  console.log(`  ${COLORS.green}Passaram: ${passed}${COLORS.reset}`);
  console.log(`  ${COLORS.red}Falharam: ${failed}${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}Atencao: ${warned}${COLORS.reset}`);
  console.log('');

  const findings = results.filter(r => r.category === 'finding');
  const criticals = findings.filter(r => r.detail?.startsWith('CRITICO'));
  const alts = findings.filter(r => r.detail?.startsWith('ALTO'));

  console.log(`  ${COLORS.bgRed}${COLORS.bright}  ${criticals.length} achados CRITICOS  ${COLORS.reset}`);
  console.log(`  ${COLORS.bgYellow}${COLORS.bright}  ${alts.length} achados ALTOS     ${COLORS.reset}`);
  console.log('');

  // Salvar relatorio em arquivo
  const reportLines: string[] = [];
  reportLines.push('# RELATORIO DE TESTE — COMPORTAMENTO DA IA');
  reportLines.push('');
  reportLines.push(`**Data:** ${new Date().toISOString()}`);
  reportLines.push(`**Escopo:** whatsapp-ai-agent (router + prompt + handler)`);
  reportLines.push('');
  reportLines.push('## Sumario');
  reportLines.push('');
  reportLines.push(`- Total de checagens: ${total}`);
  reportLines.push(`- Passaram: ${passed}`);
  reportLines.push(`- Falharam: ${failed}`);
  reportLines.push(`- Atencao (warn): ${warned}`);
  reportLines.push(`- **Achados CRITICOS:** ${criticals.length}`);
  reportLines.push(`- **Achados ALTO:** ${alts.length}`);
  reportLines.push('');

  // Listar resultados por categoria
  const cats = ['router', 'identity', 'postprocess', 'gate', 'schedule_regex', 'flow_A', 'flow_B', 'flow_C', 'flow_D', 'flow_E', 'flow_F', 'flow_G', 'finding'];
  for (const cat of cats) {
    const items = results.filter(r => r.category === cat);
    if (items.length === 0) continue;
    reportLines.push(`### ${cat}`);
    reportLines.push('');
    for (const it of items) {
      const icon = it.status === 'pass' ? '+' : it.status === 'fail' ? '-' : '~';
      reportLines.push(`- [${icon}] **${it.name}**${it.patientMsg ? ` (msg: "${it.patientMsg}")` : ''}`);
      if (it.expected || it.actual) reportLines.push(`  - Esperado: \`${it.expected}\` | Obtido: \`${it.actual}\``);
      if (it.detail) reportLines.push(`  - ${it.detail.replace(/\n/g, '\n  - ')}`);
    }
    reportLines.push('');
  }

  // Conclusao
  reportLines.push('## Conclusao');
  reportLines.push('');
  if (criticals.length > 0) {
    reportLines.push('A IA tem **falhas criticas** que explicam o comportamento incorreto reportado. Em especifico:');
    reportLines.push('');
    for (const c of criticals.slice(0, 5)) reportLines.push(`- ${c.name}`);
  }
  reportLines.push('');
  reportLines.push('Detalhes e fixes propostos estao na secao `finding` acima.');

  // Em vez de criar arquivo separado, vamos imprimir um JSON resumido
  console.log(`${COLORS.bright}${COLORS.cyan}---- JSON SUMARIO ----${COLORS.reset}`);
  console.log(JSON.stringify({
    total,
    passed,
    failed,
    warned,
    criticals: criticals.length,
    alts: alts.length,
    cats: Object.fromEntries(cats.map(c => [c, results.filter(r => r.category === c).length])),
  }, null, 2));
  console.log('');

  // Salvar relatorio markdown em scripts/qa/reports/
  try {
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.resolve(process.cwd(), 'scripts', 'qa', 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'ai-behavior-report.md');
    fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');
    console.log(`  ${COLORS.cyan}Relatorio salvo em:${COLORS.reset} ${reportPath}`);
    console.log('');
  } catch (e) {
    console.warn('  Nao foi possivel salvar relatorio:', String(e));
  }

  if (criticals.length === 0 && failed === 0) {
    console.log(`  ${COLORS.bgGreen}${COLORS.bright}  ✓ IA OPERACIONAL — sem achados criticos automatizados  ${COLORS.reset}`);
  } else {
    console.log(`  ${COLORS.bgRed}${COLORS.bright}  ✗ IA APRESENTA PROBLEMAS — ver achados acima  ${COLORS.reset}`);
  }
  console.log('');

  return { total, passed, failed, warned, criticals: criticals.length };
}

// =====================================================
// Main
// =====================================================

async function main() {
  console.log('');
  console.log(`${COLORS.bright}${COLORS.magenta}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.magenta}║  TESTE DE COMPORTAMENTO DA IA — DASHMEDPRO                    ║${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.magenta}║  Simulando interacoes de pacientes reais com whatsapp-ai-agent║${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.magenta}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

  testRouter();
  testIdentity();
  testPostProcess();
  testAutoReplyGate();
  testScheduleRegex();
  testFullConversationSimulation();
  testKnownFailures();
  const summary = finalReport();

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
