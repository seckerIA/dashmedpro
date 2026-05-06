import type { ResolvedOrganizationPortal } from '@/types/organization';

/**
 * Caminhos abrangidos por "Comercial / CRM" na sidebar (bloco Vendas).
 */
const COMMERCIAL_PATH_PREFIXES = [
  '/performance-comercial',
  '/comercial',
  '/calculadora',
  '/crm',
  '/procedimentos',
  '/calendar',
] as const;

function pathOnly(url: string): string {
  return (url.split('?')[0] || url).trim() || '/';
}

/** true = o item não deve aparecer na sidebar para este tenant */
export function isSidebarItemHiddenByPortal(
  itemUrl: string,
  portal: ResolvedOrganizationPortal,
): boolean {
  const f = portal.features;
  const p = pathOnly(itemUrl);

  if (p === '/') return false;

  if (!f.module_inventory && p.startsWith('/inventory')) return true;

  if (!f.module_commercial && COMMERCIAL_PATH_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`))) {
    return true;
  }

  if (!f.module_whatsapp && p.startsWith('/whatsapp')) return true;

  if (!f.module_financial && (p.startsWith('/financeiro') || p.startsWith('/secretaria/financeiro'))) {
    return true;
  }

  if (!f.module_reports && p === '/relatorios') return true;

  if (!f.module_team_management && p.startsWith('/equipe')) return true;

  return false;
}
