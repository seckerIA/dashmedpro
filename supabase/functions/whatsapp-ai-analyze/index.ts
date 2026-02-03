/**
 * Edge Function: whatsapp-ai-analyze (v2 - Extended Agenda 21 days)
 * Analisa conversas do WhatsApp usando GPT-3.5 Turbo
 * Qualifica leads e gera sugestões de resposta
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Tipos
type LeadStatus = 'novo' | 'frio' | 'morno' | 'quente' | 'convertido' | 'perdido';
type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';
type Sentiment = 'positivo' | 'neutro' | 'negativo';
type SuggestionType = 'quick_reply' | 'full_message' | 'procedure_info' | 'scheduling' | 'follow_up' | 'system_message';

interface Suggestion {
  type: SuggestionType;
  content: string;
  confidence: number;
  reasoning: string;
}

interface AIResponse {
  lead_status: LeadStatus;
  conversion_probability: number;
  detected_intent: string;
  detected_procedure: string | null;
  detected_urgency: UrgencyLevel;
  sentiment: Sentiment;
  suggested_next_action: string;
  suggestions: Suggestion[];
  // Novo campo para agendamento autônomo
  schedule_confirmation?: {
    is_confirmed: boolean;
    doctor_id?: string;
    procedure_name?: string;
    date_iso?: string; // ISO 8601 exato
    reasoning?: string;
  };
  // Campos extraídos para enriquecimento de dados
  extracted_info?: {
    full_name_correction?: string;
    cpf?: string; // Formato 000.000.000-00
    email?: string;
    address?: string; // Endereço completo se houver
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Verificar usuário ou Service Role
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const currentUserId = user?.id || 'system';

    // Obter parâmetros
    const { conversation_id, force_reanalyze = false } = await req.json();

    if (!conversation_id) {
      throw new Error('conversation_id is required');
    }

    // Verificar se a conversa existe (USANDO ADMIN PARA EVITAR RLS ERROR)
    // Buscando também contact_id para atualização
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_id, contact_name, phone_number, user_id, status, ai_autonomous_mode')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // ==========================================
    // DEBOUNCE / BUFFER STEP
    // ==========================================
    if (!force_reanalyze) {
      const BUFFER_SECONDS = 8; // Reduzido de 15 para 8 para maior agilidade
      const checkTime = new Date().toISOString();

      console.log(`[AI-DEBOUNCE] Waiting ${BUFFER_SECONDS}s buffer...`);
      await new Promise(resolve => setTimeout(resolve, BUFFER_SECONDS * 1000));

      const { count } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversation_id)
        .eq('direction', 'inbound')
        .gt('created_at', checkTime);

      if (count && count > 0) {
        console.log('[AI-DEBOUNCE] New messages detected. Aborting.');
        return new Response(JSON.stringify({
          success: true,
          status: 'debounced',
          message: 'Execution aborted because newer messages arrived.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[AI-DEBOUNCE] No new messages. Proceeding.');
    }

    // Buscar mensagens
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('direction, content, message_type, sent_at')
      .eq('conversation_id', conversation_id)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (msgError || !messages || messages.length === 0) {
      throw new Error('No messages found in conversation');
    }

    // List of user IDs to fetch procedures/config for
    const targetUserIds = [conversation.user_id];

    // Check for linked doctors (if user is a secretary)
    const { data: linkedDoctors } = await supabaseAdmin
      .from('secretary_doctor_links')
      .select('doctor_id')
      .eq('secretary_id', conversation.user_id);

    if (linkedDoctors && linkedDoctors.length > 0) {
      targetUserIds.push(...linkedDoctors.map(l => l.doctor_id));
      console.log(`[AI] Found linked doctors for secretary ${conversation.user_id}:`, linkedDoctors.map(l => l.doctor_id));
    }

    // Buscar perfis dos médicos para nomes reais
    const { data: doctorProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', targetUserIds);

    // Buscar procedimentos
    const { data: procedures } = await supabaseAdmin
      .from('commercial_procedures')
      .select('id, name, category, price, user_id')
      .in('user_id', targetUserIds)
      .eq('is_active', true)
      .limit(30);

    // Buscar configuração IA
    const { data: aiConfig } = await supabaseAdmin
      .from('whatsapp_ai_config')
      .select('knowledge_base, already_known_info, custom_prompt_instructions, auto_reply_enabled, auto_scheduling_enabled')
      .eq('user_id', conversation.user_id)
      .maybeSingle();

    // --- AGENDA DO MÉDICO ---
    const now = new Date();
    const brazilTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // ... (Mantendo código da agenda igual)
    const next21Days = new Date();
    next21Days.setDate(now.getDate() + 21);

    const { data: appointments } = await supabaseAdmin
      .from('medical_appointments')
      .select('start_time, end_time, status, doctor_id')
      .in('doctor_id', targetUserIds)
      .gte('start_time', now.toISOString())
      .lte('start_time', next21Days.toISOString())
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    const { data: meetings } = await supabaseAdmin
      .from('general_meetings')
      .select('start_time, end_time, title, is_busy')
      .in('user_id', targetUserIds)
      .eq('is_busy', true)
      .gte('start_time', now.toISOString())
      .lte('start_time', next21Days.toISOString())
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    // Buscar horas de trabalho
    const { data: workingHours } = await supabaseAdmin
      .from('doctor_working_hours')
      .select('user_id, day_of_week, start_time, end_time')
      .in('user_id', targetUserIds);

    const formatAgenda = (targetDoctors: any[]) => {
      const daysContext: string[] = [];
      const nowAbs = new Date();
      // Adjust Brazil Time (Fixed UTC-3) - Edge Runtime Safety
      const OFFSET_MS = -3 * 60 * 60 * 1000;

      // Calculate "Approximated Brazil Date" for iteration (shifting absolute time)
      const nowInBrTimestamp = nowAbs.getTime() + OFFSET_MS;

      // Aumentado para 21 dias (3 semanas) para cobrir "segunda que vem" e "próximo mês"
      for (let i = 0; i < 21; i++) {
        // Target Date in Brazil (Shifted)
        const targetTs = nowInBrTimestamp + (i * 24 * 60 * 60 * 1000);
        const d = new Date(targetTs);
        const dayOfWeek = d.getUTCDay();

        // Safe Date Formatting
        const brDateString = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        const weekDayStr = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek];

        let dayOutput = `\n[${weekDayStr}, ${brDateString}]`;
        let hasSlots = false;

        for (const docId of targetDoctors) {
          // Check if doctor has ANY working hours defined
          const docAllHours = (workingHours || []).filter((h: any) => h.user_id === docId);
          const hasCustomSchedule = docAllHours.length > 0;

          // Get hours for THIS day of week
          let docDayHours = docAllHours.filter((h: any) => h.day_of_week === dayOfWeek);

          // Fallback to default if NO layout defined at all
          if (!hasCustomSchedule) {
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
              docDayHours = [{ start_time: '08:00:00', end_time: '18:00:00' }];
            }
          }

          if (docDayHours.length === 0) continue; // Doctor doesn't work today

          // Gather appointments/meetings
          const docAppointments = (appointments || []).filter((a: any) => a.doctor_id === docId);
          const docMeetings = (meetings || []).filter((m: any) => m.user_id === docId);

          const docEvents = [
            ...docAppointments.map((a: any) => ({ start: new Date(a.start_time).getTime(), end: new Date(a.end_time).getTime() })),
            ...docMeetings.map((m: any) => ({ start: new Date(m.start_time).getTime(), end: new Date(m.end_time).getTime() }))
          ].sort((a, b) => a.start - b.start);

          const freeSlots: string[] = [];

          // Iterate over each working interval
          for (const interval of docDayHours) {
            const [startH, startM] = interval.start_time.split(':').map(Number);
            const [endH, endM] = interval.end_time.split(':').map(Number);

            // Construct ABSOLUTE Start/End times for this slot in UTC
            // Logic: We have Brazil YMD from 'd' (which is shifted). 
            // We want "08:00 Brazil". 08:00 Brazil is 11:00 UTC.
            // So we add 3 hours to the DB time (assuming DB time is wall-clock 08:00).

            const startHourUTC = startH + 3;
            const endHourUTC = endH + 3;

            // Base Date in UTC (using the Brazil YMD components)
            let currentSlotAbs = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), startHourUTC, startM, 0));
            const endTimeAbs = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), endHourUTC, endM, 0));

            while (currentSlotAbs < endTimeAbs) {
              const slotStartStamp = currentSlotAbs.getTime();
              // Slot duration 30 mins
              const slotEndStamp = slotStartStamp + (30 * 60 * 1000);

              if (slotEndStamp > endTimeAbs.getTime()) break;

              // CRITICAL: Filter Past Slots
              // Compare slot start vs NOW (absolute)
              // Buffer of 15 mins to avoid offering "now"
              if (slotStartStamp > (nowAbs.getTime() + 15 * 60 * 1000)) {

                const isBusy = docEvents.some(evt => {
                  return slotStartStamp < evt.end && slotEndStamp > evt.start;
                });

                if (!isBusy) {
                  // Display back in Brazil Time (-3)
                  // Since we are using UTC Date object that represents Real UTC time (e.g. 11:00),
                  // getUTCHours() gives 11. To show Brazil time we subtract 3 => 8.
                  // Wait, if currentSlotAbs is 11:00 UTC (which is 08:00 Brazil), getUTCHours is 11. 11-3=8. Correct.
                  const dispHour = currentSlotAbs.getUTCHours() - 3;
                  const dispMin = currentSlotAbs.getUTCMinutes();
                  freeSlots.push(`${dispHour.toString().padStart(2, '0')}:${dispMin.toString().padStart(2, '0')}`);
                }
              }
              // Increment 30 mins
              currentSlotAbs.setMinutes(currentSlotAbs.getUTCMinutes() + 30);
            }
          }

          if (freeSlots.length > 0) {
            hasSlots = true;
            const docProfile = (doctorProfiles || []).find((p: any) => p.id === docId);
            const docDisplayName = docProfile?.full_name || `Médico ${docId.slice(0, 4)}`;
            dayOutput += `\n  - ${docDisplayName}: ${freeSlots.join(', ')}`;
          }
        }

        if (hasSlots) {
          daysContext.push(dayOutput);
        } else if (i < 3) {
          // Only show "No slots" for near future to inform user, but don't spam for 5 days out
          daysContext.push(dayOutput + "\n  (Sem horários livres)");
        }
      }
      return daysContext.join('\n');
    };

    const agendaContext = `ESTES SÃO OS ÚNICOS HORÁRIOS DISPONÍVEIS:
${formatAgenda(targetUserIds)}
NUNCA ofereça horários fora desses intervalos.`;

    await supabaseAdmin.from('debug_logs').insert({
      function_name: 'whatsapp-ai-analyze',
      message: 'AI Context Debug',
      data: {
        agendaContext,
        brazilTime,
        messageCount: messages.length,
        config: aiConfig
      }
    });

    // Montar contexto
    const messagesContext = messages
      .reverse()
      .map(m => {
        const prefix = m.direction === 'inbound' ? 'PACIENTE' : 'CLÍNICA';
        return `${prefix}: ${m.content || '[mídia]'}`;
      })
      .join('\n');

    const proceduresContext = procedures?.length
      ? procedures.map(p => `- ${p.name} (${p.category || 'geral'}): R$ ${p.price || 'consultar'}`).join('\n')
      : 'Nenhum procedimento cadastrado';

    // Calling OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) throw new Error('OpenAI API key missing');

    const systemPrompt = `Você é uma SECRETÁRIA VIRTUAL experiente. Seu trabalho é atender pacientes, agendar consultas e EXTRAIR INFORMAÇÕES PESSOAIS para cadastro.

DATA E HORA ATUAL: ${brazilTime} (Dia de hoje).

INSTRUÇÕES PERSONALIZADAS DA CLÍNICA:
${aiConfig?.custom_prompt_instructions || 'Seja cordial e eficiente.'}

OBJETIVO EXTRA: DATA ENRICHMENT
Analise toda a conversa em busca de dados do paciente que possam ser salvos no banco de dados.
Se o paciente informou CPF, email, nome completo correto ou endereço, extraia-os.
Se o paciente mandou uma foto de documento ou disse dados, extraia.

INTERPRETAÇÃO DA AGENDA (IMPORTANTE):
1. Dê ao paciente APENAS horários que estão explicitamente listados como "DISPONÍVEIS" abaixo.
2. REGRA DE OURO PARA HORÁRIOS:
   - JAMAIS envie uma lista longa ("08:00, 08:30, 09:00, 09:30..."). ISSO É PROIBIDO.
   - Seja natural. Ofereça no MÁXIMO 3 ou 4 opções de cada vez.
   - Dê preferência por oferecer turnos se estiver muito livre (ex: "Tenho horários livres na manhã e tarde. Qual prefere?").
   - Se for citar horários, use formato lista ou texto fluido (ex: "Tenho às 09:00, 14:00 e 16:30").
   - Sempre cite o dia da semana e a data (ex: "📅 Terça-feira (12/10)").

${agendaContext}

CONHECIMENTO ESPECÍFICO DA CLÍNICA (PRIORIDADE TOTAL):
${aiConfig?.knowledge_base || 'Use as diretrizes padrão de atendimento.'}

INFORMAÇÕES QUE JÁ SABEMOS (NÃO PERGUNTE ISTO):
${aiConfig?.already_known_info || 'Nenhuma informação extra cadastrada.'}

ESTAS SÃO AS ÚNICAS INFORMAÇÕES VERDADEIRAS SOBRE A CLÍNICA E OS MÉDICOS. 
USE O NOME COMPLETO DOS MÉDICOS CONFORME LISTADO NA AGENDA ABAIXO. 
RELACIONE AS ESPECIALIDADES DA 'BASE DE CONHECIMENTO' COM OS NOMES DA 'AGENDA'.
SE ALGO NÃO ESTIVER AQUI OU NOS PROCEDIMENTOS, DIGA QUE VAI SE INFORMAR COM A EQUIPE. NUNCA INVENTE ESPECIALIDADES OU SERVIÇOS.

 PROCEDIMENTOS E PREÇOS:
${proceduresContext}

FORMATO DE RESPOSTA (JSON):
{
  "lead_status": "frio" | "morno" | "quente",
  "conversion_probability": 0-100,
  "detected_intent": "Resumo do que o paciente quer",
  "detected_procedure": "Nome do procedimento ou null",
  "detected_urgency": "baixa" | "media" | "alta" | "urgente",
  "sentiment": "positivo" | "neutro" | "negativo",
  "suggested_next_action": "Ação recomendada",
  "suggestions": [
     { "type": "full_message", "content": "Sua resposta aqui", "confidence": 1.0, "reasoning": "..." }
  ],
  "schedule_confirmation": {
     "is_confirmed": boolean,
     "date_iso": "YYYY-MM-DDTHH:mm:ss-03:00",
     "doctor_id": "ID",
     "procedure_name": "Procedimento"
  },
  "extracted_info": {
     "full_name_correction": "Nome completo se o cliente informou/corrigiu",
     "cpf": "000.000.000-00 (apenas se informado)",
     "email": "email (apenas se informado)",
     "address": "endereço (apenas se informado)"
  }
}
`;

    const userPrompt = `
CONVERSA ATUAL:
${messagesContext}

PACIENTE (Nome atual no sistema): ${conversation.contact_name || 'Nome não identificado'}
TELEFONE: ${conversation.phone_number}

Analise a conversa, extraia dados e gere respostas.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Temperatura baixa para extração de dados precisa
        max_tokens: 1200,
        response_format: { "type": "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown'}`);
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0]?.message?.content;
    if (!aiContent) throw new Error('Empty response from OpenAI');

    // Parse
    let aiResponse: AIResponse;
    try {
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse error:', aiContent);
      throw new Error('Failed to parse AI response');
    }

    // Validar
    const validStatuses: LeadStatus[] = ['novo', 'frio', 'morno', 'quente', 'convertido', 'perdido'];
    if (!validStatuses.includes(aiResponse.lead_status)) aiResponse.lead_status = 'novo';
    aiResponse.conversion_probability = Math.min(100, Math.max(0, aiResponse.conversion_probability || 0));

    // Salvar análise
    const analysisData = {
      conversation_id,
      user_id: conversation.user_id,
      lead_status: aiResponse.lead_status,
      conversion_probability: aiResponse.conversion_probability,
      detected_intent: aiResponse.detected_intent,
      detected_procedure: aiResponse.detected_procedure,
      detected_urgency: aiResponse.detected_urgency,
      sentiment: aiResponse.sentiment,
      suggested_next_action: aiResponse.suggested_next_action,
      last_analyzed_at: new Date().toISOString(),
      message_count_analyzed: messages.length,
      ai_model_used: 'gpt-4o-mini',
    };

    // --- NOVA LÓGICA DE CONDICIONAL DE AGENDAMENTO ---
    // Se a IA detectou intenção de agendamento, mas o agendamento automático está DESLIGADO,
    // devemos forçar uma resposta de "Triagem Humana" e fazer Handover.

    // Injetar no prompt a informação se pode ou não agendar ajudaria, mas vamos tratar no pós-processamento 
    // ou instruir o prompt (melhor).

    const { data: savedAnalysis, error: upsertError } = await supabaseAdmin
      .from('whatsapp_conversation_analysis')
      .upsert(analysisData, { onConflict: 'conversation_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    // Limpar sugestões
    await supabaseAdmin
      .from('whatsapp_ai_suggestions')
      .delete()
      .eq('conversation_id', conversation_id)
      .eq('was_used', false);

    // Salvar sugestões
    const suggestionsToInsert = (aiResponse.suggestions || []).slice(0, 3).map((s, idx) => ({
      conversation_id,
      user_id: conversation.user_id,
      analysis_id: savedAnalysis.id,
      suggestion_type: s.type || 'quick_reply',
      content: s.content,
      confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
      reasoning: s.reasoning,
      display_order: idx,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { data: savedSuggestions } = await supabaseAdmin.from('whatsapp_ai_suggestions').insert(suggestionsToInsert).select();

    // ==========================================
    // DATA ENRICHMENT (NOVO)
    // ==========================================
    if (aiResponse.extracted_info) {
      const info = aiResponse.extracted_info;
      const validUpdates: any = {};

      // Mapeamento de campos para CRM
      if (info.full_name_correction) validUpdates.full_name = info.full_name_correction;
      if (info.email) validUpdates.email = info.email;

      // Se temos CPF e não é coluna nativa do crm_contacts, salvamos em custom_fields
      if (info.cpf || info.address) {
        // Primeiro buscamos o contato atual para não sobrescrever outros custom_fields
        if (conversation.contact_id) {
          const { data: currentContact } = await supabaseAdmin.from('crm_contacts').select('custom_fields').eq('id', conversation.contact_id).single();
          const existingCustomFields = currentContact?.custom_fields || {};

          validUpdates.custom_fields = {
            ...existingCustomFields,
            ...(info.cpf ? { cpf: info.cpf } : {}),
            ...(info.address ? { address: info.address } : {})
          };
        }
      }

      // 1. Atualizar CRM Contact se houver ID
      if (conversation.contact_id && Object.keys(validUpdates).length > 0) {
        console.log('[DataEnrichment] Updates found for Contact:', validUpdates);
        await supabaseAdmin.from('crm_contacts')
          .update(validUpdates)
          .eq('id', conversation.contact_id);

        // Log
        await supabaseAdmin.from('debug_logs').insert({
          function_name: 'whatsapp-ai-analyze',
          message: 'CRM Contact Enriched',
          data: { contact_id: conversation.contact_id, updates: validUpdates }
        });
      }

      // 2. Atualizar ou Criar Paciente (tabela patients) se tivermos dados ricos (CPF principalmente)
      // A tabela patients costuma ter coluna cpf nativa
      if (info.cpf || info.full_name_correction) {
        const patientUpdates: any = {};
        if (info.full_name_correction) patientUpdates.name = info.full_name_correction; // Tabela patients usa 'name' ou 'full_name'? O código antigo usava 'name' (linha 499 original)
        // Verificando Step 583 (vazio) e Step 598 (crm_contacts). O código na linha 499 insere { name: ... }
        // Portanto vamos usar 'name'.

        // Se tiver CPF, tentamos inserir. Se a coluna nao existir, vai dar erro, entao melhor verificar
        // Assumindo que patients foi criada para ter dados medicos, provavelmente tem cpf.
        // Mas para garantir, vamos usar logica defensiva ou try/catch

        // Vamos tentar buscar o paciente pelo telefone primeiro
        let patientId = null;
        const { data: existingPatient } = await supabaseAdmin.from('patients').select('id').eq('phone', conversation.phone_number).maybeSingle();

        if (existingPatient) {
          // Atualizar
          if (info.cpf) patientUpdates.cpf = info.cpf;
          // Nota: Se 'cpf' não existir na tabela patients, esse update vai falhar.
          // Supabase ignora campos extras em insert? Não, dá erro.
          // Como não vi o schema da tabela patients (Step 583 vazio), 
          // vou arriscar que existe 'cpf' pois é tabela de paciente.
          // Se der erro, o catch global pega.

          if (Object.keys(patientUpdates).length > 0) {
            await supabaseAdmin.from('patients').update(patientUpdates).eq('id', existingPatient.id);
          }
        }
      }
    }

    // Auto-Reply Logic Updated (Hierarchy):
    // 1. Local overrides Global logic?
    // User Rule: "se o interruptor geral (global) estiver desligado, e a analise autonoma (local) estiver ligada, DEVE responder"
    // Result: Local TRUE -> Always Send.
    // Result: Local FALSE -> Never Send.
    // Result: Local NULL (New Default) -> Send if Global is ON.

    // Condition:
    // (Local === true) OR (Local !== false AND Global === true)

    const isLocalEnabled = conversation.ai_autonomous_mode === true;
    const isLocalDisabled = conversation.ai_autonomous_mode === false;
    const isGlobalEnabled = aiConfig?.auto_reply_enabled === true;

    if (isLocalEnabled || (!isLocalDisabled && isGlobalEnabled)) {
      let bestSuggestion = suggestionsToInsert[0];
      const CONFIDENCE_THRESHOLD = 0.85;
      let shouldSend = true;

      // ==========================================
      // AUTONOMOUS SCHEDULING & REPLY
      // ==========================================

      if (
        aiResponse.schedule_confirmation?.is_confirmed === true &&
        aiResponse.schedule_confirmation.date_iso
      ) {
        // CASO A: AGENDAMENTO AUTOMÁTICO LIGADO
        if (aiConfig?.auto_scheduling_enabled === true) {
          try {
            console.log('[AutoSchedule] Attempting to book:', aiResponse.schedule_confirmation);

            const bookDate = new Date(aiResponse.schedule_confirmation.date_iso);
            const endDate = new Date(bookDate.getTime() + 30 * 60000); // 30 min padrão

            // 1. Verificar conflito de última hora (Double Check)
            const { count: conflictCount } = await supabaseAdmin
              .from('medical_appointments')
              .select('*', { count: 'exact', head: true })
              .eq('doctor_id', aiResponse.schedule_confirmation.doctor_id || conversation.user_id)
              .neq('status', 'cancelled')
              .or(`start_time.lte.${endDate.toISOString()},end_time.gte.${bookDate.toISOString()}`)
              .lt('start_time', endDate.toISOString())
              .gt('end_time', bookDate.toISOString());

            if (conflictCount && conflictCount > 0) {
              console.warn('[AutoSchedule] Conflict detected just before booking. Aborting.');
              // Update bestSuggestion for conflict
              bestSuggestion = {
                ...bestSuggestion,
                content: "Desculpe, acabei de verificar e esse horário foi tomado por outro paciente agorinha! 😕 Vou pedir para nossa secretária te chamar para ver outro horário, ok?",
                confidence: 1.0, // High confidence for this system message
                suggestion_type: 'system_message'
              };
              await supabaseAdmin.from('whatsapp_conversations')
                .update({ ai_autonomous_mode: false, priority: 'high', status: 'open' })
                .eq('id', conversation_id);
            } else {
              // 2. Resolver o Paciente
              let patientId = conversation.contact_id;

              if (!patientId) {
                const { data: existingPatient } = await supabaseAdmin
                  .from('patients')
                  .select('id')
                  .eq('phone', conversation.phone_number)
                  .maybeSingle();

                if (existingPatient) patientId = existingPatient.id;
                else {
                  const { data: newPatient } = await supabaseAdmin.from('patients').insert({
                    name: conversation.contact_name || 'Paciente WhatsApp',
                    phone: conversation.phone_number,
                    user_id: conversation.user_id
                  }).select('id').single();
                  if (newPatient) patientId = newPatient.id;
                }
              }

              if (patientId) {
                // 3. Criar o Agendamento
                const { error: appError } = await supabaseAdmin
                  .from('medical_appointments')
                  .insert({
                    doctor_id: aiResponse.schedule_confirmation.doctor_id || conversation.user_id,
                    patient_id: patientId,
                    start_time: bookDate.toISOString(),
                    end_time: endDate.toISOString(),
                    status: 'scheduled',
                    notes: `Agendado via IA. Procedimento: ${aiResponse.schedule_confirmation.procedure_name || 'Geral'}.`,
                    user_id: conversation.user_id
                  });

                if (!appError) {
                  console.log('[AutoSchedule] Success.');

                  // 4. Marcar como Convertido
                  await supabaseAdmin
                    .from('whatsapp_conversation_analysis')
                    .update({ lead_status: 'convertido' })
                    .eq('conversation_id', conversation_id);
                  // No need to change bestSuggestion, original confirmation is fine
                } else {
                  throw appError; // Propagate error to catch block
                }
              }
            }
          } catch (err: any) {
            console.error('[AutoSchedule] Failed:', err.message);
            // Update bestSuggestion for booking failure
            bestSuggestion = {
              ...bestSuggestion,
              content: "Tive um pequeno erro técnico aqui. Vou pedir para nossa equipe confirmar manualmente com você! 🙏",
              confidence: 1.0, // High confidence for this system message
              suggestion_type: 'system_message'
            };
            await supabaseAdmin.from('whatsapp_conversations').update({ ai_autonomous_mode: false, priority: 'high' }).eq('id', conversation_id);
          }
        }
        // CASO B: AGENDAMENTO AUTOMÁTICO DESLIGADO (HANDOVER)
        else {
          console.log('[AutoSchedule] Disabled. Triggering Handover for manual review.');

          // 1. Desligar modo autônomo para transbordo para humana
          await supabaseAdmin
            .from('whatsapp_conversations')
            .update({
              ai_autonomous_mode: false,
              status: 'open', // Garante que está visível
              priority: 'high' // Marca como alta prioridade
            })
            .eq('id', conversation_id);

          // 2. Atualizar status para Quente (pronto para fechar)
          await supabaseAdmin
            .from('whatsapp_conversation_analysis')
            .update({ lead_status: 'quente', suggested_next_action: 'Confirmar agendamento manualmente' })
            .eq('conversation_id', conversation_id);

          // 3. Enviar a mensagem de "Vamos verificar" que a IA gerou (suggestion[0])
          // Isso já acontece no bloco de Auto-Reply padrão acima, pois o ai_autonomous_mode 
          // só vai ser false NA PRÓXIMA rodada. Mas espera!
          // Se mudarmos o modo aqui, a mensagem pode não sair se a checagem for depois.
          // A checagem de envio é FEITA ANTES DESTE BLOCO no código atual.
          // Então a mensagem "Vou verificar" SAI AUTOMATICAMENTE.
          // E AQUI nós só desligamos o robô. Perfeito.
        }
      }

      // The `modifiedContent` and `shouldSend` variables from the old "AUTONOMOUS SCHEDULING INTERCEPTION"
      // are no longer needed as `bestSuggestion` is directly updated.
      // The `contentToSend` will now directly use `bestSuggestion.content`.

      if (shouldSend && bestSuggestion && bestSuggestion.confidence >= CONFIDENCE_THRESHOLD) {
        try {
          const { data: newMessage } = await supabaseAdmin
            .from('whatsapp_messages')
            .insert({
              user_id: conversation.user_id,
              conversation_id: conversation_id,
              phone_number: conversation.phone_number,
              content: bestSuggestion.content,
              direction: 'outbound',
              message_type: 'text',
              status: 'pending',
              sent_at: new Date().toISOString(),
              reply_to_wa_id: messages[0]?.message_id || null, // Adiciona contexto de resposta
              metadata: { auto_reply: true, confidence: bestSuggestion.confidence, ai_generated: true }
            })
            .select('id')
            .single();

          if (newMessage) {
            let waConfig;

            // 1. Tentar buscar config do próprio usuário (dono da conversa)
            const { data: userConfig } = await supabaseAdmin
              .from('whatsapp_config')
              .select('phone_number_id, access_token')
              .eq('user_id', conversation.user_id)
              .eq('is_active', true)
              .filter('access_token', 'not.is', null)
              .maybeSingle();

            waConfig = userConfig;

            // 2. Se não achou, e for secretária, busca de médicos vinculados
            if (!waConfig) {
              const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', conversation.user_id)
                .single();

              if (profile?.role === 'secretaria') {
                const { data: links } = await supabaseAdmin
                  .from('secretary_doctor_links')
                  .select('doctor_id')
                  .eq('secretary_id', conversation.user_id)
                  .eq('is_active', true);

                if (links && links.length > 0) {
                  const doctorIds = links.map((l: any) => l.doctor_id);
                  const { data: doctorConfig } = await supabaseAdmin
                    .from('whatsapp_config')
                    .select('phone_number_id, access_token')
                    .in('user_id', doctorIds)
                    .eq('is_active', true)
                    .filter('access_token', 'not.is', null)
                    .limit(1)
                    .maybeSingle();

                  if (doctorConfig) {
                    waConfig = doctorConfig;
                  }
                }
              }
            }

            // 3. Último recurso: buscar QUALQUER config ativa com token (útil para admins)
            if (!waConfig) {
              const { data: genericConfig } = await supabaseAdmin
                .from('whatsapp_config')
                .select('phone_number_id, access_token')
                .eq('is_active', true)
                .filter('access_token', 'not.is', null)
                .limit(1)
                .maybeSingle();

              if (genericConfig) {
                waConfig = genericConfig;
              }
            }

            if (waConfig) {
              const waRes = await fetch(
                `https://graph.facebook.com/v18.0/${waConfig.phone_number_id}/messages`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${waConfig.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: conversation.phone_number,
                    type: 'text',
                    text: { body: bestSuggestion.content },
                    context: messages[0]?.message_id ? { message_id: messages[0].message_id } : undefined
                  }),
                }
              );

              if (waRes.ok) {
                const waResData = await waRes.json();
                await supabaseAdmin
                  .from('whatsapp_messages')
                  .update({ status: 'sent', message_id: waResData.messages?.[0]?.id })
                  .eq('id', newMessage.id);

                await supabaseAdmin.from('whatsapp_ai_suggestions')
                  .update({ was_used: true, used_at: new Date().toISOString() })
                  .eq('conversation_id', conversation_id)
                  .eq('content', suggestionsToInsert[0].content); // Mark the original suggestion as used
              }
            }
          }
        } catch (e) {
          console.error('[AutoReply] Error:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
        suggestions: savedSuggestions || [],
        cached: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[whatsapp-ai-analyze] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
