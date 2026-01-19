/**
 * Edge Function: whatsapp-ai-analyze
 * Analisa conversas do WhatsApp usando GPT-3.5 Turbo
 * Qualifica leads e gera sugestões de resposta
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Tipos
type LeadStatus = 'novo' | 'frio' | 'morno' | 'quente' | 'convertido' | 'perdido';
type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';
type Sentiment = 'positivo' | 'neutro' | 'negativo';
type SuggestionType = 'quick_reply' | 'full_message' | 'procedure_info' | 'scheduling' | 'follow_up';

interface AIResponse {
  lead_status: LeadStatus;
  conversion_probability: number;
  detected_intent: string;
  detected_procedure: string | null;
  detected_urgency: UrgencyLevel;
  sentiment: Sentiment;
  suggested_next_action: string;
  suggestions: Array<{
    type: SuggestionType;
    content: string;
    confidence: number;
    reasoning: string;
  }>;
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
    // O webhook pode criar a conversa, e se usarmos client anon sem user, não achamos.
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_name, phone_number, user_id, status')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // ==========================================
    // DEBOUNCE / BUFFER STEP
    // ==========================================
    if (!force_reanalyze) {
      const BUFFER_SECONDS = 15; // Espera 15s (reduzido para evitar timeout)
      const checkTime = new Date().toISOString();

      console.log(`[AI-DEBOUNCE] Waiting ${BUFFER_SECONDS}s buffer...`);
      // Delay para aguardar mais mensagens
      await new Promise(resolve => setTimeout(resolve, BUFFER_SECONDS * 1000));

      // Verificar se chegaram novas mensagens INBOUND
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

    // Buscar procedimentos
    const { data: procedures } = await supabaseAdmin
      .from('commercial_procedures')
      .select('id, name, category, price')
      .eq('user_id', conversation.user_id)
      .eq('is_active', true)
      .limit(20);

    // Buscar configuração IA
    const { data: aiConfig } = await supabaseAdmin
      .from('whatsapp_ai_config')
      .select('knowledge_base, already_known_info, custom_prompt_instructions, auto_reply_enabled')
      .eq('user_id', conversation.user_id)
      .maybeSingle();

    console.log('[AI] Config for user', conversation.user_id, ':', {
      exists: !!aiConfig,
      auto_reply_enabled: aiConfig?.auto_reply_enabled
    });

    // --- AGENDA DO MÉDICO ---
    const now = new Date();
    const next5Days = new Date();
    next5Days.setDate(now.getDate() + 5);

    const { data: appointments } = await supabaseAdmin
      .from('medical_appointments')
      .select('start_time, end_time, status')
      .eq('doctor_id', conversation.user_id)
      .gte('start_time', now.toISOString())
      .lte('start_time', next5Days.toISOString())
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    const formatAgenda = () => {
      if (!appointments || appointments.length === 0) return "Agenda totalmente livre para os próximos 5 dias.";
      const agendaByDay: Record<string, string[]> = {};
      appointments.forEach(appt => {
        const date = new Date(appt.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
        const time = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (!agendaByDay[date]) agendaByDay[date] = [];
        agendaByDay[date].push(time);
      });
      return Object.entries(agendaByDay)
        .map(([day, times]) => `${day}: Ocupado em ${times.join(', ')}`)
        .join('\n');
    };

    const agendaContext = `HORÁRIOS OCUPADOS (PRÓXIMOS 5 DIAS):\n${formatAgenda()}\n(A clínica funciona de Seg-Sex, das 08h às 18h. Se o horário não estiver na lista de ocupados acima, ele está disponível.)`;

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

    const systemPrompt = `Você é uma SECRETÁRIA VIRTUAL experiente de uma clínica médica. Seu trabalho é atender pacientes via WhatsApp de forma natural, simpática e EFICIENTE.

REGRAS FUNDAMENTAIS:
1. RESPONDA DIRETAMENTE às perguntas. Se perguntaram sobre procedimentos, LISTE os procedimentos. Se perguntaram preço, DIGA o preço.
2. Seja NATURAL e HUMANA - evite frases genéricas. Fale como uma pessoa real.
3. Seja OBJETIVA - não enrole.
4. Use EMOJIS com moderação (máximo 1-2).
5. Sempre termine com algo que FACILITE a próxima ação (ex: "Qual horário prefere?").

${aiConfig?.knowledge_base ? `SOBRE A CLÍNICA:\n${aiConfig.knowledge_base}\n` : ''}
${aiConfig?.already_known_info ? `INFORMAÇÕES QUE JÁ TEMOS: ${aiConfig.already_known_info}\n` : ''}
${aiConfig?.custom_prompt_instructions ? `INSTRUÇÕES ESPECIAIS:\n${aiConfig.custom_prompt_instructions}\n` : ''}

PROCEDIMENTOS E PREÇOS:
${proceduresContext}

${agendaContext}

COMO RESPONDER:
- "Quais procedimentos?" → Liste principais
- "Quanto custa X?" → Diga o preço
- "Quais horários?" → Ofereça 2-3 horários livres
- "Endereço?" → Endereço completo
- Dúvidas técnicas → Explique breve e sugira avaliação

FORMATO DE RESPOSTA (JSON):
{
  "lead_status": "frio" | "morno" | "quente",
  "conversion_probability": 0-100,
  "detected_intent": "O que o paciente quer",
  "detected_procedure": "Procedimento ou null",
  "detected_urgency": "baixa" | "media" | "alta" | "urgente",
  "sentiment": "positivo" | "neutro" | "negativo",
  "suggested_next_action": "O que fazer agora",
  "suggestions": [
    {
      "type": "full_message",
      "content": "RESPOSTA COMPLETA",
      "confidence": 0.0-1.0,
      "reasoning": "Motivo"
    }
  ]
}

IMPORTANTE: Gere EXATAMENTE 3 sugestões.`;

    const userPrompt = `
CONVERSA ATUAL:
${messagesContext}

PACIENTE: ${conversation.contact_name || 'Nome não identificado'}
TELEFONE: ${conversation.phone_number}

Analise a conversa e gere respostas naturais. Responda diretamente.`;

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
        temperature: 0.7,
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

    // Debug: Log config status
    console.log('[AI] Auto-reply config:', {
      auto_reply_enabled: aiConfig?.auto_reply_enabled,
      configExists: !!aiConfig,
      userId: conversation.user_id
    });

    // Auto-Reply - Só executa se auto_reply_enabled for EXPLICITAMENTE true
    // ==========================================
    // AUTO-REPLY LOGIC
    // ==========================================
    let autoReplySent = false;

    console.log(`[AI-DEBUG] Starting Auto-Reply check. Config enabled: ${aiConfig?.auto_reply_enabled}, Suggestions detected: ${suggestionsToInsert.length}`);

    if (aiConfig?.auto_reply_enabled === true) {
      const bestSuggestion = suggestionsToInsert[0]; // Assume first is best due to our prompt instruction
      const CONFIDENCE_THRESHOLD = 0.85;

      console.log(`[AI-DEBUG] Best suggestion confidence: ${bestSuggestion?.confidence}`);

      if (bestSuggestion && bestSuggestion.confidence >= CONFIDENCE_THRESHOLD) {
        console.log(`[AI-DEBUG] Auto-reply TRIGGERED. Confidence: ${(bestSuggestion.confidence * 100).toFixed(0)}%`);

        try {
          // 1. Insert message in DB first
          const { data: newMessage, error: insertError } = await supabaseAdmin
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
              metadata: { auto_reply: true, confidence: bestSuggestion.confidence, ai_generated: true }
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('[AI-DEBUG] Failed to insert pending message:', insertError);
          }

          if (newMessage) {
            console.log('[AI-DEBUG] Pending message inserted, sending to Meta...');
            // 2. Send via WhatsApp API
            const { data: waConfig } = await supabaseAdmin
              .from('whatsapp_config')
              .select('phone_number_id, access_token')
              .eq('user_id', conversation.user_id)
              .eq('is_active', true)
              .maybeSingle();

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
                    text: { body: bestSuggestion.content }
                  }),
                }
              );

              const waResData = await waRes.json();
              console.log('[AI-DEBUG] Meta API response:', JSON.stringify(waResData));

              if (waRes.ok) {
                await supabaseAdmin
                  .from('whatsapp_messages')
                  .update({ status: 'sent', message_id: waResData.messages?.[0]?.id })
                  .eq('id', newMessage.id);

                // Mark suggestion as used
                if (bestSuggestion) {
                  await supabaseAdmin.from('whatsapp_ai_suggestions')
                    .update({ was_used: true, used_at: new Date().toISOString() })
                    .eq('conversation_id', conversation_id)
                    .eq('content', bestSuggestion.content);
                }

                autoReplySent = true;
              } else {
                console.error('[AI-DEBUG] WhatsApp API Error:', waResData);
                await supabaseAdmin.from('whatsapp_messages').update({ status: 'failed', error_code: waResData?.error?.code }).eq('id', newMessage.id);
              }
            } else {
              console.error('[AI-DEBUG] WhatsApp Config not found for auto-reply');
            }
          }
        } catch (autoReplyError) {
          console.error('[AI-DEBUG] Auto-reply exception:', autoReplyError);
        }
      } else {
        console.log(`[AI-DEBUG] Auto-reply SKIPPED. Confidence ${(bestSuggestion?.confidence * 100).toFixed(0)}% < ${CONFIDENCE_THRESHOLD * 100}%`);
      }
    } else {
      console.log('[AI-DEBUG] Auto-reply DISABLED in config.');
    }

    if (aiResponse.lead_status === 'quente' && !savedAnalysis.deal_created) {
      // Logica de criar deal se necessario
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
