import type { UtmGenerationParams } from '@/types/adPlatforms';

/**
 * Constrói uma URL completa com parâmetros UTM
 */
export function buildUtmUrl(params: UtmGenerationParams): string {
  const { base_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = params;

  // Validar URL base
  try {
    new URL(base_url);
  } catch {
    throw new Error('URL base inválida');
  }

  // Construir parâmetros UTM
  const utmParams = new URLSearchParams();
  utmParams.set('utm_source', utm_source);
  utmParams.set('utm_medium', utm_medium);
  utmParams.set('utm_campaign', utm_campaign);
  
  if (utm_term) {
    utmParams.set('utm_term', utm_term);
  }
  if (utm_content) {
    utmParams.set('utm_content', utm_content);
  }

  // Combinar URL base com parâmetros
  const separator = base_url.includes('?') ? '&' : '?';
  return `${base_url}${separator}${utmParams.toString()}`;
}

/**
 * Parseia parâmetros UTM de uma URL existente
 */
export function parseUtmFromUrl(url: string): Partial<UtmGenerationParams> | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const utm_source = params.get('utm_source');
    const utm_medium = params.get('utm_medium');
    const utm_campaign = params.get('utm_campaign');

    if (!utm_source || !utm_medium || !utm_campaign) {
      return null;
    }

    return {
      base_url: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Valida parâmetros UTM
 */
export function validateUtmParams(params: UtmGenerationParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.base_url || !isValidUrl(params.base_url)) {
    errors.push('URL base inválida');
  }

  if (!params.utm_source || params.utm_source.trim().length === 0) {
    errors.push('utm_source é obrigatório');
  }

  if (!params.utm_medium || params.utm_medium.trim().length === 0) {
    errors.push('utm_medium é obrigatório');
  }

  if (!params.utm_campaign || params.utm_campaign.trim().length === 0) {
    errors.push('utm_campaign é obrigatório');
  }

  // Validar comprimento máximo (limite do Google Analytics)
  if (params.utm_source && params.utm_source.length > 100) {
    errors.push('utm_source não pode ter mais de 100 caracteres');
  }
  if (params.utm_medium && params.utm_medium.length > 100) {
    errors.push('utm_medium não pode ter mais de 100 caracteres');
  }
  if (params.utm_campaign && params.utm_campaign.length > 100) {
    errors.push('utm_campaign não pode ter mais de 100 caracteres');
  }
  if (params.utm_term && params.utm_term.length > 100) {
    errors.push('utm_term não pode ter mais de 100 caracteres');
  }
  if (params.utm_content && params.utm_content.length > 100) {
    errors.push('utm_content não pode ter mais de 100 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida se uma string é uma URL válida
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formata parâmetros UTM para exibição
 */
export function formatUtmParams(params: UtmGenerationParams): string {
  const parts: string[] = [];
  
  parts.push(`Source: ${params.utm_source}`);
  parts.push(`Medium: ${params.utm_medium}`);
  parts.push(`Campaign: ${params.utm_campaign}`);
  
  if (params.utm_term) {
    parts.push(`Term: ${params.utm_term}`);
  }
  if (params.utm_content) {
    parts.push(`Content: ${params.utm_content}`);
  }

  return parts.join(' | ');
}

