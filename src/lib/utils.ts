import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

/** Compara o dia civil local do timestamp ISO com o dia do calendário (evita desencontro perto da meia-noite UTC). */
export function isLocalCalendarDayEqual(isoTimestamp: string, calendarDay: Date): boolean {
  try {
    const instant = parseISO(isoTimestamp);
    if (Number.isNaN(instant.getTime())) return false;
    return format(instant, "yyyy-MM-dd") === format(calendarDay, "yyyy-MM-dd");
  } catch {
    return false;
  }
}

export function formatPhone(value: string) {
  // Remove tudo que não é dígito
  const v = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  const limited = v.slice(0, 11);

  // Formatação (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  return limited
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(limited.length === 11 ? /(\d{5})(\d)/ : /(\d{4})(\d)/, "$1-$2");
}
