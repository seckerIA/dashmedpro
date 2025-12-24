export interface LeadScoreFactor {
  id: string;
  user_id: string;
  factor_name: 'response_time' | 'urgency_keywords' | 'optimal_hour' | 'origin' | 'estimated_value';
  weight: number;
  enabled: boolean;
  config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface LeadScore {
  lead_id: string;
  contact_id?: string | null;
  score: number;
  factors: {
    response_time: number;
    optimal_hour: number;
    urgency_keywords: number;
    origin: number;
    estimated_value: number;
  };
  calculated_at: string;
}

export interface LeadScoreHistory {
  id: string;
  lead_id?: string | null;
  contact_id?: string | null;
  score: number;
  factors: Record<string, number>;
  calculated_at: string;
}

export type LeadScoreLevel = 'high' | 'medium' | 'low';

export interface LeadScoreFactorConfig {
  response_time: {
    thresholds: {
      excellent: number; // < 5 minutos
      good: number; // < 1 hora
      fair: number; // < 24 horas
    };
  };
  urgency_keywords: {
    keywords: string[];
    weights: Record<string, number>;
  };
  optimal_hour: {
    preferred_hours: number[];
    weights: Record<number, number>;
  };
  origin: {
    weights: Record<string, number>;
  };
  estimated_value: {
    thresholds: {
      high: number;
      medium: number;
    };
  };
}

export const DEFAULT_SCORE_WEIGHTS = {
  response_time: 30,
  urgency_keywords: 25,
  optimal_hour: 20,
  origin: 15,
  estimated_value: 10,
} as const;

export const SCORE_LEVELS = {
  high: { min: 70, max: 100, label: 'Alta Probabilidade', color: 'green' },
  medium: { min: 40, max: 69, label: 'Média Probabilidade', color: 'yellow' },
  low: { min: 0, max: 39, label: 'Baixa Probabilidade', color: 'red' },
} as const;

export function getScoreLevel(score: number): LeadScoreLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getScoreLevelConfig(score: number) {
  const level = getScoreLevel(score);
  return SCORE_LEVELS[level];
}

