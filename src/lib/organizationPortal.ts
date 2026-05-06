import type { ResolvedOrganizationPortal } from '@/types/organization';
import { JOAO_PAULO_PRESET_COLORS } from '@/lib/tenantThemes/joaoPauloPaleta';

const DEFAULT_FEATURES = {
  crm_intelligence_tab: true,
  navigation_ai: true,
  module_inventory: true,
  module_commercial: true,
  module_whatsapp: true,
  module_financial: true,
  module_reports: true,
  module_team_management: true,
} as const;

export type { ResolvedOrganizationPortal };

export type OrganizationPortalContext = {
  organizationName?: string | null;
  organizationSlug?: string | null;
};

function trimStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function inferJoaoPauloPreset(ctx: OrganizationPortalContext | undefined): boolean {
  const name = ctx?.organizationName ?? '';
  const slug = (ctx?.organizationSlug ?? '').toLowerCase();
  if (/clínica\s+joão\s+paulo|clinica\s+joao\s+paulo/i.test(name)) return true;
  if (slug.includes('joao') && slug.includes('paulo')) return true;
  if (slug.includes('joaopaulo') || slug.includes('clinica-joao')) return true;
  return false;
}

/** Mescla portal_settings JSON da org com defaults (comportamento DashMed atual). */
export function resolveOrganizationPortal(
  raw: unknown,
  context?: OrganizationPortalContext,
): ResolvedOrganizationPortal {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const featuresIn =
    o.features && typeof o.features === 'object' ? (o.features as Record<string, unknown>) : {};

  const crm_intel = featuresIn.crm_intelligence_tab;
  const nav_ai = featuresIn.navigation_ai;
  const modInv = featuresIn.module_inventory;
  const modComm = featuresIn.module_commercial;
  const modWa = featuresIn.module_whatsapp;
  const modFin = featuresIn.module_financial;
  const modRep = featuresIn.module_reports;
  const modTeam = featuresIn.module_team_management;

  const brandingRaw =
    o.branding && typeof o.branding === 'object' ? (o.branding as Record<string, unknown>) : {};

  const explicitPresetRaw = brandingRaw.palette_preset;
  const explicitPreset =
    explicitPresetRaw === null || explicitPresetRaw === undefined
      ? undefined
      : trimStr(explicitPresetRaw)?.toLowerCase();

  const branding: ResolvedOrganizationPortal['branding'] = {};

  if (explicitPreset === 'dashmed') {
    branding.palette_preset = 'dashmed';
  } else if (
    explicitPreset === 'joao_paulo' ||
    (!explicitPreset && inferJoaoPauloPreset(context))
  ) {
    branding.primary_hsl = JOAO_PAULO_PRESET_COLORS.primary_hsl;
    branding.accent_hsl = JOAO_PAULO_PRESET_COLORS.accent_hsl;
    branding.gold_hsl = JOAO_PAULO_PRESET_COLORS.gold_hsl;
    if (explicitPreset === 'joao_paulo') branding.palette_preset = 'joao_paulo';
  }

  const overlayPrimary = trimStr(brandingRaw.primary_hsl);
  const overlayAccent = trimStr(brandingRaw.accent_hsl);
  const overlayGold = trimStr(brandingRaw.gold_hsl);
  const logo_url = trimStr(brandingRaw.logo_url);
  const sidebar_title = trimStr(brandingRaw.sidebar_title);

  if (overlayPrimary) branding.primary_hsl = overlayPrimary;
  if (overlayAccent) branding.accent_hsl = overlayAccent;
  if (overlayGold) branding.gold_hsl = overlayGold;
  if (logo_url) branding.logo_url = logo_url;
  if (sidebar_title) branding.sidebar_title = sidebar_title;

  if (typeof brandingRaw.sidebar_subtitle === 'string') {
    branding.sidebar_subtitle = brandingRaw.sidebar_subtitle.trim();
  }

  return {
    features: {
      crm_intelligence_tab:
        typeof crm_intel === 'boolean' ? crm_intel : DEFAULT_FEATURES.crm_intelligence_tab,
      navigation_ai: typeof nav_ai === 'boolean' ? nav_ai : DEFAULT_FEATURES.navigation_ai,
      module_inventory: typeof modInv === 'boolean' ? modInv : DEFAULT_FEATURES.module_inventory,
      module_commercial: typeof modComm === 'boolean' ? modComm : DEFAULT_FEATURES.module_commercial,
      module_whatsapp: typeof modWa === 'boolean' ? modWa : DEFAULT_FEATURES.module_whatsapp,
      module_financial: typeof modFin === 'boolean' ? modFin : DEFAULT_FEATURES.module_financial,
      module_reports: typeof modRep === 'boolean' ? modRep : DEFAULT_FEATURES.module_reports,
      module_team_management:
        typeof modTeam === 'boolean' ? modTeam : DEFAULT_FEATURES.module_team_management,
    },
    branding,
  };
}
