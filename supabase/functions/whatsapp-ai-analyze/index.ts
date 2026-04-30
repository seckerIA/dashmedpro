/**
 * Edge Function: whatsapp-ai-analyze
 * Análise de conversa WhatsApp + Sugestões Turbo (GPT-4o-mini).
 * Usa histórico completo, última mensagem em destaque e config do agente (whatsapp_ai_config).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function truncate(s: string, max: number): string {
  if (!s || s.length <= max) return s || '';
  return s.slice(0, max) + '\n[...truncado...]';
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mapUrgency(u: string | undefined): string {
  const v = stripAccents((u || '').toLowerCase());
  if (v === 'emergencia') return 'urgente';
  if (['baixa', 'media', 'alta', 'urgente'].includes(v)) return v;
  return 'baixa';
}

function mapSuggestionType(t: string | undefined): string {
  const v = (t || 'quick_reply').toLowerCase();
  if (v === 'response' || v === 'quick_reply') return 'quick_reply';
  if (v === 'action') return 'full_message';
  if (v === 'escalation') return 'follow_up';
  const allowed = ['full_message', 'procedure_info', 'scheduling', 'follow_up'];
  if (allowed.includes(v)) return v;
  return 'quick_reply';
}

function formatMessageLine(m: any): string {
  const isAi =
    m.direction === 'outbound' &&
    m.metadata &&
    typeof m.metadata === 'object' &&
    (m.metadata as { ai_generated?: boolean }).ai_generated === true;
  const role =
    m.direction === 'inbound'
      ? 'Paciente'
      : isAi
        ? 'Clínica (IA automática)'
        : 'Clínica (humano)';
  const content =
    m.message_type === 'audio'
      ? '[Áudio]'
      : m.message_type === 'image'
        ? '[Imagem]'
        : m.message_type === 'video'
          ? '[Vídeo]'
          : m.message_type === 'document'
            ? '[Documento]'
            : m.content || '[Mensagem vazia]';
  return `${role}: ${content}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { conversation_id, force_reanalyze } = await req.json();

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing conversation_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!force_reanalyze) {
      const { data: existing } = await supabase
        .from('whatsapp_conversation_analysis')
        .select('*')
        .eq('conversation_id', conversation_id)
        .maybeSingle();

      if (existing && existing.last_analyzed_at) {
        const lastAnalyzed = new Date(existing.last_analyzed_at);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (lastAnalyzed > fiveMinAgo) {
          return new Response(
            JSON.stringify({
              success: true,
              analysis: existing,
              suggestions: [],
              cached: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
    }

    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, contact_name, user_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Conversation not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: aiConfig } = await supabase
      .from('whatsapp_ai_config')
      .select(
        'agent_name, clinic_name, specialist_name, knowledge_base, doctor_info, custom_prompt_instructions, already_known_info, pre_investment_videos',
      )
      .eq('user_id', conversation.user_id)
      .maybeSingle();

    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('content, direction, message_type, created_at, metadata')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(60);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No messages to analyze' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'OPENAI_API_KEY not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const chatHistory = messages.map((m: any) => formatMessageLine(m)).join('\n');

    const last = messages[messages.length - 1];
    const lastRole = last.direction === 'inbound' ? 'Paciente' : 'Clínica';
    const lastPreview = formatMessageLine(last);

    const tail = messages.slice(-8).map((m: any) => formatMessageLine(m)).join('\n');

    const cfgLines: string[] = [];
    if (aiConfig) {
      if (aiConfig.agent_name) cfgLines.push(`Nome da IA: ${aiConfig.agent_name}`);
      if (aiConfig.clinic_name) cfgLines.push(`Clínica: ${aiConfig.clinic_name}`);
      if (aiConfig.specialist_name) cfgLines.push(`Médico/Especialista: ${aiConfig.specialist_name}`);
      if (aiConfig.doctor_info) cfgLines.push(`Sobre o médico:\n${truncate(aiConfig.doctor_info, 2500)}`);
      if (aiConfig.knowledge_base) {
        cfgLines.push(`Base de conhecimento (prioridade para fatos da clínica):\n${truncate(aiConfig.knowledge_base, 6000)}`);
      }
      if (aiConfig.already_known_info) {
        cfgLines.push(`Dados já conhecidos (não perguntar de novo):\n${truncate(aiConfig.already_known_info, 1500)}`);
      }
      if (aiConfig.custom_prompt_instructions) {
        cfgLines.push(`Tom / instruções:\n${truncate(aiConfig.custom_prompt_instructions, 1500)}`);
      }
      if (aiConfig.pre_investment_videos) {
        cfgLines.push(
          `Há vídeos pré-investimento cadastrados (links). Se o paciente ainda não pediu preço, priorize valor antes de preço.`,
        );
      }
    }
    const configBlock = cfgLines.length > 0 ? cfgLines.join('\n\n') : '(Sem configuração de agente no painel — use só o histórico.)';

    const systemPrompt = `Você é um analista sênior de vendas e atendimento para clínica médica no WhatsApp.

Sua tarefa: ler o HISTÓRICO COMPLETO, priorizar o que o paciente disse por ÚLTIMO, alinhar com a CONFIGURAÇÃO DO AGENTE (quando existir) e devolver JSON estrito.

Formato de saída (JSON):
{
  "lead_status": "novo" | "frio" | "morno" | "quente" | "convertido" | "perdido",
  "conversion_probability": 0-100,
  "detected_intent": "string curta: o que o paciente quer AGORA (baseado sobretudo na última mensagem relevante do paciente)",
  "detected_procedure": "procedimento ou null",
  "detected_urgency": "baixa" | "media" | "alta" | "urgente",
  "sentiment": "positivo" | "negativo" | "neutro",
  "suggested_next_action": "uma ação concreta para o atendente humano, coerente com a ÚLTIMA mensagem e o passo seguinte natural",
  "suggestions": [
    {
      "type": "quick_reply" | "full_message" | "procedure_info" | "scheduling" | "follow_up",
      "content": "texto pronto para colar no WhatsApp",
      "confidence": 0.0-1.0,
      "reasoning": "por que esta sugestão faz sentido AGORA (cite a última fala do paciente ou o que falta)"
    }
  ]
}

Regras de classificação (lead_status):
- convertido = agendamento confirmado ou compareceu / fechou
- quente = forte interesse, pediu horário, convênio, ou avanço claro
- morno = dúvidas, interesse moderado
- frio = respostas curtas ou frias, pouco engajamento
- perdido = desistiu, reclamou, sumiu há muito tempo (inferir só se o histórico indicar)
- novo = poucas mensagens, pouco contexto

Regras CRÍTICAS para "suggestions" (Sugestões Turbo):
1. Leia a seção "ÚLTIMA MENSAGEM" e o "FINAL DO THREAD" antes de sugerir qualquer texto.
2. Se a ÚLTIMA mensagem for do PACIENTE, as sugestões devem responder diretamente a ela e AVANÇAR o funil — nunca repetir pergunta que o paciente já respondeu (ex.: se ele já disse que quer agendar, NÃO sugira "quer agendar uma consulta?"; sugira horários, período do dia, ou próximo dado que falta).
3. Se a ÚLTIMA mensagem for da CLÍNICA (humano ou IA), sugira o próximo passo natural do paciente ou um follow-up curto que faça sentido depois da última fala da clínica.
4. NÃO sugira preço/investimento se o paciente não pediu e a conversa já está em agendamento — a menos que o paciente tenha perguntado preço na última interação.
5. Use "scheduling" quando for oferecer horários, dias ou confirmar agenda; "procedure_info" para explicar procedimento; "quick_reply" para respostas curtas; "full_message" para texto mais longo; "follow_up" para retomar contato ou tratar objeção.
6. Gere 2 a 4 sugestões, ordenadas da mais útil para a menos, todas em português natural de WhatsApp.
7. "detected_intent" deve refletir principalmente a intenção atual do paciente na última mensagem dele; se a última for da clínica, descreva o que o paciente provavelmente precisa responder em seguida.
8. Sempre retorne JSON válido, sem markdown.`;

    const userPayload =
      `Nome do contato: ${conversation.contact_name || 'Desconhecido'}\n` +
      `Telefone: ${conversation.phone_number}\n\n` +
      `=== CONFIGURAÇÃO DO AGENTE DE IA (use para alinhar tom e fatos) ===\n${configBlock}\n\n` +
      `=== ÚLTIMA MENSAGEM DO THREAD (prioridade máxima) ===\n` +
      `Quem falou por último: ${lastRole}\n` +
      `${lastPreview}\n\n` +
      `=== FINAL DO THREAD (últimas 8 mensagens) ===\n${tail}\n\n` +
      `=== HISTÓRICO COMPLETO (cronológico) ===\n${chatHistory}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
        temperature: 0.25,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[whatsapp-ai-analyze] OpenAI error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: `AI analysis failed: ${errText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const openaiData = await openaiRes.json();
    let aiResponse: any;
    const rawContent = openaiData.choices?.[0]?.message?.content;
    try {
      if (!rawContent) throw new Error('empty content');
      aiResponse = JSON.parse(rawContent);
    } catch (_parseErr) {
      console.error('[whatsapp-ai-analyze] Failed to parse AI response:', rawContent);
      return new Response(
        JSON.stringify({ success: false, error: 'AI returned invalid JSON' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const analysisRecord = {
      conversation_id,
      user_id: conversation.user_id,
      lead_status: aiResponse.lead_status || 'novo',
      conversion_probability: aiResponse.conversion_probability || 0,
      detected_intent: aiResponse.detected_intent || null,
      detected_procedure: aiResponse.detected_procedure || null,
      detected_urgency: mapUrgency(aiResponse.detected_urgency),
      sentiment: aiResponse.sentiment || 'neutro',
      suggested_next_action: aiResponse.suggested_next_action || null,
      last_analyzed_at: new Date().toISOString(),
      message_count_analyzed: messages.length,
      ai_model_used: 'gpt-4o-mini (analyze+turbo)',
    };

    const { error: upsertError } = await supabase
      .from('whatsapp_conversation_analysis')
      .upsert(analysisRecord, { onConflict: 'conversation_id' });

    if (upsertError) {
      console.error('[whatsapp-ai-analyze] Upsert error:', upsertError);
    }

    const rawSuggestions = Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions : [];
    const suggestions = rawSuggestions.slice(0, 6).map((s: any, idx: number) => ({
      conversation_id,
      user_id: conversation.user_id,
      suggestion_type: mapSuggestionType(s.type),
      content: String(s.content || '').trim() || 'Confirme com o paciente o próximo passo.',
      confidence: typeof s.confidence === 'number' ? Math.min(1, Math.max(0, s.confidence)) : 0.5,
      reasoning: s.reasoning || '',
      was_used: false,
      display_order: idx,
      created_at: new Date().toISOString(),
    }));

    if (suggestions.length > 0) {
      await supabase
        .from('whatsapp_ai_suggestions')
        .delete()
        .eq('conversation_id', conversation_id)
        .eq('was_used', false);

      const { error: insertError } = await supabase.from('whatsapp_ai_suggestions').insert(suggestions);

      if (insertError) {
        console.error('[whatsapp-ai-analyze] Insert suggestions error:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisRecord,
        suggestions: suggestions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('[whatsapp-ai-analyze] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
