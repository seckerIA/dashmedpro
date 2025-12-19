/**
 * Sistema de Validação do Projeto Supabase
 * Garante que todas as requisições vão para o projeto correto
 */

import { supabase, CURRENT_PROJECT_REF, SUPABASE_URL } from './client';

export const EXPECTED_PROJECT_REF = 'adzaqkduxnpckbcuqpmg';
export const EXPECTED_SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';

/**
 * Valida se o cliente Supabase está configurado para o projeto correto
 */
export function validateSupabaseProject(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar URL
  if (SUPABASE_URL !== EXPECTED_SUPABASE_URL) {
    errors.push(
      `URL do Supabase incorreta! Esperado: ${EXPECTED_SUPABASE_URL}, Atual: ${SUPABASE_URL}`
    );
  }

  // Verificar Project Ref
  if (CURRENT_PROJECT_REF !== EXPECTED_PROJECT_REF) {
    errors.push(
      `Project Ref incorreto! Esperado: ${EXPECTED_PROJECT_REF}, Atual: ${CURRENT_PROJECT_REF}`
    );
  }

  // Verificar se o cliente está usando a URL correta
  // Nota: supabaseUrl é protegido, então verificamos via SUPABASE_URL exportado
  // A validação já foi feita no client.ts com throw Error

  // Verificar localStorage para sessões de outros projetos
  if (typeof window !== 'undefined') {
    const allKeys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i)
    ).filter(Boolean) as string[];

    const otherProjectKeys = allKeys.filter(
      (key) =>
        (key.startsWith('sb-') || key.includes('supabase')) &&
        !key.includes(EXPECTED_PROJECT_REF)
    );

    if (otherProjectKeys.length > 0) {
      warnings.push(
        `Encontradas ${otherProjectKeys.length} chaves de outros projetos no localStorage: ${otherProjectKeys.join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida uma sessão do Supabase para garantir que é do projeto correto
 */
export async function validateSession(): Promise<{
  isValid: boolean;
  isFromCorrectProject: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      errors.push(`Erro ao obter sessão: ${error.message}`);
      return {
        isValid: false,
        isFromCorrectProject: false,
        errors,
      };
    }

    if (!session) {
      return {
        isValid: true,
        isFromCorrectProject: true,
        errors: [],
      };
    }

    // Decodificar JWT para verificar o projeto
    try {
      const payload = JSON.parse(
        atob(session.access_token.split('.')[1])
      );
      const issuer = payload.iss || '';

      if (!issuer.includes(EXPECTED_PROJECT_REF)) {
        errors.push(
          `Sessão é de outro projeto! Issuer: ${issuer}, Esperado: ${EXPECTED_PROJECT_REF}`
        );
        return {
          isValid: false,
          isFromCorrectProject: false,
          errors,
        };
      }

      // Verificar se o usuário existe no banco correto
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        errors.push(
          `Usuário autenticado não existe no banco de dados atual! User ID: ${session.user.id}`
        );
        return {
          isValid: false,
          isFromCorrectProject: false,
          errors,
        };
      }

      return {
        isValid: true,
        isFromCorrectProject: true,
        errors: [],
      };
    } catch (e: any) {
      errors.push(`Erro ao decodificar JWT: ${e.message}`);
      return {
        isValid: false,
        isFromCorrectProject: false,
        errors,
      };
    }
  } catch (e: any) {
    errors.push(`Erro ao validar sessão: ${e.message}`);
    return {
      isValid: false,
      isFromCorrectProject: false,
      errors,
    };
  }
}

/**
 * Interceptor para validar todas as requisições ao Supabase
 * Deve ser chamado antes de qualquer operação crítica
 */
export async function validateBeforeOperation(
  operationName: string
): Promise<boolean> {
  const validation = validateSupabaseProject();

  if (!validation.isValid) {
    console.error(`❌ VALIDAÇÃO FALHOU para operação: ${operationName}`);
    console.error('Erros:', validation.errors);
    throw new Error(
      `Operação bloqueada: Projeto Supabase não está configurado corretamente. Erros: ${validation.errors.join(', ')}`
    );
  }

  if (validation.warnings.length > 0) {
    console.warn(`⚠️ AVISOS para operação: ${operationName}`);
    console.warn('Avisos:', validation.warnings);
  }

  // Validar sessão se houver
  const sessionValidation = await validateSession();
  if (!sessionValidation.isFromCorrectProject && sessionValidation.errors.length > 0) {
    console.error(`❌ SESSÃO INVÁLIDA para operação: ${operationName}`);
    console.error('Erros:', sessionValidation.errors);
    throw new Error(
      `Operação bloqueada: Sessão é de outro projeto. Erros: ${sessionValidation.errors.join(', ')}`
    );
  }

  return true;
}

/**
 * Hook para validar o projeto em componentes React
 */
export function useSupabaseValidation() {
  if (typeof window === 'undefined') {
    return { isValid: true, errors: [], warnings: [] };
  }

  const validation = validateSupabaseProject();

  if (!validation.isValid) {
    console.error('❌ VALIDAÇÃO DO PROJETO FALHOU:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ AVISOS DE VALIDAÇÃO:', validation.warnings);
  }

  return validation;
}

