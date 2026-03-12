import { subDays, startOfDay } from 'date-fns';

export type PeriodFilter = 'all' | 'today' | '7d' | '14d' | '30d' | '90d';

export const PERIOD_FILTER_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'Todo o período' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

export function getPeriodStartDate(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  switch (period) {
    case 'today': return startOfDay(now);
    case '7d': return startOfDay(subDays(now, 7));
    case '14d': return startOfDay(subDays(now, 14));
    case '30d': return startOfDay(subDays(now, 30));
    case '90d': return startOfDay(subDays(now, 90));
    default: return null;
  }
}

export function isWithinPeriod(dateStr: string, period: PeriodFilter): boolean {
  if (period === 'all') return true;
  const start = getPeriodStartDate(period);
  if (!start) return true;
  return new Date(dateStr) >= start;
}
