// Ad Platforms Integration Types
// Google Ads e Meta Ads - Versão Simplificada Utimify

export type AdPlatform = 'google_ads' | 'meta_ads';
export type SyncStatus = 'success' | 'error' | 'pending';
export type AdCampaignStatus = 'active' | 'paused' | 'ended' | 'removed';
export type AdAccountCategory = 'bm' | 'waba' | 'other' | 'page';

// =====================================================
// AD PLATFORM CONNECTIONS
// =====================================================

export interface AdPlatformConnection {
  id: string;
  user_id: string;
  platform: AdPlatform;
  account_id: string;
  account_name: string;
  account_category: AdAccountCategory;
  api_key: string;
  refresh_token?: string | null;
  is_active: boolean;
  last_sync_at?: string | null;
  sync_status: SyncStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdPlatformConnectionInsert {
  user_id: string;
  platform: AdPlatform;
  account_id: string;
  account_name: string;
  api_key: string;
  refresh_token?: string | null;
  is_active?: boolean;
}

export interface AdPlatformConnectionUpdate {
  account_name?: string;
  account_category?: AdAccountCategory;
  api_key?: string;
  refresh_token?: string | null;
  is_active?: boolean;
  last_sync_at?: string | null;
  sync_status?: SyncStatus;
  error_message?: string | null;
}

// =====================================================
// AD CAMPAIGNS
// =====================================================

export interface AdCampaignSync {
  id: string;
  user_id: string;
  connection_id: string;
  platform_campaign_id: string;
  platform_campaign_name: string;
  platform: AdPlatform;
  status: AdCampaignStatus;
  budget?: number | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_value: number;
  cpa?: number | null;
  roas?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface AdCampaignSyncInsert {
  user_id: string;
  connection_id: string;
  platform_campaign_id: string;
  platform_campaign_name: string;
  platform: AdPlatform;
  status?: AdCampaignStatus;
  budget?: number | null;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  conversion_value?: number;
  cpa?: number | null;
  roas?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface AdCampaignSyncUpdate {
  platform_campaign_name?: string;
  status?: AdCampaignStatus;
  budget?: number | null;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  conversion_value?: number;
  cpa?: number | null;
  roas?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  synced_at?: string;
}

export interface UtmTemplate {
  id: string;
  user_id: string;
  name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string | null;
  utm_content?: string | null;
  base_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UtmTemplateInsert {
  user_id: string;
  name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string | null;
  utm_content?: string | null;
  base_url: string;
  is_active?: boolean;
}

export interface UtmTemplateUpdate {
  name?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string | null;
  utm_content?: string | null;
  base_url?: string;
  is_active?: boolean;
}

export interface GeneratedUtm {
  id: string;
  user_id: string;
  template_id?: string | null;
  ad_campaign_sync_id?: string | null;
  full_url: string;
  clicks: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedUtmInsert {
  user_id: string;
  template_id?: string | null;
  ad_campaign_sync_id?: string | null;
  full_url: string;
  clicks?: number;
  conversions?: number;
}

export interface GeneratedUtmUpdate {
  clicks?: number;
  conversions?: number;
}

export interface AdCampaignWithConnection extends AdCampaignSync {
  connection?: AdPlatformConnection;
}

export interface UtmGenerationParams {
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
}

export interface AdCampaignMetrics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  average_ctr: number;
  total_conversions: number;
  total_conversion_value: number;
  average_cpa: number;
  average_roas: number;
}

// =====================================================
// LABELS FOR UI
// =====================================================

export const AD_PLATFORM_LABELS: Record<AdPlatform, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads (Facebook/Instagram)',
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  success: 'Sucesso',
  error: 'Erro',
  pending: 'Pendente',
};

export const AD_CAMPAIGN_STATUS_LABELS: Record<AdCampaignStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  ended: 'Finalizada',
  removed: 'Removida',
};

export const AD_ACCOUNT_CATEGORY_LABELS: Record<AdAccountCategory, string> = {
  other: 'Contas de Anúncio',
  waba: 'WhatsApp Business',
  bm: 'Business Manager',
  page: 'Facebook Pages',
};
