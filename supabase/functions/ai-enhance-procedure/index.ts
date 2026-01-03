/**
 * Edge Function: ai-enhance-procedure
 * Recebe o nome e categoria de um procedimento e gera uma descrição profissional e acolhedora.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { name, category, currentDescription } = await req.json();

        if (!name) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório.' }), { status: 400, headers: corsHeaders });
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        const systemPrompt = `Você é um Redator Médico de Elite focado em acolhimento e conversão para clínicas de alto padrão.
Seu objetivo é criar descrições de procedimentos que transmitam TOTAL SEGURANÇA, EXCELÊNCIA e CONFORTO para o paciente.

DIRETRIZES DE ESCRITA:
- Use um tom humano, empático e muito profissional.
- Explique o que é feito de forma simples, mas com autoridade médica.
- Enfatize que o procedimento é realizado por especialistas experientes, com o máximo de zelo e tecnologias que garantem uma experiência tranquila.
- Transmita a ideia de que o paciente está em boas mãos e que o foco é o seu bem-estar e recuperação rápida.

FORMATO:
- Texto fluido e conciso (máximo 450 caracteres).
- Sem listas frias de bullet points.
- Use emojis discretos e que transmitam cuidado (como ✨, 🤝 ou ✅).
- O texto deve ser perfeito para colar no WhatsApp e passar confiança imediata.

RETORNE APENAS O TEXTO DA DESCRIÇÃO.`;

        const userPrompt = `Procedimento: ${name}\nCategoria: ${category}\nContexto: ${currentDescription || ''}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    max_tokens: 300,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            const enhancedDescription = data.choices[0]?.message?.content?.trim();

            return new Response(
                JSON.stringify({ enhancedDescription }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (fError: any) {
            if (fError.name === 'AbortError') throw new Error('Timeout');
            throw fError;
        } finally {
            clearTimeout(timeoutId);
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
