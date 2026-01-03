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

    // Buscar configuração personalizada de IA
    const { data: aiConfig } = await supabaseAdmin
      .from('whatsapp_ai_config')
      .select('knowledge_base, already_known_info, custom_prompt_instructions, auto_reply_enabled')
      .eq('user_id', conversation.user_id)
      .maybeSingle();

    // --- NOVO: BUSCAR AGENDA DO MÉDICO ---
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

    // Helper para formatar a agenda simplificada para o prompt
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

    const systemPrompt = `Você é um Especialista em Vendas e Conversão de Pacientes para clínicas médicas de alto padrão no Brasil.
Seu objetivo é analisar as conversas de WhatsApp e fornecer insights profundos para que a secretária consiga FECHAR agendamentos e procedimentos.

${aiConfig?.knowledge_base ? `BASE DE CONHECIMENTO DA CLÍNICA:\n${aiConfig.knowledge_base}\n` : ''}
${aiConfig?.already_known_info ? `INFORMAÇÕES QUE JÁ TEMOS (NÃO PERGUNTE): ${aiConfig.already_known_info}` : 'Já temos o telefone e nome básico do paciente.'}
${aiConfig?.custom_prompt_instructions ? `INSTRUÇÕES PERSONALIZADAS:\n${aiConfig.custom_prompt_instructions}\n` : ''}

${agendaContext}

Analise a conversa e retorne APENAS um JSON válido (sem markdown, sem explicações) com a estrutura abaixo.

ESTRUTURA DO JSON:
{
  "lead_status": "frio" | "morno" | "quente",
  "conversion_probability": 0-100,
  "detected_intent": "Intenção clara do paciente",
  "detected_procedure": "Procedimento alvo",
  "detected_urgency": "baixa" | "media" | "alta" | "urgente",
  "sentiment": "positivo" | "neutro" | "negativo",
  "suggested_next_action": "Ação imediata para conversão (Ex: Pedir o convênio, oferecer 2 horários específicos)",
  "suggestions": [
    {
      "type": "quick_reply" | "full_message" | "procedure_info" | "scheduling" | "follow_up",
      "content": "Texto persuasivo seguindo tom de voz da clínica",
      "confidence": 0.0-1.0,
      "reasoning": "Por que esta mensagem vai ajudar a converter?"
    }
  ]
}

DIRETRIZES DE CONVERSÃO (PSICOLOGIA DE VENDAS):
1. Rapport e Empatia: Use o nome do paciente e valide suas dúvidas/dores.
2. Autoridade: Mencione sutilmente a expertise do doutor ou qualidade da tecnologia se houver no contexto.
3. Escassez/Urgência: Sempre sugira oferecer opções limitadas de horários (Ex: "Tenho apenas quinta às 14h ou sexta às 10h").
4. Call to Action (CTA): Toda sugestão de resposta deve terminar com uma pergunta clara que leve ao agendamento.
5. Objeções: Se o paciente perguntar preço, ensine a secretária a valorizar o procedimento antes de dar o valor bruto, ou oferecer condições de parcelamento.

CRITÉRIOS DE STATUS:
- FRIO: Parou de responder, mostra desinteresse total ou apenas tirou uma dúvida rápida sem intenção de agendar.
- MORNO: Tem dúvidas, responde mas ainda não pediu horários ou mostrou urgência.
- QUENTE: Pediu preço, horários, localização ou falou de sintomas específicos que precisam de tratamento rápido.

Gere exatamente 3 sugestões de resposta altamente persuasivas.`;

    const userPrompt = `
DADOS DA CLÍNICA/MÉDICO:
ID do Médico: ${conversation.user_id}
Procedimentos Cadastrados:
${proceduresContext}

DADOS DO PACIENTE:
Nome: ${conversation.contact_name || 'Não identificado'}
Telefone: ${conversation.phone_number}

HISTÓRICO DA CONVERSA (Últimas 20 mensagens):
${messagesContext}

Analise agora com foco em conversão máxima:`;

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
      ai_model_used: 'gpt-4o-mini',
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

    // Verificação de Auto-Resposta (se configurado)
    if (aiConfig?.auto_reply_enabled) {
      const bestSuggestion = (aiResponse.suggestions || [])
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

      // Só envia se for uma resposta completa e tiver confiança alta
      if (bestSuggestion && bestSuggestion.confidence >= 0.85 && bestSuggestion.type === 'full_message') {
        console.log('[AI] Auto-reply triggered with confidence:', bestSuggestion.confidence);

        try {
          // Invocar whatsapp-send-message
          await supabaseAdmin.functions.invoke('whatsapp-send-message', {
            body: {
              conversation_id,
              content: bestSuggestion.content
            }
          });

          // Marcar essa sugestão como usada
          if (savedSuggestions && savedSuggestions.length > 0) {
            const suggestId = savedSuggestions.find(s => s.content === bestSuggestion.content)?.id;
            if (suggestId) {
              await supabaseAdmin
                .from('whatsapp_ai_suggestions')
                .update({ was_used: true, used_at: new Date().toISOString() })
                .eq('id', suggestId);
            }
          }
        } catch (sendError) {
          console.error('[AI] Auto-reply failed:', sendError);
        }
      }
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
