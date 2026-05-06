import { hexToPrimaryHslTriplet } from '@/lib/brandingCss';

/** Hex extraídos de `cores paleta/` (referência visual do cliente). */
export const JOAO_PAULO_HEX = {
  primary: '#008672',
  accent: '#55BEAF',
  neutralStrong: '#4A4A4A',
  neutralMuted: '#818181',
  gold: '#DCBE71',
  canvas: '#FBFBFB',
  paper: '#FFFFFF',
} as const;

export const JOAO_PAULO_BROWNS_HEX = [
  '#996623',
  '#A5722F',
  '#B68238',
  '#BA8F45',
  '#CCA54F',
  '#DBAF60',
  '#EFD068',
  '#F8E576',
] as const;

const t = (hex: string) => hexToPrimaryHslTriplet(hex)!;

export const JOAO_PAULO_PRESET_COLORS = {
  primary_hsl: t(JOAO_PAULO_HEX.primary),
  accent_hsl: t(JOAO_PAULO_HEX.accent),
  gold_hsl: t(JOAO_PAULO_HEX.gold),
} as const;
