/**
 * Custos fixos mensais planejados de marketing (financeiro / KPIs).
 * Assessoria + investimento em mídia + retenções/tributos sobre o valor investido em anúncios.
 */
export const MONTHLY_MARKETING_ADVISORY_BRL = 4000;

/** Investimento mensal planejado em anúncios (valor líquido de mídia). */
export const MONTHLY_ADS_MEDIA_INVESTMENT_BRL = 2000;

/**
 * Parcela sobre o investimento em anúncios (ex.: retenções / tributos pagos ao fisco).
 * Aplicada sobre MONTHLY_ADS_MEDIA_INVESTMENT_BRL (13% de R$ 2.000 = R$ 260).
 */
export const MONTHLY_ADS_GOVERNMENT_LEVY_RATE = 0.13;

export function getMonthlyMarketingFixedCostsTotalBrl(): number {
  const levy =
    MONTHLY_ADS_MEDIA_INVESTMENT_BRL * MONTHLY_ADS_GOVERNMENT_LEVY_RATE;
  return (
    MONTHLY_MARKETING_ADVISORY_BRL +
    MONTHLY_ADS_MEDIA_INVESTMENT_BRL +
    levy
  );
}
