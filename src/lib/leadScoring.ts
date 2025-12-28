import { CommercialLead, CommercialLeadOrigin } from '@/types/commercial';
import { DEFAULT_SCORE_WEIGHTS, LeadScoreFactorConfig } from '@/types/leadScoring';

/**
 * Calcula score baseado no tempo de resposta
 * @param responseTimeMinutes Tempo em minutos até primeira resposta
 * @returns Score de 0 a 30
 */
export function calculateResponseTimeScore(responseTimeMinutes: number | null | undefined): number {
  if (!responseTimeMinutes || responseTimeMinutes < 0) return 0;
  
  // < 5 minutos = 30pts
  if (responseTimeMinutes < 5) return 30;
  // < 1 hora = 20pts
  if (responseTimeMinutes < 60) return 20;
  // < 24 horas = 10pts
  if (responseTimeMinutes < 1440) return 10;
  // >= 24 horas = 0pts
  return 0;
}

/**
 * Calcula score baseado no horário de contato
 * @param hour Hora do dia (0-23)
 * @param historicalData Dados históricos de conversão por horário (opcional)
 * @returns Score de 0 a 20
 */
export function calculateOptimalHourScore(
  hour: number | null | undefined,
  historicalData?: Record<number, number>
): number {
  if (hour === null || hour === undefined || hour < 0 || hour > 23) return 0;
  
  // Horários ótimos baseados em padrões comuns (9h-11h, 14h-16h)
  const optimalHours = [9, 10, 11, 14, 15, 16];
  
  if (optimalHours.includes(hour)) {
    return 20;
  }
  
  // Horários bons (8h, 12h, 13h, 17h)
  const goodHours = [8, 12, 13, 17];
  if (goodHours.includes(hour)) {
    return 15;
  }
  
  // Horários razoáveis (7h, 18h, 19h)
  const fairHours = [7, 18, 19];
  if (fairHours.includes(hour)) {
    return 10;
  }
  
  // Outros horários = 5pts
  return 5;
}

/**
 * Calcula score baseado em keywords de urgência
 * @param notes Notas do lead
 * @param keywords Array de keywords de urgência
 * @returns Score de 0 a 25
 */
export function calculateUrgencyKeywordsScore(
  notes: string | null | undefined,
  keywords?: string[]
): number {
  if (!notes) return 0;
  
  const defaultKeywords = [
    'urgente', 'urgência', 'urgent',
    'primeira vez', 'primeira consulta', 'primeiro',
    'seguro', 'convênio', 'plano',
    'agora', 'hoje', 'imediato', 'imediata',
    'preciso', 'necessito', 'quero',
    'disponibilidade', 'vaga', 'horário',
  ];
  
  const searchKeywords = keywords || defaultKeywords;
  const notesLower = notes.toLowerCase();
  
  let score = 0;
  let foundKeywords: string[] = [];
  
  for (const keyword of searchKeywords) {
    if (notesLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
      // Keywords mais importantes têm mais peso
      if (['urgente', 'urgência', 'agora', 'hoje'].includes(keyword.toLowerCase())) {
        score += 8;
      } else if (['primeira vez', 'primeira consulta', 'seguro', 'convênio'].includes(keyword.toLowerCase())) {
        score += 6;
      } else {
        score += 3;
      }
    }
  }
  
  // Máximo de 25 pontos
  return Math.min(score, 25);
}

/**
 * Calcula score baseado na origem do lead
 * @param origin Origem do lead
 * @returns Score de 0 a 15
 */
export function calculateOriginScore(origin: CommercialLeadOrigin): number {
  const originScores: Record<CommercialLeadOrigin, number> = {
    google: 15,
    instagram: 15,
    facebook: 12,
    indication: 10,
    website: 8,
    other: 5,
  };
  
  return originScores[origin] || 5;
}

/**
 * Calcula score baseado no valor estimado
 * @param estimatedValue Valor estimado do lead
 * @returns Score de 0 a 10
 */
export function calculateValueScore(estimatedValue: number | null | undefined): number {
  if (!estimatedValue || estimatedValue <= 0) return 0;
  
  // Valores altos (> R$ 1000) = 10pts
  if (estimatedValue >= 1000) return 10;
  // Valores médios (R$ 500-999) = 7pts
  if (estimatedValue >= 500) return 7;
  // Valores baixos (R$ 200-499) = 5pts
  if (estimatedValue >= 200) return 5;
  // Valores muito baixos (< R$ 200) = 2pts
  return 2;
}

/**
 * Calcula score completo de um lead
 * @param lead Lead comercial
 * @param factors Fatores configurados (opcional)
 * @param config Configuração de scoring (opcional)
 * @returns Score total (0-100) e detalhamento dos fatores
 */
export function calculateLeadScore(
  lead: CommercialLead,
  factors?: Record<string, LeadScoreFactorConfig>,
  config?: {
    weights?: Partial<typeof DEFAULT_SCORE_WEIGHTS>;
    urgencyKeywords?: string[];
  }
): {
  score: number;
  factors: {
    response_time: number;
    optimal_hour: number;
    urgency_keywords: number;
    origin: number;
    estimated_value: number;
  };
  urgency_keywords: string[];
  optimal_contact_hour: number | null;
} {
  const weights = config?.weights || DEFAULT_SCORE_WEIGHTS;
  const urgencyKeywords = config?.urgencyKeywords;
  
  // Calcular cada fator
  const responseTimeScore = calculateResponseTimeScore(lead.first_response_time_minutes || null);
  const optimalHourScore = calculateOptimalHourScore(lead.optimal_contact_hour || null);
  const urgencyKeywordsScore = calculateUrgencyKeywordsScore(lead.notes || null, urgencyKeywords);
  const originScore = calculateOriginScore(lead.origin);
  const valueScore = calculateValueScore(lead.estimated_value || null);
  
  // Aplicar pesos (normalizar para 0-100)
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  const weightedScore = Math.round(
    (responseTimeScore * weights.response_time +
     optimalHourScore * weights.optimal_hour +
     urgencyKeywordsScore * weights.urgency_keywords +
     originScore * weights.origin +
     valueScore * weights.estimated_value) / totalWeight * 100
  );
  
  // Garantir que está entre 0 e 100
  const finalScore = Math.max(0, Math.min(100, weightedScore));
  
  // Extrair keywords encontradas
  const foundKeywords: string[] = [];
  if (lead.notes) {
    const notesLower = lead.notes.toLowerCase();
    const searchKeywords = urgencyKeywords || [
      'urgente', 'urgência', 'primeira vez', 'seguro', 'agora', 'hoje'
    ];
    
    for (const keyword of searchKeywords) {
      if (notesLower.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }
  }
  
  return {
    score: finalScore,
    factors: {
      response_time: responseTimeScore,
      optimal_hour: optimalHourScore,
      urgency_keywords: urgencyKeywordsScore,
      origin: originScore,
      estimated_value: valueScore,
    },
    urgency_keywords: foundKeywords,
    optimal_contact_hour: lead.optimal_contact_hour || null,
  };
}

/**
 * Determina o horário ótimo de contato baseado em histórico
 * @param historicalData Dados históricos de conversão por horário
 * @returns Horário ótimo (0-23) ou null
 */
export function determineOptimalContactHour(
  historicalData?: Record<number, { conversions: number; total: number }>
): number | null {
  if (!historicalData || Object.keys(historicalData).length === 0) {
    // Default: horário comercial (10h)
    return 10;
  }
  
  // Calcular taxa de conversão por horário
  const conversionRates: Array<{ hour: number; rate: number }> = [];
  
  for (const [hourStr, data] of Object.entries(historicalData)) {
    const hour = parseInt(hourStr);
    const rate = data.total > 0 ? data.conversions / data.total : 0;
    conversionRates.push({ hour, rate });
  }
  
  // Ordenar por taxa de conversão (maior primeiro)
  conversionRates.sort((a, b) => b.rate - a.rate);
  
  // Retornar horário com maior taxa de conversão
  return conversionRates.length > 0 ? conversionRates[0].hour : null;
}


