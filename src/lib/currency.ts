/**
 * Utilitários para formatação e parsing de valores monetários
 */

/**
 * Formata um número como moeda brasileira
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "";
  if (value === 0) return "R$ 0,00";
  
  // Converter string para número, removendo caracteres não numéricos se necessário
  let numericValue: number;
  if (typeof value === 'string') {
    // Remover espaços e caracteres especiais, manter apenas números, vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    numericValue = parseFloat(cleanValue);
  } else {
    numericValue = value;
  }
  
  if (isNaN(numericValue) || numericValue === 0) return "R$ 0,00";
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

/**
 * Formata valor em tempo real enquanto o usuário digita
 */
export const formatCurrencyInput = (value: string): string => {
  // Remover tudo exceto números
  const numbersOnly = value.replace(/[^\d]/g, "");
  
  if (numbersOnly === "") return "";
  
  // Converter para número (centavos)
  const numericValue = parseInt(numbersOnly, 10);
  
  // Dividir por 100 para obter o valor em reais
  const realValue = numericValue / 100;
  
  // Formatar como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(realValue);
};

/**
 * Converte string formatada de moeda para número
 */
export const parseCurrencyToNumber = (value: string | null | undefined): number | null => {
  if (!value) return null;
  
  // 1. Manter apenas números e a vírgula do decimal
  const cleanValue = value.replace(/[^\d,]/g, "");

  if (cleanValue === "") return null;
  
  // 2. Substituir vírgula por ponto para parsing
  const normalizedValue = cleanValue.replace(",", ".");
  
  const numericValue = parseFloat(normalizedValue);
  
  return isNaN(numericValue) ? null : numericValue;
};

/**
 * Valida se uma string representa um valor monetário válido
 */
export const isValidCurrency = (value: string): boolean => {
  if (!value) return true; // Valores vazios são válidos (opcionais)
  
  const parsed = parseCurrencyToNumber(value);
  return parsed !== null && parsed >= 0;
};

/**
 * Formata valor inicial para exibição em formulários
 */
export const formatInitialCurrencyValue = (value: number | string | null | undefined): string => {
  if (!value && value !== 0) return "";
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "";
  
  return formatCurrency(numericValue);
};
