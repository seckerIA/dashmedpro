import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightData {
    category: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    trend?: "improving" | "declining" | "stable";
    confidence: number;
    data_sources: string[];
}

interface AnalysisData {
    leads: { total: number; byStatus: Record<string, number>; byOrigin: Record<string, number>; avgResponseTimeHours: number };
    appointments: { total: number; completed: number; noShows: number; cancelled: number; byDayOfWeek: Record<string, number>; byHour: Record<string, number> };
    conversations: { total: number; avgMessagesPerConversation: number; avgResponseTimeMinutes: number };
    sales: { total: number; totalRevenue: number; avgValue: number; byProcedure: Record<string, number> };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Usar API Key do ambiente (mesma usada em whatsapp-ai-analyze)
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
            return new Response(JSON.stringify({
                error: "OpenAI API key not configured",
                message: "Configure a variável OPENAI_API_KEY no Supabase"
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Get user from token
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check for recent analysis (cache 24h)
        const { data: recentBatch } = await supabaseAdmin
            .from("crm_ai_analysis_batches")
            .select("id, created_at")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (recentBatch) {
            // Return cached insights
            const { data: cachedInsights } = await supabaseAdmin
                .from("crm_ai_insights")
                .select("*")
                .eq("analysis_batch_id", recentBatch.id)
                .order("impact", { ascending: true });

            return new Response(JSON.stringify({
                success: true,
                cached: true,
                batch_id: recentBatch.id,
                insights: cachedInsights || [],
                next_analysis_available: new Date(new Date(recentBatch.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Create analysis batch
        const startTime = Date.now();
        const { data: batch, error: batchError } = await supabaseAdmin
            .from("crm_ai_analysis_batches")
            .insert({
                user_id: user.id,
                status: "processing",
            })
            .select()
            .single();

        if (batchError) throw batchError;

        // Collect data for analysis (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [leadsResult, appointmentsResult, conversationsResult, salesResult, messagesResult] = await Promise.all([
            supabaseAdmin
                .from("commercial_leads")
                .select("id, status, origin, created_at, first_response_at")
                .eq("user_id", user.id)
                .gte("created_at", thirtyDaysAgo),
            supabaseAdmin
                .from("medical_appointments")
                .select("id, status, start_time, created_at")
                .eq("user_id", user.id)
                .gte("start_time", thirtyDaysAgo),
            supabaseAdmin
                .from("whatsapp_conversations")
                .select("id, created_at, last_message_at, status")
                .eq("user_id", user.id)
                .gte("created_at", thirtyDaysAgo),
            supabaseAdmin
                .from("crm_deals")
                .select("id, value, stage, procedure_type, created_at, closed_at")
                .eq("user_id", user.id)
                .gte("created_at", thirtyDaysAgo),
            supabaseAdmin
                .from("whatsapp_messages")
                .select("id, direction, content, created_at")
                .eq("user_id", user.id)
                .gte("created_at", thirtyDaysAgo)
                .limit(500),
        ]);

        const leads = leadsResult.data || [];
        const appointments = appointmentsResult.data || [];
        const conversations = conversationsResult.data || [];
        const sales = (salesResult.data || []).filter((s: any) => s.stage === "fechado_ganho");
        const messages = messagesResult.data || [];

        // Analyze message content for keywords
        const inboundMessages = messages.filter((m: any) => m.direction === 'inbound');
        const outboundMessages = messages.filter((m: any) => m.direction === 'outbound');

        // Extract common keywords from inbound messages
        const keywordCounts: Record<string, number> = {};
        inboundMessages.forEach((m: any) => {
            const content = (m.content || '').toLowerCase();
            const words = ['preço', 'valor', 'quanto', 'agendar', 'horário', 'consulta', 'procedimento',
                'urgente', 'emergência', 'dor', 'botox', 'harmonização', 'promoção', 'desconto'];
            words.forEach(word => {
                if (content.includes(word)) {
                    keywordCounts[word] = (keywordCounts[word] || 0) + 1;
                }
            });
        });

        // Aggregate data
        const analysisData: AnalysisData = {
            leads: {
                total: leads.length,
                byStatus: leads.reduce((acc: any, l: any) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }), {}),
                byOrigin: leads.reduce((acc: any, l: any) => ({ ...acc, [l.origin || "unknown"]: (acc[l.origin || "unknown"] || 0) + 1 }), {}),
                avgResponseTimeHours: leads.filter((l: any) => l.first_response_at).reduce((sum: number, l: any) => {
                    const created = new Date(l.created_at).getTime();
                    const responded = new Date(l.first_response_at).getTime();
                    return sum + (responded - created) / (1000 * 60 * 60);
                }, 0) / Math.max(leads.filter((l: any) => l.first_response_at).length, 1),
            },
            appointments: {
                total: appointments.length,
                completed: appointments.filter((a: any) => a.status === "completed").length,
                noShows: appointments.filter((a: any) => a.status === "no_show").length,
                cancelled: appointments.filter((a: any) => a.status === "cancelled").length,
                byDayOfWeek: appointments.reduce((acc: any, a: any) => {
                    const day = new Date(a.start_time).toLocaleDateString("pt-BR", { weekday: "long" });
                    return { ...acc, [day]: (acc[day] || 0) + 1 };
                }, {}),
                byHour: appointments.reduce((acc: any, a: any) => {
                    const hour = new Date(a.start_time).getHours().toString();
                    return { ...acc, [hour]: (acc[hour] || 0) + 1 };
                }, {}),
            },
            conversations: {
                total: conversations.length,
                avgMessagesPerConversation: conversations.length > 0 ? messages.length / conversations.length : 0,
                avgResponseTimeMinutes: 0,
            },
            sales: {
                total: sales.length,
                totalRevenue: sales.reduce((sum: number, s: any) => sum + (s.value || 0), 0),
                avgValue: sales.reduce((sum: number, s: any) => sum + (s.value || 0), 0) / Math.max(sales.length, 1),
                byProcedure: sales.reduce((acc: any, s: any) => ({ ...acc, [s.procedure_type || "outros"]: (acc[s.procedure_type || "outros"] || 0) + 1 }), {}),
            },
        };

        // Build prompt for AI
        const prompt = buildAnalysisPrompt(analysisData, keywordCounts);

        // Call OpenAI API (same as whatsapp-ai-analyze)
        let insights: InsightData[] = [];
        try {
            const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "Você é um analista de dados especializado em CRM para clínicas médicas e estéticas. Responda APENAS com JSON válido contendo um array de insights."
                        },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                    response_format: { type: "json_object" },
                }),
            });

            if (!openaiResponse.ok) {
                const error = await openaiResponse.json();
                throw new Error(error.error?.message || "OpenAI API error");
            }

            const data = await openaiResponse.json();
            const jsonContent = data.choices[0]?.message?.content || "{}";

            // Parse response
            try {
                const parsed = JSON.parse(jsonContent);
                insights = parsed.insights || parsed || [];
            } catch (e) {
                // Try to extract array from response
                const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    insights = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (aiError: any) {
            console.error("AI Error:", aiError);
            // Update batch as failed
            await supabaseAdmin
                .from("crm_ai_analysis_batches")
                .update({
                    status: "failed",
                    error_message: aiError.message,
                    completed_at: new Date().toISOString(),
                })
                .eq("id", batch.id);

            return new Response(JSON.stringify({
                error: "AI analysis failed",
                message: aiError.message
            }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Ensure insights is an array
        if (!Array.isArray(insights)) {
            insights = [];
        }

        // Save insights
        const insightsToInsert = insights.slice(0, 10).map((insight) => ({
            user_id: user.id,
            analysis_batch_id: batch.id,
            category: insight.category || 'operational',
            title: insight.title,
            description: insight.description,
            impact: insight.impact || 'medium',
            trend: insight.trend || 'stable',
            confidence: Math.min(1, Math.max(0, insight.confidence || 0.7)),
            data_sources: insight.data_sources || [],
            is_actionable: true,
        }));

        if (insightsToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from("crm_ai_insights")
                .insert(insightsToInsert);

            if (insertError) {
                console.error("Insert error:", insertError);
            }
        }

        // Update batch as completed
        const processingTime = Date.now() - startTime;
        await supabaseAdmin
            .from("crm_ai_analysis_batches")
            .update({
                status: "completed",
                insights_count: insightsToInsert.length,
                processing_time_ms: processingTime,
                data_summary: analysisData,
                completed_at: new Date().toISOString(),
            })
            .eq("id", batch.id);

        // Fetch saved insights
        const { data: savedInsights } = await supabaseAdmin
            .from("crm_ai_insights")
            .select("*")
            .eq("analysis_batch_id", batch.id)
            .order("impact", { ascending: true });

        return new Response(JSON.stringify({
            success: true,
            cached: false,
            batch_id: batch.id,
            insights: savedInsights || [],
            processing_time_ms: processingTime,
            next_analysis_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error in crm-ai-insights:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

function buildAnalysisPrompt(data: AnalysisData, keywords: Record<string, number>): string {
    const topKeywords = Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => `"${word}" (${count}x)`)
        .join(", ");

    return `Você é um analista de CRM especializado em clínicas médicas e estéticas. Analise os dados abaixo e forneça insights acionáveis.

## Dados dos últimos 30 dias:

### Leads (${data.leads.total} total)
- Por status: ${JSON.stringify(data.leads.byStatus)}
- Por origem: ${JSON.stringify(data.leads.byOrigin)}
- Tempo médio de resposta: ${data.leads.avgResponseTimeHours.toFixed(1)} horas

### Agendamentos (${data.appointments.total} total)
- Compareceram: ${data.appointments.completed}
- Faltaram (no-show): ${data.appointments.noShows} (${((data.appointments.noShows / Math.max(data.appointments.total, 1)) * 100).toFixed(1)}%)
- Cancelados: ${data.appointments.cancelled}
- Por dia da semana: ${JSON.stringify(data.appointments.byDayOfWeek)}
- Por hora do dia: ${JSON.stringify(data.appointments.byHour)}

### Vendas (${data.sales.total} fechadas)
- Receita total: R$ ${data.sales.totalRevenue.toLocaleString("pt-BR")}
- Ticket médio: R$ ${data.sales.avgValue.toLocaleString("pt-BR")}
- Por procedimento: ${JSON.stringify(data.sales.byProcedure)}

### Conversas WhatsApp
- Total: ${data.conversations.total}
- Média de mensagens por conversa: ${data.conversations.avgMessagesPerConversation.toFixed(1)}
${topKeywords ? `- Palavras mais frequentes: ${topKeywords}` : ''}

## Instruções:
1. Identifique padrões importantes nos dados
2. Sugira melhorias acionáveis e práticas
3. Destaque riscos ou problemas
4. Seja específico com números e porcentagens
5. Foque em insights que gerem AÇÃO imediata

Responda com JSON no formato:
{
  "insights": [
    {
      "category": "conversion|messages|scheduling|leads|operational|financial",
      "title": "Título curto e impactante (máx 60 caracteres)",
      "description": "Descrição detalhada com números específicos e recomendação prática (máx 200 caracteres)",
      "impact": "high|medium|low",
      "trend": "improving|declining|stable",
      "confidence": 0.0 a 1.0,
      "data_sources": ["leads", "appointments", "conversations", "sales"]
    }
  ]
}

Gere entre 5 e 8 insights relevantes, priorizando os de alto impacto.`;
}
