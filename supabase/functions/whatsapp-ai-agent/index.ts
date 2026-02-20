/**
 * Edge Function: whatsapp-ai-agent
 * Agente de IA humanizado para WhatsApp — estilo Sophia, adaptado para clínicas médicas
 *
 * Fluxo:
 * 1. Acquire atomic lock (try_acquire_ai_lock)
 * 2. Wait 5s debounce
 * 3. Mark as read (blue check)
 * 4. Load history (20 msgs)
 * 5. Detect phase (heuristic)
 * 6. Load lead data
 * 7. [If agendamento] Load available slots
 * 8. [If RAG needed] Search knowledge base
 * 9. GPT-4o generation with phase prompt
 * 10. Post-process: emoji limit + [SPLIT] + auto-split
 * 11. Send messages with typing simulation
 * 12. Extract lead data in background (GPT-4o-mini)
 * 13. Release lock
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { detectPhase, type LeadData } from './router.ts';
import { buildPhasePrompt, buildLeadExtractionPrompt, type AgentIdentity } from './prompt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// Brazil timezone offset (UTC-3)
const BR_OFFSET_MS = -3 * 60 * 60 * 1000;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let conversationId: string | null = null;

  try {
    const body = await req.json();
    conversationId = body.conversation_id;
    const messageContent = body.message_content || '';
    const phoneNumber = body.phone_number;
    const phoneNumberId = body.phone_number_id;
    const userId = body.user_id;

    if (!conversationId) throw new Error('conversation_id is required');

    // ==========================================
    // STEP 1: ACQUIRE ATOMIC LOCK
    // ==========================================
    const { data: lockAcquired } = await supabase.rpc('try_acquire_ai_lock', {
      p_conversation_id: conversationId,
      p_lock_seconds: 35,
    });

    if (!lockAcquired) {
      console.log('[Agent] Lock not acquired — another instance is handling this conversation');
      return new Response(JSON.stringify({ status: 'locked' }), { status: 200, headers: corsHeaders });
    }

    console.log(`[Agent] Lock acquired for conversation ${conversationId}`);

    // ==========================================
    // STEP 2: DEBOUNCE (wait 5s for additional messages)
    // ==========================================
    const debounceStart = new Date().toISOString();
    await sleep(5000);

    const { count: newMsgCount } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .gt('created_at', debounceStart);

    if (newMsgCount && newMsgCount > 0) {
      console.log('[Agent] New messages arrived during debounce. Aborting (newer instance will handle).');
      await supabase.rpc('release_ai_lock', { p_conversation_id: conversationId });
      return new Response(JSON.stringify({ status: 'debounced' }), { status: 200, headers: corsHeaders });
    }

    // ==========================================
    // STEP 3: LOAD CONVERSATION & CONFIG
    // ==========================================
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id, contact_id, contact_name, phone_number, user_id, status, ai_autonomous_mode, phone_number_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) throw new Error('Conversation not found');

    // Check auto-reply permissions
    const isLocalEnabled = conversation.ai_autonomous_mode === true;
    const isLocalDisabled = conversation.ai_autonomous_mode === false;

    // Load AI config
    const { data: aiConfig } = await supabase
      .from('whatsapp_ai_config')
      .select('*')
      .eq('user_id', conversation.user_id)
      .maybeSingle();

    const isGlobalEnabled = aiConfig?.auto_reply_enabled === true;
    const shouldAutoReply = isLocalEnabled || (!isLocalDisabled && isGlobalEnabled);

    if (!shouldAutoReply) {
      console.log('[Agent] Auto-reply disabled. Releasing lock.');
      await supabase.rpc('release_ai_lock', { p_conversation_id: conversationId });
      return new Response(JSON.stringify({ status: 'auto_reply_disabled' }), { status: 200, headers: corsHeaders });
    }

    // ==========================================
    // STEP 3b: MARK AS READ (blue check)
    // ==========================================
    const waConfig = await getWhatsAppConfig(supabase, conversation.user_id);
    if (waConfig) {
      // Get the last inbound message_id for read receipt
      const { data: lastInbound } = await supabase
        .from('whatsapp_messages')
        .select('message_id')
        .eq('conversation_id', conversationId)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastInbound?.message_id) {
        try {
          await fetch(`https://graph.facebook.com/v18.0/${waConfig.phone_number_id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waConfig.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              status: 'read',
              message_id: lastInbound.message_id,
            }),
          });
        } catch (e) {
          console.warn('[Agent] Failed to mark as read:', e);
        }
      }
    }

    // ==========================================
    // STEP 4: LOAD HISTORY (last 20 messages)
    // ==========================================
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('id, message_id, direction, content, message_type, sent_at')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (!messages || messages.length === 0) throw new Error('No messages found');

    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    const lastInboundMsg = inboundMessages[0]?.content || '';
    const totalInboundCount = inboundMessages.length;

    // ==========================================
    // STEP 5: LOAD LEAD DATA
    // ==========================================
    const { data: leadData } = await supabase
      .from('whatsapp_lead_qualifications')
      .select('*')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    // ==========================================
    // STEP 6: DETECT PHASE
    // ==========================================
    const phaseResult = detectPhase(totalInboundCount, leadData as LeadData | null, lastInboundMsg);
    console.log(`[Agent] Phase: ${phaseResult.phase} — ${phaseResult.reason}`);

    // If handoff, disable auto-reply and exit
    if (phaseResult.phase === 'handoff') {
      // Send handoff message first
      const identity = buildAgentIdentity(aiConfig);
      const handoffPrompt = buildPhasePrompt('handoff', identity);
      const handoffResponse = await callGPT(handoffPrompt, messages, conversation, '');

      if (handoffResponse && waConfig) {
        const parts = splitMessage(handoffResponse);
        for (const part of parts) {
          await typingDelay(part);
          await sendWhatsAppMessage(waConfig, conversation.phone_number, part, supabase, conversationId, conversation.user_id);
        }
      }

      // Disable auto-reply for this conversation
      await supabase
        .from('whatsapp_conversations')
        .update({ ai_autonomous_mode: false, priority: 'high', status: 'open' })
        .eq('id', conversationId);

      await supabase.rpc('release_ai_lock', { p_conversation_id: conversationId });
      return new Response(JSON.stringify({ status: 'handoff' }), { status: 200, headers: corsHeaders });
    }

    // ==========================================
    // STEP 7: LOAD SCHEDULE (if needed)
    // ==========================================
    let scheduleContext = '';
    if (phaseResult.shouldLoadSchedule) {
      scheduleContext = await buildScheduleContext(supabase, conversation.user_id);
    }

    // ==========================================
    // STEP 8: RAG KNOWLEDGE BASE SEARCH (if needed)
    // ==========================================
    let ragContext = '';
    if (phaseResult.shouldLoadRAG) {
      ragContext = await searchKnowledgeBase(supabase, conversation.user_id, lastInboundMsg, aiConfig?.knowledge_base);
    }

    // ==========================================
    // STEP 9: BUILD PROMPT & CALL GPT-4o
    // ==========================================
    const identity = buildAgentIdentity(aiConfig);
    const systemPrompt = buildPhasePrompt(phaseResult.phase, identity);

    // Add schedule and RAG context
    let extraContext = '';
    if (scheduleContext) {
      extraContext += `\n\nAGENDA DE HORÁRIOS DISPONÍVEIS:\n${scheduleContext}\nNUNCA ofereça horários fora desses.\n`;
    }
    if (ragContext) {
      extraContext += `\n\nBASE DE CONHECIMENTO (USE COMO REFERÊNCIA):\n${ragContext}\n`;
    }

    // Procedures context
    const targetUserIds = [conversation.user_id];
    const { data: linkedDoctors } = await supabase
      .from('secretary_doctor_links')
      .select('doctor_id')
      .eq('secretary_id', conversation.user_id);
    if (linkedDoctors?.length) targetUserIds.push(...linkedDoctors.map(l => l.doctor_id));

    const { data: procedures } = await supabase
      .from('commercial_procedures')
      .select('id, name, category, price')
      .in('user_id', targetUserIds)
      .eq('is_active', true)
      .limit(30);

    if (procedures?.length) {
      extraContext += `\n\nPROCEDIMENTOS DA CLÍNICA:\n${procedures.map(p => `- ${p.name} (${p.category || 'geral'}): R$ ${p.price || 'consultar'}`).join('\n')}\n`;
    }

    const fullSystemPrompt = systemPrompt + extraContext;

    const aiResponseText = await callGPT(fullSystemPrompt, messages, conversation, lastInboundMsg);

    if (!aiResponseText) {
      console.error('[Agent] Empty GPT response');
      await supabase.rpc('release_ai_lock', { p_conversation_id: conversationId });
      return new Response(JSON.stringify({ status: 'empty_response' }), { status: 200, headers: corsHeaders });
    }

    // ==========================================
    // STEP 10: POST-PROCESS (emoji limit + split)
    // ==========================================
    const processed = postProcess(aiResponseText);

    // ==========================================
    // STEP 11: SEND MESSAGES WITH TYPING SIMULATION
    // ==========================================
    if (waConfig) {
      for (const part of processed) {
        await typingDelay(part);
        await sendWhatsAppMessage(waConfig, conversation.phone_number, part, supabase, conversationId, conversation.user_id);
      }
      console.log(`[Agent] Sent ${processed.length} message parts`);
    } else {
      console.warn('[Agent] No WhatsApp config found. Skipping send.');
    }

    // ==========================================
    // STEP 12: BACKGROUND LEAD EXTRACTION (GPT-4o-mini)
    // 12. Extract lead data in background (GPT-4o-mini)
    // Runs in background (fire and forget)
    extractLeadData(supabase, conversationId, messages, conversation, leadData, conversation.user_id).catch(e => console.warn('[Agent] Extraction error:', e));

    // ==========================================
    // STEP 13: UPDATE ANALYSIS TABLE (for dashboard)
    // ==========================================
    try {
      await updateAnalysis(supabase, conversationId, conversation.user_id, messages.length, phaseResult.phase);
    } catch (e) {
      console.warn('[Agent] Analysis update failed:', e);
    }

    // ==========================================
    // STEP 14: RELEASE LOCK
    // ==========================================
    await supabase.rpc('release_ai_lock', { p_conversation_id: conversationId });
    console.log(`[Agent] Lock released for conversation ${conversationId}`);

    return new Response(JSON.stringify({ status: 'success', phase: phaseResult.phase, parts: processed.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Agent] Error:', error.message);

    // Always release lock on error
    if (conversationId) {
      const supabaseCleanup = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await supabaseCleanup.rpc('release_ai_lock', { p_conversation_id: conversationId }).catch(() => { });
      await supabaseCleanup.from('debug_logs').insert({
        function_name: 'whatsapp-ai-agent',
        message: 'Agent Error',
        data: { conversation_id: conversationId, error: error.message, stack: error.stack },
      }).catch(() => { });
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildAgentIdentity(aiConfig: any): AgentIdentity {
  return {
    agent_name: aiConfig?.agent_name || 'Sofia',
    clinic_name: aiConfig?.clinic_name || 'nossa clínica',
    specialist_name: aiConfig?.specialist_name || 'nossa equipe',
    agent_greeting: aiConfig?.agent_greeting || undefined,
    custom_prompt_instructions: aiConfig?.custom_prompt_instructions || undefined,
    already_known_info: aiConfig?.already_known_info || undefined,
  };
}

async function getWhatsAppConfig(supabase: any, userId: string) {
  // 1. Try user's own config
  const { data: userConfig } = await supabase
    .from('whatsapp_config')
    .select('phone_number_id, access_token')
    .eq('user_id', userId)
    .eq('is_active', true)
    .filter('access_token', 'not.is', null)
    .maybeSingle();

  if (userConfig) return userConfig;

  // 2. Try linked doctors (if secretary)
  const { data: links } = await supabase
    .from('secretary_doctor_links')
    .select('doctor_id')
    .eq('secretary_id', userId)
    .eq('is_active', true);

  if (links?.length) {
    const { data: doctorConfig } = await supabase
      .from('whatsapp_config')
      .select('phone_number_id, access_token')
      .in('user_id', links.map((l: any) => l.doctor_id))
      .eq('is_active', true)
      .filter('access_token', 'not.is', null)
      .limit(1)
      .maybeSingle();

    if (doctorConfig) return doctorConfig;
  }

  // 3. Fallback: any active config
  const { data: anyConfig } = await supabase
    .from('whatsapp_config')
    .select('phone_number_id, access_token')
    .eq('is_active', true)
    .filter('access_token', 'not.is', null)
    .limit(1)
    .maybeSingle();

  return anyConfig;
}

async function callGPT(systemPrompt: string, messages: any[], conversation: any, lastInbound: string): Promise<string> {
  const brazilTime = new Date(Date.now() + BR_OFFSET_MS).toISOString().replace('T', ' ').substring(0, 16);

  const messagesContext = [...messages]
    .reverse()
    .map(m => {
      const prefix = m.direction === 'inbound' ? 'PACIENTE' : 'CLÍNICA';
      return `${prefix}: ${m.content || '[mídia]'}`;
    })
    .join('\n');

  const userPrompt = `DATA E HORA ATUAL: ${brazilTime} (Horário de Brasília)

CONVERSA ATUAL:
${messagesContext}

PACIENTE: ${conversation.contact_name || 'Nome não identificado'}
TELEFONE: ${conversation.phone_number}

Responda como a assistente da clínica. Use [SPLIT] para dividir em mensagens curtas.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(`OpenAI error: ${errData.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Post-process: limit emojis, split by [SPLIT], auto-split long parts
 */
function postProcess(text: string): string[] {
  // 1. Clean prefixes like "Sofia:" or "Assistente:"
  let cleaned = text.replace(/^(Sofia|Assistente|IA|Bot)\s*:\s*/gim, '').trim();

  // 2. Limit emojis to max 1 across entire response
  const emojiRegex = /\p{Emoji_Presentation}/gu;
  const emojis = cleaned.match(emojiRegex) || [];
  if (emojis.length > 1) {
    let emojiCount = 0;
    cleaned = cleaned.replace(emojiRegex, (match) => {
      emojiCount++;
      return emojiCount <= 1 ? match : '';
    });
  }

  // 3. Split by [SPLIT] marker
  let parts = cleaned
    .split(/\[SPLIT\]/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // 4. Auto-split parts that are too long (>120 chars)
  const finalParts: string[] = [];
  for (const part of parts) {
    if (part.length <= 120) {
      finalParts.push(part);
    } else {
      // Split on sentence boundaries
      const sentences = part.split(/(?<=[.!?])\s+/);
      let current = '';
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > 120 && current) {
          finalParts.push(current.trim());
          current = sentence;
        } else {
          current = current ? current + ' ' + sentence : sentence;
        }
      }
      if (current.trim()) finalParts.push(current.trim());
    }
  }

  return finalParts.length > 0 ? finalParts : [cleaned || 'Olá! Como posso te ajudar?'];
}

/**
 * Typing delay — proportional to message length
 */
async function typingDelay(text: string): Promise<void> {
  const len = text.length;
  let delay: number;
  if (len < 30) delay = 800;
  else if (len < 80) delay = 1200;
  else if (len < 150) delay = 1800;
  else delay = 2500;

  // Add some randomness (±300ms)
  delay += Math.floor(Math.random() * 600) - 300;
  await sleep(Math.max(500, delay));
}

/**
 * Send a single WhatsApp text message via Graph API
 */
async function sendWhatsAppMessage(
  config: { phone_number_id: string; access_token: string },
  to: string,
  text: string,
  supabase: any,
  conversationId: string,
  userId: string,
): Promise<void> {
  // 1. Save to DB first
  const { data: savedMsg } = await supabase
    .from('whatsapp_messages')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      phone_number: to,
      content: text,
      direction: 'outbound',
      message_type: 'text',
      status: 'pending',
      sent_at: new Date().toISOString(),
      metadata: { auto_reply: true, ai_generated: true, agent: 'whatsapp-ai-agent' },
    })
    .select('id')
    .single();

  // 2. Send via Graph API
  try {
    const waRes = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (waRes.ok && savedMsg) {
      const waData = await waRes.json();
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'sent', message_id: waData.messages?.[0]?.id })
        .eq('id', savedMsg.id);
    }
  } catch (e) {
    console.error('[Agent] WhatsApp send error:', e);
    if (savedMsg) {
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'failed', error_message: String(e) })
        .eq('id', savedMsg.id);
    }
  }
}

/**
 * Split helper for direct use
 */
function splitMessage(text: string): string[] {
  return postProcess(text);
}

/**
 * Build schedule context (available slots for next 5 days)
 * Reused from whatsapp-ai-analyze
 */
async function buildScheduleContext(supabase: any, userId: string): Promise<string> {
  const targetUserIds = [userId];

  const { data: linkedDoctors } = await supabase
    .from('secretary_doctor_links')
    .select('doctor_id')
    .eq('secretary_id', userId);

  if (linkedDoctors?.length) {
    targetUserIds.push(...linkedDoctors.map((l: any) => l.doctor_id));
  }

  const { data: doctorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', targetUserIds);

  const now = new Date();
  const next5Days = new Date();
  next5Days.setDate(now.getDate() + 5);

  const { data: appointments } = await supabase
    .from('medical_appointments')
    .select('start_time, end_time, status, doctor_id')
    .in('doctor_id', targetUserIds)
    .gte('start_time', now.toISOString())
    .lte('start_time', next5Days.toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  const { data: meetings } = await supabase
    .from('general_meetings')
    .select('start_time, end_time, title, is_busy')
    .in('user_id', targetUserIds)
    .eq('is_busy', true)
    .gte('start_time', now.toISOString())
    .lte('start_time', next5Days.toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  const { data: workingHours } = await supabase
    .from('doctor_working_hours')
    .select('user_id, day_of_week, start_time, end_time')
    .in('user_id', targetUserIds);

  const daysContext: string[] = [];
  const nowAbs = new Date();
  const nowInBrTimestamp = nowAbs.getTime() + BR_OFFSET_MS;

  for (let i = 0; i < 5; i++) {
    const targetTs = nowInBrTimestamp + (i * 24 * 60 * 60 * 1000);
    const d = new Date(targetTs);
    const dayOfWeek = d.getUTCDay();

    const brDateString = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    const weekDayStr = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek];

    let dayOutput = `\n[${weekDayStr}, ${brDateString}]`;
    let hasSlots = false;

    for (const docId of targetUserIds) {
      const docAllHours = (workingHours || []).filter((h: any) => h.user_id === docId);
      const hasCustomSchedule = docAllHours.length > 0;
      let docDayHours = docAllHours.filter((h: any) => h.day_of_week === dayOfWeek);

      if (!hasCustomSchedule) {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          docDayHours = [{ start_time: '08:00:00', end_time: '18:00:00' }];
        }
      }

      if (docDayHours.length === 0) continue;

      const docEvents = [
        ...(appointments || []).filter((a: any) => a.doctor_id === docId).map((a: any) => ({ start: new Date(a.start_time).getTime(), end: new Date(a.end_time).getTime() })),
        ...(meetings || []).filter((m: any) => m.user_id === docId).map((m: any) => ({ start: new Date(m.start_time).getTime(), end: new Date(m.end_time).getTime() })),
      ].sort((a, b) => a.start - b.start);

      const freeSlots: string[] = [];

      for (const interval of docDayHours) {
        const [startH, startM] = interval.start_time.split(':').map(Number);
        const [endH, endM] = interval.end_time.split(':').map(Number);

        const startHourUTC = startH + 3;
        const endHourUTC = endH + 3;

        let currentSlotAbs = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), startHourUTC, startM, 0));
        const endTimeAbs = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), endHourUTC, endM, 0));

        while (currentSlotAbs < endTimeAbs) {
          const slotStartStamp = currentSlotAbs.getTime();
          const slotEndStamp = slotStartStamp + (30 * 60 * 1000);

          if (slotEndStamp > endTimeAbs.getTime()) break;

          if (slotStartStamp > (nowAbs.getTime() + 15 * 60 * 1000)) {
            const isBusy = docEvents.some(evt => slotStartStamp < evt.end && slotEndStamp > evt.start);

            if (!isBusy) {
              const slotTimeLabel = currentSlotAbs.toLocaleTimeString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              freeSlots.push(slotTimeLabel);
            }
          }
          currentSlotAbs.setMinutes(currentSlotAbs.getUTCMinutes() + 30);
        }
      }

      if (freeSlots.length > 0) {
        hasSlots = true;
        const docProfile = (doctorProfiles || []).find((p: any) => p.id === docId);
        const docDisplayName = docProfile?.full_name || `Médico`;
        dayOutput += `\n  - ${docDisplayName}: ${freeSlots.join(', ')}`;
      }
    }

    if (hasSlots) {
      daysContext.push(dayOutput);
    } else if (i < 3) {
      daysContext.push(dayOutput + '\n  (Sem horários livres)');
    }
  }

  return daysContext.join('\n');
}

/**
 * RAG Knowledge Base search
 */
async function searchKnowledgeBase(supabase: any, userId: string, query: string, fallbackKB?: string): Promise<string> {
  // Try vector search first
  try {
    // Generate embedding for the query
    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query.substring(0, 2000) }),
    });

    if (embResponse.ok) {
      const embData = await embResponse.json();
      const queryEmbedding = embData.data?.[0]?.embedding;

      if (queryEmbedding) {
        const { data: matches } = await supabase.rpc('match_knowledge', {
          p_user_id: userId,
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.5,
          p_match_count: 3,
        });

        if (matches?.length) {
          return matches
            .map((m: any) => `[${m.category}] ${m.title}:\n${m.content}`)
            .join('\n\n');
        }
      }
    }
  } catch (e) {
    console.warn('[Agent] RAG search failed, using fallback KB:', e);
  }

  // Fallback: plain text knowledge base from config
  return fallbackKB || '';
}

/**
 * Extract lead data in background using GPT-4o-mini
 */
async function extractLeadData(supabase: any, conversationId: string, messages: any[], conversation: any, existingLead: any, userId: string) {
  const messagesContext = [...messages]
    .reverse()
    .map(m => {
      const prefix = m.direction === 'inbound' ? 'PACIENTE' : 'CLÍNICA';
      return `${prefix}: ${m.content || '[mídia]'}`;
    })
    .join('\n');

  const extractionPrompt = buildLeadExtractionPrompt();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: extractionPrompt },
        { role: 'user', content: `CONVERSA:\n${messagesContext}\n\nPACIENTE: ${conversation.contact_name || 'Desconhecido'}\nTELEFONE: ${conversation.phone_number}` },
      ],
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return;

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) return;

  try {
    const extracted = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    // Upsert lead qualifications
    const leadUpdate: any = {
      conversation_id: conversationId,
      phone_number: conversation.phone_number,
    };

    if (extracted.nome) leadUpdate.nome = extracted.nome;
    if (extracted.procedimento_desejado) leadUpdate.procedimento_desejado = extracted.procedimento_desejado;
    if (extracted.convenio) leadUpdate.convenio = extracted.convenio;
    if (extracted.urgencia) leadUpdate.urgencia = extracted.urgencia;
    if (extracted.como_conheceu) leadUpdate.como_conheceu = extracted.como_conheceu;
    if (extracted.temperatura_lead) leadUpdate.temperatura_lead = extracted.temperatura_lead;

    await supabase
      .from('whatsapp_lead_qualifications')
      .upsert(leadUpdate, { onConflict: 'conversation_id' });

    // 2. Enrich CRM contact
    if (conversation.contact_id) {
      const contactUpdate: any = {};
      if (extracted.full_name_correction) contactUpdate.full_name = extracted.full_name_correction;
      if (extracted.email) contactUpdate.email = extracted.email;

      if (extracted.cpf) {
        const { data: currentContact } = await supabase
          .from('crm_contacts')
          .select('custom_fields')
          .eq('id', conversation.contact_id)
          .single();

        contactUpdate.custom_fields = {
          ...(currentContact?.custom_fields || {}),
          cpf: extracted.cpf,
        };
      }

      if (Object.keys(contactUpdate).length > 0) {
        await supabase
          .from('crm_contacts')
          .update(contactUpdate)
          .eq('id', conversation.contact_id);
      }
    }

    // 3. Autonomous Booking (NEW)
    if (extracted.agendamento_confirmado?.is_confirmed && extracted.agendamento_confirmado.data_iso) {
      console.log('[Agent] Attempting autonomous booking:', extracted.agendamento_confirmado.data_iso);

      const bookDate = new Date(extracted.agendamento_confirmado.data_iso);
      const endDate = new Date(bookDate.getTime() + 30 * 60000); // 30 min duration
      const doctorId = extracted.agendamento_confirmado.medico_id || conversation.user_id;

      // Double check availability (conflict check)
      const { count: conflictCount } = await supabase
        .from('medical_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .neq('status', 'cancelled')
        .lt('start_time', endDate.toISOString())
        .gt('end_time', bookDate.toISOString());

      if (!conflictCount || conflictCount === 0) {
        // Get organization_id
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();

        const { error: bookingError } = await supabase
          .from('medical_appointments')
          .insert({
            doctor_id: doctorId,
            contact_id: conversation.contact_id,
            user_id: userId,
            organization_id: profile?.organization_id,
            start_time: bookDate.toISOString(),
            end_time: endDate.toISOString(),
            status: 'scheduled',
            title: `Consulta - ${extracted.agendamento_confirmado.procedimento || 'Geral'}`,
            appointment_type: 'first_visit',
            duration_minutes: 30,
            notes: 'Agendado via IA (whatsapp-ai-agent)',
          });

        if (!bookingError) {
          console.log('[Agent] Successfully booked appointment!');

          // Update Pipeline Stage to 'agendado'
          if (conversation.contact_id) {
            await supabase
              .from('crm_deals')
              .update({ stage: 'agendado' })
              .eq('contact_id', conversation.contact_id)
              .not('stage', 'in', '("fechado_ganho","fechado_perdido")');
          }
        } else {
          console.error('[Agent] Booking error:', bookingError);
        }
      } else {
        console.warn('[Agent] Conflict detected for autonomous booking, skipping.');
      }
    }
  } catch (e) {
    console.warn('[Agent] Lead extraction parse error:', e);
  }
}

/**
 * Update the analysis table for dashboard metrics
 */
async function updateAnalysis(supabase: any, conversationId: string, userId: string, messageCount: number, phase: string) {
  // Map phase to lead status
  const phaseToStatus: Record<string, string> = {
    abertura: 'novo',
    triagem: 'morno',
    agendamento: 'quente',
    pos_agendamento: 'convertido',
    handoff: 'quente',
  };

  await supabase
    .from('whatsapp_conversation_analysis')
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      lead_status: phaseToStatus[phase] || 'novo',
      last_analyzed_at: new Date().toISOString(),
      message_count_analyzed: messageCount,
      ai_model_used: 'gpt-4o (agent)',
      suggested_next_action: `Fase: ${phase}`,
    }, { onConflict: 'conversation_id' });
}
