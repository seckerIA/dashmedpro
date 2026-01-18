import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
