/**
 * Tokens `--primary`, `--accent`, etc. esperam triplet `H S% L%`, igual ao Tailwind/theme.
 */

export const DEFAULT_PRIMARY_HSL = '221 83% 53%';

const TRIPLET_RE = /^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/;

/** Converte `#RRGGBB` ou `RRGGBB` para triplet HSL aproximado. */
export function hexToPrimaryHslTriplet(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

export function parseHslTriplet(raw: string): [number, number, number] | null {
  const m = TRIPLET_RE.exec(raw.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const s = Number(m[2]);
  const l = Number(m[3]);
  if ([h, s, l].some((n) => Number.isNaN(n))) return null;
  return [h, s, l];
}

/** Normaliza cor de branding (#hex ou triplet válido). */
export function normalizeBrandingHsl(raw?: string | null): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (s.startsWith('#')) return hexToPrimaryHslTriplet(s);
  if (parseHslTriplet(s)) return s;
  if (/^[0-9a-fA-F]{6}$/.test(s)) return hexToPrimaryHslTriplet(`#${s}`);
  return null;
}

function formatTriplet(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function darkenTriplet(triplet: string, delta = 8): string | null {
  const p = parseHslTriplet(triplet);
  if (!p) return null;
  const [h, s, l] = p;
  return formatTriplet(h, s, Math.max(6, Math.min(94, l - delta)));
}

export type TenantThemeTokens = {
  primary?: string | null;
  accent?: string | null;
  gold?: string | null;
};

const TENANT_INLINE_KEYS = [
  '--primary',
  '--accent',
  '--accent-foreground',
  '--ring',
  '--sidebar-primary',
  '--sidebar-accent-foreground',
  '--sidebar-ring',
  '--gold',
  '--gold-foreground',
  '--chart-1',
  '--gradient-primary',
  '--gradient-accent',
  '--shadow-brand',
  '--shadow-glow',
] as const;

export function clearTenantThemeStyles(root: HTMLElement): void {
  for (const k of TENANT_INLINE_KEYS) {
    root.style.removeProperty(k);
  }
}

/**
 * Aplica marca da org em `:root`; limpa primeiro e volta ao tema do `index.css` quando não há tokens.
 */
export function applyTenantThemeStyles(root: HTMLElement, tokens: TenantThemeTokens | null | undefined): void {
  clearTenantThemeStyles(root);
  const primary = normalizeBrandingHsl(tokens?.primary ?? null);
  const accent = normalizeBrandingHsl(tokens?.accent ?? null);
  const gold = normalizeBrandingHsl(tokens?.gold ?? null);
  const primaryUsed = primary ?? accent;
  const accentUsed = accent ?? primary;
  if (!primaryUsed) return;

  root.style.setProperty('--primary', primaryUsed);
  root.style.setProperty('--accent', accentUsed ?? primaryUsed);

  const gradientEnd = accent && primary ? accent : darkenTriplet(primaryUsed) ?? primaryUsed;
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${primaryUsed}), hsl(${gradientEnd}))`,
  );
  root.style.setProperty(
    '--gradient-accent',
    `linear-gradient(90deg, hsl(${primaryUsed} / 0.12), hsl(${gradientEnd} / 0.12))`,
  );

  root.style.setProperty('--ring', primaryUsed);
  root.style.setProperty('--sidebar-primary', primaryUsed);
  root.style.setProperty('--sidebar-accent-foreground', primaryUsed);
  root.style.setProperty('--sidebar-ring', accentUsed ?? primaryUsed);

  const [, , accentL] = parseHslTriplet(accentUsed ?? primaryUsed) ?? [0, 0, 50];
  root.style.setProperty('--accent-foreground', accentL < 72 ? '0 0% 100%' : '222 47% 11%');

  root.style.setProperty('--chart-1', accent ?? primaryUsed);

  root.style.setProperty('--shadow-brand', `0 10px 40px -10px hsl(${primaryUsed} / 0.38)`);

  if (gold) {
    root.style.setProperty('--gold', gold);
    const [, , gl] = parseHslTriplet(gold) ?? [0, 0, 50];
    root.style.setProperty('--gold-foreground', gl < 72 ? '0 0% 100%' : '222 47% 11%');
  }

  root.style.setProperty('--shadow-glow', `0 0 28px hsl(${(accentUsed ?? primaryUsed)} / 0.22)`);
}
