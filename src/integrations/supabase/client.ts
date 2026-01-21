export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Custom fetch with real HTTP timeout to prevent browser connection exhaustion
const FETCH_TIMEOUT_MS = 40000; // 40 seconds

const fetchWithTimeout: typeof fetch = async (url, options = {}) => {
  const requestId = Math.random().toString(36).substring(7);
  const urlStr = typeof url === 'string' ? url : 'request';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    // console.warn(`⏳ [Fetch:${requestId}] Timeout de ${FETCH_TIMEOUT_MS}ms`);
    controller.abort();
  }, FETCH_TIMEOUT_MS);

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

const SUPABASE_CLIENT_KEY = '__SUPABASE_CLIENT__';

let supabase: ReturnType<typeof createClient<Database>>;

if (typeof window !== 'undefined' && (window as any)[SUPABASE_CLIENT_KEY]) {
  console.log('♻️ [Supabase] Reusing existing client instance');
  supabase = (window as any)[SUPABASE_CLIENT_KEY];
} else {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: `sb-${CURRENT_PROJECT_REF}-auth-token`,
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
  }
}

export { supabase };

let lastSuccessfulCheck = Date.now();

/**
 * Check token validity and refresh if needed.
 * Returns true if session is valid, false if needs re-login.
 */
export const checkToken = async (): Promise<boolean> => {
  try {
    // Race between getSession and timeout
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getSession timeout after 5s')), 5000)
      ),
    ]);

    const { data: { session } } = sessionResult;

    if (!session) {
      console.log('⚠️ [Auth] Sem sessão. Redirecionando para login...');
      forceLoginRedirect();
      return false;
    }

    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // Token has been expired for MORE than 5 minutes
    if (timeUntilExpiry < -300) {
      console.log(`🚨 [Auth] Token expirado há ${Math.abs(timeUntilExpiry)}s. Tentando recuperar...`);

      const refreshResult = await Promise.race([
        refreshSessionSafe(),
        timeoutPromise(15000, 'Refresh timeout'),
      ]);

      if (refreshResult && refreshResult !== 'timeout') {
        lastSuccessfulCheck = Date.now();
        return true;
      }

      console.warn('❌ [Auth] Falha na recuperação. Redirect login.');
      forceLoginRedirect();
      return false;
    }

    // CRITICAL UPDATE: Renew 5 minutes BEFORE expiry
    if (timeUntilExpiry < 300) {
      console.log(`⏰ [Auth] Token expirando em ${timeUntilExpiry}s. Renovando...`);

      const refreshResult = await Promise.race([
        refreshSessionSafe(),
        timeoutPromise(10000, 'Refresh timeout'),
      ]);

      if (refreshResult === 'timeout') {
        console.warn('⚠️ [Auth] Refresh demorou (fail-soft)...');
        return true;
      }

      if (!refreshResult) {
        console.log('❌ [Auth] Refresh falhou. Redirecionando...');
        // O redirecionamento real acontece dentro de refreshSessionSafe se for erro 400
        // Aqui é fallback
        if (!window.location.href.includes('/login')) {
          forceLoginRedirect();
        }
        return false;
      }

      console.log('✅ [Auth] Token renovado.');
    }

    lastSuccessfulCheck = Date.now();
    return true;

  } catch (e) {
    console.warn('⚠️ [Auth] Check error:', e);
    return true; // Fail-soft
  }
};

const refreshSessionSafe = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ [Auth] Erro no refresh:', error.message);

      // CRITICAL CHROME FIX: Handle Invalid Refresh Token aggressively
      // This happens when Chrome sends a stale token after idle
      if (error.message.includes('Refresh Token') ||
        error.message.includes('refresh_token') ||
        error.message.includes('Invalid') ||
        error.message.includes('not found') ||
        (error as any).status === 400) {

        console.error('🔥 [Auth] Token revogado/inválido. Limpando sessão e redirecionando...');
        localStorage.removeItem(`sb-${CURRENT_PROJECT_REF}-auth-token`);
        window.location.href = '/login?reason=session_expired';
        return false;
      }
      return false;
    }

    return !!data.session;
  } catch (e) {
    console.error('❌ [Auth] Exceção refresh:', e);
    return false;
  }
};

const timeoutPromise = (ms: number, message: string): Promise<'timeout'> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve('timeout'), ms);
  });
};

export const cleanupAllChannels = async (): Promise<void> => {
  try {
    const channels = supabase.getChannels();
    if (channels.length > 0) {
      await Promise.race([
        supabase.removeAllChannels(),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
      console.log('✅ [Auth] Canais realtime limpos.');
    }
  } catch (e) {
    console.error('⚠️ [Auth] Erro ao limpar canais:', e);
  }
};

const forceLoginRedirect = async () => {
  if (typeof window !== 'undefined') {
    await cleanupAllChannels();
    localStorage.removeItem(`sb-${CURRENT_PROJECT_REF}-auth-token`);
    window.location.href = '/login';
  }
};

export const wasRecentlyAuthenticated = (): boolean => {
  return (Date.now() - lastSuccessfulCheck) < 60000;
};
