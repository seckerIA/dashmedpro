/**
 * Utilitários para formatação de telefones brasileiros
 */

/**
 * Formata um telefone brasileiro no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Aceita telefones com ou sem DDD
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remover tudo exceto números
  const numbersOnly = phone.replace(/\D/g, "");
  
  if (numbersOnly.length === 0) return "";
  
  // Se tiver 10 ou 11 dígitos (com DDD)
  if (numbersOnly.length === 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 6)}-${numbersOnly.slice(6)}`;
  } else if (numbersOnly.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 7)}-${numbersOnly.slice(7)}`;
  } else if (numbersOnly.length === 8) {
    // Telefone sem DDD: XXXX-XXXX
    return `${numbersOnly.slice(0, 4)}-${numbersOnly.slice(4)}`;
  } else if (numbersOnly.length === 9) {
    // Celular sem DDD: XXXXX-XXXX
    return `${numbersOnly.slice(0, 5)}-${numbersOnly.slice(5)}`;
  }
  
  // Se não se encaixar em nenhum formato, retornar apenas os números
  return numbersOnly;
};

/**
 * Formata telefone em tempo real enquanto o usuário digita
 */
export const formatPhoneInput = (value: string): string => {
  // Remover tudo exceto números
  const numbersOnly = value.replace(/\D/g, "");
  
  if (numbersOnly.length === 0) return "";
  
  // Limitar a 11 dígitos (DDD + 9 dígitos)
  const limitedNumbers = numbersOnly.slice(0, 11);
  
  // Formatar baseado no tamanho
  if (limitedNumbers.length <= 2) {
    // Apenas DDD
    return `(${limitedNumbers}`;
  } else if (limitedNumbers.length <= 7) {
    // DDD + início do número
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
  } else {
    // Celular: (XX) XXXXX-XXXX
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
};

/**
 * Remove formatação do telefone, retornando apenas números
 */
export const parsePhoneToNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

