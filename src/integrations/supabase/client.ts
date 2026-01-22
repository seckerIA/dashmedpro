
export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Storage key para a sessão
const AUTH_STORAGE_KEY = `sb-${CURRENT_PROJECT_REF}-auth-token`;

// ============================================================================
// LIMPEZA DE SESSÃO CORROMPIDA (EXECUTAR ANTES DE TUDO)
// ============================================================================

function clearCorruptedSession() {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);

    // Verificar se a sessão está corrompida
    const isCorrupted =
      !parsed?.access_token ||
      !parsed?.refresh_token ||
      (parsed?.expires_at && parsed.expires_at * 1000 < Date.now() - 7 * 24 * 60 * 60 * 1000); // Expirou há mais de 7 dias

    if (isCorrupted) {
      console.log('🧹 [Supabase] Limpando sessão corrompida');
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.log('🧹 [Supabase] Removendo sessão malformada');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// Executar limpeza ANTES de criar cliente
clearCorruptedSession();

// ============================================================================
// FETCH COM TIMEOUT
// ============================================================================

const FETCH_TIMEOUT_MS = 40000;

const fetchWithTimeout: typeof fetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout de ${FETCH_TIMEOUT_MS}ms excedido`);
    }
    throw error;
  }
};

// ============================================================================
// SINGLETON DO CLIENTE
// ============================================================================

// Use a global variable to prevent multiple client instances during hot reloads
const SUPABASE_CLIENT_KEY = '__SUPABASE_CLIENT__';

let supabase: ReturnType<typeof createClient<Database>>;

if (typeof window !== 'undefined' && (window as any)[SUPABASE_CLIENT_KEY]) {
  console.log('♻️ [Supabase] Reusing existing client');
  supabase = (window as any)[SUPABASE_CLIENT_KEY];
} else {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: AUTH_STORAGE_KEY,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Connection': 'close', // FORCE FRESH CONNECTION
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      fetch: fetchWithTimeout,
    },
  });

  if (typeof window !== 'undefined') {
    (window as any)[SUPABASE_CLIENT_KEY] = supabase;

    // ============================================================================
    // LISTENER DE AUTH STATE COM AUTO-RECOVERY
    // ============================================================================

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 [Supabase] Auth event: ${event}`);

      // Se o refresh automático falhou
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('⚠️ [Supabase] Refresh falhou - limpando sessão');
        localStorage.removeItem(AUTH_STORAGE_KEY);

        if (window.location.pathname !== '/login' && window.location.pathname !== '/reset-password') {
          window.location.href = '/login';
        }
      }

      // Garantir limpeza no logout
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });
  }
}

export { supabase };

// ============================================================================
// CHECK TOKEN MELHORADO
// ============================================================================

let lastSuccessfulCheck = Date.now();
let isCheckingToken = false;

export async function checkToken(): Promise<boolean> {
  // Evitar checks simultâneos
  if (isCheckingToken) {
    return true;
  }

  isCheckingToken = true;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('❌ [checkToken] Erro:', error.message);

      // Se for erro de refresh token, limpar e redirecionar
      if (error.message.includes('Refresh Token') || error.message.includes('invalid')) {
        localStorage.removeItem(AUTH_STORAGE_KEY);

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return false;
      }

      return false;
    }

    if (!session) {
      console.log('⚠️ [checkToken] Sem sessão');
      return false;
    }

    // Verificar se precisa refresh
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresIn = expiresAt * 1000 - Date.now();

      // Refresh se expira em menos de 5 minutos
      if (expiresIn < 5 * 60 * 1000) {
        console.log('🔄 [checkToken] Renovando token...');

        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.log('❌ [checkToken] Erro no refresh:', refreshError.message);

          // Limpar se refresh token inválido
          if (refreshError.message.includes('Refresh Token') || refreshError.message.includes('invalid')) {
            localStorage.removeItem(AUTH_STORAGE_KEY);

            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return false;
          }

          return false;
        }

        console.log('✅ [checkToken] Token renovado');
      }
    }

    lastSuccessfulCheck = Date.now();
    return true;

  } catch (e: any) {
    console.log('❌ [checkToken] Exceção:', e?.message);
    return false;
  } finally {
    isCheckingToken = false;
  }
}

/**
 * Verifica se foi autenticado recentemente (para evitar checks desnecessários)
 */
export function wasRecentlyAuthenticated(): boolean {
  return Date.now() - lastSuccessfulCheck < 60000; // 1 minuto
}

/**
 * Remove todos os canais de realtime ativos
 * Essencial para evitar vazamento de listeners ao desmontar componentes
 */
export async function cleanupAllChannels() {
  const channels = supabase.getChannels();
  if (channels.length > 0) {
    console.log(`🧹 [Supabase] Limpando ${channels.length} canais ativos...`);
    await Promise.all(channels.map(channel => channel.unsubscribe()));
  }
}
