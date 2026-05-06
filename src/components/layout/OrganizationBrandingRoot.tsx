import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { resolveOrganizationPortal } from '@/lib/organizationPortal';
import { applyTenantThemeStyles, clearTenantThemeStyles } from '@/lib/brandingCss';

/**
 * Aplica tema e marca da organização (`organizations.portal_settings`) no documento.
 * Desliga overrides quando valores não são enviados (volta aos tokens do tema).
 */
export function OrganizationBrandingRoot() {
  const { organization } = useAuth();
  const portal = useMemo(
    () =>
      resolveOrganizationPortal(organization?.portal_settings ?? null, {
        organizationName: organization?.name,
        organizationSlug: organization?.slug,
      }),
    [organization?.portal_settings, organization?.name, organization?.slug],
  );

  useEffect(() => {
    const { primary_hsl: p, accent_hsl: a, gold_hsl: g } = portal.branding;
    applyTenantThemeStyles(document.documentElement, {
      primary: p,
      accent: a,
      gold: g,
    });
    return () => clearTenantThemeStyles(document.documentElement);
  }, [portal.branding.primary_hsl, portal.branding.accent_hsl, portal.branding.gold_hsl]);

  return null;
}
