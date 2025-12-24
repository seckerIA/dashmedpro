/**
 * Meta Ads API Helper
 * 
 * Nota: As chamadas reais à API serão feitas via Edge Functions
 * Este arquivo contém helpers e tipos para uso no frontend
 */

export interface MetaAdsCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdsMetrics {
  impressions: number;
  clicks: number;
  spend: number; // Em centavos (dividir por 100)
  actions: Array<{
    action_type: string;
    value: number;
  }>;
  action_values?: Array<{
    action_type: string;
    value: number;
  }>;
}

export interface MetaAdsCampaignWithMetrics extends MetaAdsCampaign {
  metrics: MetaAdsMetrics;
  ctr?: number;
  cpa?: number;
  roas?: number;
}

/**
 * Converte status do Meta Ads para formato interno
 */
export function mapMetaAdsStatus(status: string): 'active' | 'paused' | 'ended' | 'removed' {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'ARCHIVED':
    case 'DELETED':
      return 'removed';
    default:
      return 'ended';
  }
}

/**
 * Converte centavos para valor decimal
 */
export function centsToDecimal(cents: number): number {
  return cents / 100;
}

/**
 * Extrai conversões das actions do Meta Ads
 */
export function extractConversions(actions: Array<{ action_type: string; value: number }>): number {
  // Tipos de conversão comuns no Meta Ads
  const conversionTypes = [
    'purchase',
    'lead',
    'complete_registration',
    'schedule',
    'contact',
  ];

  return actions
    .filter(action => conversionTypes.includes(action.action_type.toLowerCase()))
    .reduce((sum, action) => sum + action.value, 0);
}

/**
 * Extrai valor de conversão das action_values do Meta Ads
 */
export function extractConversionValue(
  actionValues?: Array<{ action_type: string; value: number }>
): number {
  if (!actionValues) return 0;

  // Tipos de conversão com valor monetário
  const valueTypes = ['purchase', 'lead', 'schedule'];

  return actionValues
    .filter(action => valueTypes.includes(action.action_type.toLowerCase()))
    .reduce((sum, action) => sum + action.value, 0);
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
export function calculateCPA(spend: number, conversions: number): number | null {
  if (conversions === 0) return null;
  return spend / conversions;
}

/**
 * Calcula ROAS (Return on Ad Spend)
 */
export function calculateROAS(conversionValue: number, spend: number): number | null {
  if (spend === 0) return null;
  return conversionValue / spend;
}

/**
 * Valida Access Token do Meta Ads (formato básico)
 */
export function validateMetaAdsAccessToken(token: string): boolean {
  // Meta Ads access tokens têm um formato específico
  // Esta é uma validação básica - validação real será feita na Edge Function
  return token.length > 0 && token.trim().length === token.length;
}

/**
 * Valida Ad Account ID do Meta Ads
 */
export function validateMetaAdsAccountId(accountId: string): boolean {
  // Meta Ads Account ID geralmente começa com 'act_' seguido de números
  return /^act_\d+$/.test(accountId);
}

