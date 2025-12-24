/**
 * Google Ads API Helper
 * 
 * Nota: As chamadas reais à API serão feitas via Edge Functions
 * Este arquivo contém helpers e tipos para uso no frontend
 */

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  budget: number;
  startDate?: string;
  endDate?: string;
}

export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  cost: number; // Em micros (dividir por 1,000,000)
  conversions: number;
  conversionValue: number; // Em micros
}

export interface GoogleAdsCampaignWithMetrics extends GoogleAdsCampaign {
  metrics: GoogleAdsMetrics;
  ctr?: number;
  cpa?: number;
  roas?: number;
}

/**
 * Converte status do Google Ads para formato interno
 */
export function mapGoogleAdsStatus(status: string): 'active' | 'paused' | 'ended' | 'removed' {
  switch (status) {
    case 'ENABLED':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'REMOVED':
      return 'removed';
    default:
      return 'ended';
  }
}

/**
 * Converte micros para valor decimal
 */
export function microsToDecimal(micros: number): number {
  return micros / 1_000_000;
}

/**
 * Calcula CTR (Click-Through Rate)
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100; // Retorna em porcentagem
}

/**
 * Calcula CPA (Cost Per Acquisition)
 */
export function calculateCPA(cost: number, conversions: number): number | null {
  if (conversions === 0) return null;
  return cost / conversions;
}

/**
 * Calcula ROAS (Return on Ad Spend)
 */
export function calculateROAS(conversionValue: number, cost: number): number | null {
  if (cost === 0) return null;
  return conversionValue / cost;
}

/**
 * Valida API Key do Google Ads (formato básico)
 */
export function validateGoogleAdsApiKey(apiKey: string): boolean {
  // Google Ads API keys geralmente têm um formato específico
  // Esta é uma validação básica - validação real será feita na Edge Function
  return apiKey.length > 0 && apiKey.trim().length === apiKey.length;
}

/**
 * Valida Account ID do Google Ads
 */
export function validateGoogleAdsAccountId(accountId: string): boolean {
  // Google Ads Customer ID geralmente é um número de 10 dígitos
  return /^\d{10}$/.test(accountId);
}

