import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CalculateScoreRequest {
  lead_id: string;
  user_id?: string;
}

// Funções de cálculo de score (simplificadas para Edge Function)
function calculateResponseTimeScore(responseTimeMinutes: number | null): number {
  if (!responseTimeMinutes || responseTimeMinutes < 0) return 0;
  if (responseTimeMinutes < 5) return 30;
  if (responseTimeMinutes < 60) return 20;
  if (responseTimeMinutes < 1440) return 10;
  return 0;
}

function calculateOptimalHourScore(hour: number | null): number {
  if (hour === null || hour === undefined || hour < 0 || hour > 23) return 0;
  const optimalHours = [9, 10, 11, 14, 15, 16];
  if (optimalHours.includes(hour)) return 20;
  const goodHours = [8, 12, 13, 17];
  if (goodHours.includes(hour)) return 15;
  const fairHours = [7, 18, 19];
  if (fairHours.includes(hour)) return 10;
  return 5;
}

function calculateUrgencyKeywordsScore(notes: string | null): { score: number; keywords: string[] } {
  if (!notes) return { score: 0, keywords: [] };
  
  const keywords = [
    'urgente', 'urgência', 'urgent',
    'primeira vez', 'primeira consulta', 'primeiro',
    'seguro', 'convênio', 'plano',
    'agora', 'hoje', 'imediato', 'imediata',
    'preciso', 'necessito', 'quero',
    'disponibilidade', 'vaga', 'horário',
  ];
  
  const notesLower = notes.toLowerCase();
  let score = 0;
  const foundKeywords: string[] = [];
  
  for (const keyword of keywords) {
    if (notesLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
      if (['urgente', 'urgência', 'agora', 'hoje'].includes(keyword.toLowerCase())) {
        score += 8;
      } else if (['primeira vez', 'primeira consulta', 'seguro', 'convênio'].includes(keyword.toLowerCase())) {
        score += 6;
      } else {
        score += 3;
      }
    }
  }
  
  return { score: Math.min(score, 25), keywords: foundKeywords };
}

function calculateOriginScore(origin: string): number {
  const scores: Record<string, number> = {
    google: 15,
    instagram: 15,
    facebook: 12,
    indication: 10,
    website: 8,
    other: 5,
  };
  return scores[origin] || 5;
}

function calculateValueScore(estimatedValue: number | null): number {
  if (!estimatedValue || estimatedValue <= 0) return 0;
  if (estimatedValue >= 1000) return 10;
  if (estimatedValue >= 500) return 7;
  if (estimatedValue >= 200) return 5;
  return 2;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lead_id, user_id }: CalculateScoreRequest = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUserId = user_id || user.id;

    // Buscar lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('commercial_leads')
      .select('*')
      .eq('id', lead_id)
      .eq('user_id', targetUserId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular tempo de resposta (se houver interações)
    let responseTimeMinutes: number | null = lead.first_response_time_minutes || null;
    
    if (!responseTimeMinutes && lead.created_at) {
      // Buscar primeira interação
      const { data: firstActivity } = await supabaseAdmin
        .from('crm_activities')
        .select('created_at')
        .eq('contact_id', lead.contact_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (firstActivity) {
        const leadCreated = new Date(lead.created_at);
        const firstContact = new Date(firstActivity.created_at);
        responseTimeMinutes = Math.floor((firstContact.getTime() - leadCreated.getTime()) / (1000 * 60));
      }
    }

    // Determinar horário ótimo (usar horário de criação do lead)
    const leadCreated = new Date(lead.created_at);
    const optimalHour = lead.optimal_contact_hour || leadCreated.getHours();

    // Calcular scores
    const responseTimeScore = calculateResponseTimeScore(responseTimeMinutes);
    const optimalHourScore = calculateOptimalHourScore(optimalHour);
    const urgencyResult = calculateUrgencyKeywordsScore(lead.notes || null);
    const urgencyScore = urgencyResult.score;
    const originScore = calculateOriginScore(lead.origin);
    const valueScore = calculateValueScore(lead.estimated_value);

    // Pesos padrão
    const weights = {
      response_time: 30,
      urgency_keywords: 25,
      optimal_hour: 20,
      origin: 15,
      estimated_value: 10,
    };

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    // Calcular score final (0-100)
    const weightedScore = Math.round(
      (responseTimeScore * weights.response_time +
       optimalHourScore * weights.optimal_hour +
       urgencyScore * weights.urgency_keywords +
       originScore * weights.origin +
       valueScore * weights.estimated_value) / totalWeight * 100
    );

    const finalScore = Math.max(0, Math.min(100, weightedScore));

    // Preparar fatores detalhados
    const factors = {
      response_time: responseTimeScore,
      optimal_hour: optimalHourScore,
      urgency_keywords: urgencyScore,
      origin: originScore,
      estimated_value: valueScore,
    };

    // Atualizar lead com score
    const { error: updateError } = await supabaseAdmin
      .from('commercial_leads')
      .update({
        conversion_score: finalScore,
        score_updated_at: new Date().toISOString(),
        first_response_time_minutes: responseTimeMinutes,
        optimal_contact_hour: optimalHour,
        urgency_keywords: urgencyResult.keywords,
      })
      .eq('id', lead_id);

    if (updateError) {
      console.error('Error updating lead score:', updateError);
    }

    // Salvar histórico
    await supabaseAdmin
      .from('lead_score_history')
      .insert({
        lead_id: lead_id,
        contact_id: lead.contact_id,
        score: finalScore,
        factors: factors,
      });

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead_id,
        score: finalScore,
        factors: factors,
        urgency_keywords: urgencyResult.keywords,
        optimal_contact_hour: optimalHour,
        response_time_minutes: responseTimeMinutes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in calculate-lead-score function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

