/**
 * Edge Function: whatsapp-ai-analyze
 * Análise manual de conversa WhatsApp com GPT-4o-mini.
 * Chamada pelo botão "Analisar Conversa" na UI.
 *
 * Retorna: { success, analysis, suggestions }
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { conversation_id, force_reanalyze } = await req.json();

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing conversation_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já tem análise recente (< 5 min) e não é forçado
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
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Buscar conversa
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, contact_name, user_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Conversation not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar últimas 30 mensagens
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('content, direction, message_type, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(30);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No messages to analyze' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'OPENAI_API_KEY not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar histórico para análise
    const chatHistory = messages
      .map((m: any) => {
        const role = m.direction === 'inbound' ? 'Paciente' : 'Clínica';
        const content = m.message_type === 'audio' ? '[Áudio]' :
                       m.message_type === 'image' ? '[Imagem]' :
                       m.message_type === 'document' ? '[Documento]' :
                       m.content || '[Mensagem vazia]';
        return `${role}: ${content}`;
      })
      .join('\n');

    const systemPrompt = `Você é um analista de leads para clínica médica. Analise a conversa WhatsApp abaixo e retorne um JSON com:

{
  "lead_status": "novo" | "frio" | "morno" | "quente" | "convertido" | "perdido",
  "conversion_probability": 0-100,
  "detected_intent": "string descrevendo intenção principal",
  "detected_procedure": "procedimento mencionado ou null",
  "detected_urgency": "baixa" | "media" | "alta" | "emergencia",
  "sentiment": "positivo" | "negativo" | "neutro",
  "suggested_next_action": "ação recomendada para o atendente",
  "suggestions": [
    {
      "type": "response" | "action" | "escalation",
      "content": "sugestão de resposta ou ação",
      "confidence": 0.0-1.0,
      "reasoning": "motivo da sugestão"
    }
  ]
}

Regras:
- "convertido" = confirmou agendamento ou compareceu
- "quente" = demonstrou forte interesse, pediu horário, mencionou convênio
- "morno" = fez perguntas, demonstrou interesse moderado
- "frio" = respostas curtas, sem interesse claro
- "perdido" = desistiu, não respondeu há muito tempo, reclamou
- "novo" = início de conversa, poucos dados
- Sugestões devem ser em português, práticas e diretas
- Sempre retorne JSON válido, sem markdown`;

    // Chamar GPT-4o-mini para análise
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Nome do contato: ${conversation.contact_name || 'Desconhecido'}\nTelefone: ${conversation.phone_number}\n\nConversa:\n${chatHistory}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[whatsapp-ai-analyze] OpenAI error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiRes.json();
    let aiResponse;
    try {
      aiResponse = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseErr) {
      console.error('[whatsapp-ai-analyze] Failed to parse AI response:', openaiData.choices[0]?.message?.content);
      return new Response(
        JSON.stringify({ success: false, error: 'AI returned invalid JSON' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar análise no banco (upsert)
    const analysisRecord = {
      conversation_id,
      user_id: conversation.user_id,
      lead_status: aiResponse.lead_status || 'novo',
      conversion_probability: aiResponse.conversion_probability || 0,
      detected_intent: aiResponse.detected_intent || null,
      detected_procedure: aiResponse.detected_procedure || null,
      detected_urgency: aiResponse.detected_urgency || 'baixa',
      sentiment: aiResponse.sentiment || 'neutro',
      suggested_next_action: aiResponse.suggested_next_action || null,
      last_analyzed_at: new Date().toISOString(),
      message_count_analyzed: messages.length,
      ai_model_used: 'gpt-4o-mini',
    };

    const { error: upsertError } = await supabase
      .from('whatsapp_conversation_analysis')
      .upsert(analysisRecord, { onConflict: 'conversation_id' });

    if (upsertError) {
      console.error('[whatsapp-ai-analyze] Upsert error:', upsertError);
    }

    // Salvar sugestões (limpar antigas e inserir novas)
    const suggestions = (aiResponse.suggestions || []).map((s: any) => ({
      conversation_id,
      user_id: conversation.user_id,
      type: s.type || 'response',
      content: s.content,
      confidence: s.confidence || 0.5,
      reasoning: s.reasoning || '',
      is_used: false,
      created_at: new Date().toISOString(),
    }));

    if (suggestions.length > 0) {
      // Limpar sugestões anteriores não usadas
      await supabase
        .from('whatsapp_ai_suggestions')
        .delete()
        .eq('conversation_id', conversation_id)
        .eq('is_used', false);

      await supabase
        .from('whatsapp_ai_suggestions')
        .insert(suggestions);
    }

    const finalAnalysis = analysisRecord;

    return new Response(
      JSON.stringify({
        success: true,
        analysis: finalAnalysis,
        suggestions: suggestions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[whatsapp-ai-analyze] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
