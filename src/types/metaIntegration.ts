/**
 * Meta Business Platform Integration Types
 * Tipos para OAuth centralizado: WhatsApp Business + Meta Ads
 */

// =====================================================
// OAuth Session Types
// =====================================================

export interface MetaBusiness {
  id: string;
  name: string;
}

export interface MetaPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
  code_verification_status?: string;
}

export interface MetaWhatsAppAccount {
  id: string;
  name: string;
  timezone_id?: string;
  message_template_namespace?: string;
  phone_numbers?: MetaPhoneNumber[];
}

export interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name?: string;
}

export interface MetaOAuthSession {
  id: string;
  user_id: string;
  access_token: string;
  token_expires_at: string;
  businesses: MetaBusiness[];
  whatsapp_accounts: MetaWhatsAppAccount[];
  ad_accounts: MetaAdAccount[];
  expires_at: string;
  created_at: string;
}

// =====================================================
// Integration Config Types
// =====================================================

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  organization_id?: string;
  phone_number_id: string;
  waba_id?: string;
  access_token: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  webhook_verify_token?: string;
  is_active: boolean;
  oauth_connected?: boolean;
  oauth_expires_at?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdPlatformConnection {
  id: string;
  user_id: string;
  organization_id?: string;
  platform: 'meta_ads' | 'google_ads';
  account_id: string;
  account_name?: string;
  api_key?: string;
  is_active: boolean;
  sync_status?: 'pending' | 'success' | 'error';
  last_sync_at?: string;
  error_message?: string;
  metadata?: {
    currency?: string;
    timezone?: string;
    account_status?: number;
    oauth_expires_at?: string;
  };
  created_at: string;
  updated_at: string;
}

// =====================================================
// Integration Status Types
// =====================================================

export interface MetaIntegrationStatus {
  whatsapp: {
    connected: boolean;
    config?: WhatsAppConfig;
    expiresAt?: Date;
  };
  ads: {
    connected: boolean;
    connections: AdPlatformConnection[];
  };
}

// =====================================================
// API Response Types
// =====================================================

export interface MetaOAuthCallbackResponse {
  success: boolean;
  error?: string;
  integration?: 'whatsapp' | 'ads';
  config?: Record<string, any>;
  connection?: Record<string, any>;
  webhook_configured?: boolean;
  webhook_url?: string;
  webhook_verify_token?: string;
  session?: {
    id: string;
    expires_at: string;
    token_expires_at: string;
    businesses: MetaBusiness[];
    whatsapp_accounts: MetaWhatsAppAccount[];
    ad_accounts: MetaAdAccount[];
  };
  message?: string;
}

// =====================================================
// OAuth Flow Types
// =====================================================

export interface MetaOAuthStartParams {
  scopes?: string[];
  redirectTo?: string;
}

// Escopos apenas para WhatsApp Business e Meta Ads
export const META_DEFAULT_SCOPES = [
  'business_management',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'ads_management',
  'ads_read',
];

export function buildMetaOAuthUrl(
  userId: string,
  appId: string,
  redirectUri: string,
  scopes: string[] = META_DEFAULT_SCOPES
): string {
  const state = userId;
  const scopeString = scopes.join(',');

  return (
    `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scopeString)}` +
    `&response_type=code`
  );
}
