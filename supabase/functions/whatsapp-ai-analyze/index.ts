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
    return new Response(null, { headers: corsHeaders });
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

    // Verificar usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Obter parâmetros
    const { conversation_id, force_reanalyze = false } = await req.json();

    if (!conversation_id) {
      throw new Error('conversation_id is required');
    }

    // Verificar se a conversa existe e pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id, contact_name, phone_number, user_id, status')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Verificar análise existente e cooldown
    const { data: existingAnalysis } = await supabaseAdmin
      .from('whatsapp_conversation_analysis')
      .select('*')
      .eq('conversation_id', conversation_id)
      .single();

    if (existingAnalysis && !force_reanalyze) {
      const lastAnalyzed = new Date(existingAnalysis.last_analyzed_at);
      const cooldownMinutes = 5; // Tempo mínimo entre análises
      const cooldownMs = cooldownMinutes * 60 * 1000;

      if (Date.now() - lastAnalyzed.getTime() < cooldownMs) {
        // Retornar análise existente se dentro do cooldown
        const { data: existingSuggestions } = await supabaseAdmin
          .from('whatsapp_ai_suggestions')
          .select('*')
          .eq('conversation_id', conversation_id)
          .eq('was_used', false)
          .order('display_order', { ascending: true })
          .limit(3);

        return new Response(
          JSON.stringify({
            success: true,
            analysis: existingAnalysis,
            suggestions: existingSuggestions || [],
            cached: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar últimas mensagens da conversa
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('direction, content, message_type, sent_at')
      .eq('conversation_id', conversation_id)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (msgError || !messages || messages.length === 0) {
      throw new Error('No messages found in conversation');
    }

    // Buscar procedimentos disponíveis (para contexto)
    const { data: procedures } = await supabaseAdmin
      .from('commercial_procedures')
      .select('id, name, category, price')
      .eq('user_id', conversation.user_id)
      .eq('is_active', true)
      .limit(20);

    // Montar contexto para a IA
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

    // Chamar OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in Supabase secrets.');
    }

    const systemPrompt = `Você é um assistente de qualificação de leads para uma clínica médica brasileira.
Analise a conversa do WhatsApp e retorne APENAS um JSON válido (sem markdown, sem explicações) com a seguinte estrutura:

{
  "lead_status": "novo" | "frio" | "morno" | "quente" | "convertido" | "perdido",
  "conversion_probability": 0-100,
  "detected_intent": "string descrevendo a intenção principal do paciente",
  "detected_procedure": "nome do procedimento se mencionado ou null",
  "detected_urgency": "baixa" | "media" | "alta" | "urgente",
  "sentiment": "positivo" | "neutro" | "negativo",
  "suggested_next_action": "ação recomendada para a secretária",
  "suggestions": [
    {
      "type": "quick_reply" | "full_message" | "procedure_info" | "scheduling" | "follow_up",
      "content": "texto da mensagem sugerida em português",
      "confidence": 0.0-1.0,
      "reasoning": "motivo da sugestão"
    }
  ]
}

Critérios de qualificação:
- NOVO: < 2 mensagens, sem contexto suficiente
- FRIO: Respostas curtas, demora > 24h, sem perguntas, desinteresse claro
- MORNO: Faz perguntas gerais, responde em < 24h, interesse moderado
- QUENTE: Pergunta preços, disponibilidade, quer agendar, interesse alto
- CONVERTIDO: Confirmou agendamento, fechou procedimento
- PERDIDO: Disse "não", sem resposta > 7 dias, cancelou

Gere exatamente 3 sugestões de resposta, variando os tipos.
Todas as respostas devem ser em português brasileiro, profissionais mas acolhedoras.`;

    const userPrompt = `PROCEDIMENTOS DISPONÍVEIS:
${proceduresContext}

CONVERSA (mais recente por último):
${messagesContext}

Nome do paciente: ${conversation.contact_name || 'Não identificado'}

Analise e retorne o JSON de qualificação:`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('[AI] OpenAI error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parsear resposta da IA
    let aiResponse: AIResponse;
    try {
      // Remover possíveis caracteres de markdown
      const cleanContent = aiContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      aiResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[AI] Failed to parse response:', aiContent);
      throw new Error('Failed to parse AI response');
    }

    // Validar e sanitizar resposta
    const validStatuses: LeadStatus[] = ['novo', 'frio', 'morno', 'quente', 'convertido', 'perdido'];
    if (!validStatuses.includes(aiResponse.lead_status)) {
      aiResponse.lead_status = 'novo';
    }

    aiResponse.conversion_probability = Math.min(100, Math.max(0, aiResponse.conversion_probability || 0));

    const validUrgencies: UrgencyLevel[] = ['baixa', 'media', 'alta', 'urgente'];
    if (!validUrgencies.includes(aiResponse.detected_urgency)) {
      aiResponse.detected_urgency = 'baixa';
    }

    const validSentiments: Sentiment[] = ['positivo', 'neutro', 'negativo'];
    if (!validSentiments.includes(aiResponse.sentiment)) {
      aiResponse.sentiment = 'neutro';
    }

    // Salvar/atualizar análise
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
      ai_model_used: 'gpt-3.5-turbo',
    };

    let savedAnalysis;
    if (existingAnalysis) {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_conversation_analysis')
        .update(analysisData)
        .eq('id', existingAnalysis.id)
        .select()
        .single();

      if (error) throw error;
      savedAnalysis = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_conversation_analysis')
        .insert(analysisData)
        .select()
        .single();

      if (error) throw error;
      savedAnalysis = data;
    }

    // Limpar sugestões antigas não usadas
    await supabaseAdmin
      .from('whatsapp_ai_suggestions')
      .delete()
      .eq('conversation_id', conversation_id)
      .eq('was_used', false);

    // Salvar novas sugestões
    const suggestionsToInsert = (aiResponse.suggestions || []).slice(0, 3).map((s, idx) => ({
      conversation_id,
      user_id: conversation.user_id,
      analysis_id: savedAnalysis.id,
      suggestion_type: s.type || 'quick_reply',
      content: s.content,
      confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
      reasoning: s.reasoning,
      display_order: idx,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    }));

    const { data: savedSuggestions, error: suggestionsError } = await supabaseAdmin
      .from('whatsapp_ai_suggestions')
      .insert(suggestionsToInsert)
      .select();

    if (suggestionsError) {
      console.error('[AI] Error saving suggestions:', suggestionsError);
    }

    // Verificar se deve criar deal automaticamente (lead quente)
    if (aiResponse.lead_status === 'quente' && !savedAnalysis.deal_created) {
      // Será tratado pelo frontend via convertWhatsAppToDeal
      console.log('[AI] Lead marked as hot, deal creation pending');
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
