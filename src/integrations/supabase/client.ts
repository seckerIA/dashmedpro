export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Custom fetch with real HTTP timeout to prevent browser connection exhaustion
const FETCH_TIMEOUT_MS = 40000; // 40 seconds

const fetchWithTimeout: typeof fetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`⏳ [Fetch] Timeout de ${FETCH_TIMEOUT_MS}ms em: ${typeof url === 'string' ? url.split('?')[0] : 'request'}`);
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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
    },
    fetch: fetchWithTimeout, // Use custom fetch with timeout
  },
});

// Simple state tracking
let lastSuccessfulCheck = Date.now();

/**
 * Check token validity and refresh if needed.
 * Returns true if session is valid, false if needs re-login.
 * 
 * CRITICAL: This function has a built-in timeout and will force reload
 * if the refresh takes too long or if the token has been expired for a while.
 */
export const checkToken = async (): Promise<boolean> => {
  try {
    // Race between getSession and timeout to prevent hanging after idle
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getSession timeout after 15s')), 15000)
      ),
    ]);

    const { data: { session } } = sessionResult;

    // No session = not logged in, redirect to login
    if (!session) {
      console.log('⚠️ [Auth] Sem sessão. Redirecionando para login...');
      forceLoginRedirect();
      return false;
    }

    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // Token has been expired for MORE than 5 minutes - FORCE RELOAD
    // This is a long idle scenario that requires full re-authentication
    if (timeUntilExpiry < -300) {
      console.log(`🚨 [Auth] Token expirado há ${Math.abs(timeUntilExpiry)}s (>5min). Forçando reload...`);
      forcePageReload();
      return false;
    }

    // Token is expired or about to expire - try to refresh with timeout
    if (timeUntilExpiry < 60) {
      console.log(`⏰ [Auth] Token ${timeUntilExpiry < 0 ? 'expirado' : 'expirando'}. Tentando refresh...`);

      // Race between refresh and timeout
      const refreshResult = await Promise.race([
        refreshSessionSafe(),
        timeoutPromise(10000, 'Refresh timeout'),
      ]);

      if (refreshResult === 'timeout') {
        console.log('❌ [Auth] Refresh demorou muito. Forçando reload...');
        forcePageReload();
        return false;
      }

      if (!refreshResult) {
        console.log('❌ [Auth] Refresh falhou. Redirecionando para login...');
        forceLoginRedirect();
        return false;
      }

      console.log('✅ [Auth] Token atualizado com sucesso.');
    }

    // Token is valid
    lastSuccessfulCheck = Date.now();
    return true;

  } catch (e) {
    // Timeout ou erro de rede não significa que precisa relogar
    // Apenas significa conexão lenta - retorna false silenciosamente
    console.warn('⚠️ [Auth] Erro no check de token (provavelmente rede lenta):', e);
    return false;
  }
};

/**
 * Safe session refresh that won't hang
 */
const refreshSessionSafe = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ [Auth] Erro no refresh:', error.message);

      // If refresh token is invalid, clear and redirect
      if (error.message.includes('Refresh Token') ||
        error.message.includes('refresh_token') ||
        error.message.includes('Invalid')) {
        localStorage.removeItem(`sb-${CURRENT_PROJECT_REF}-auth-token`);
        return false;
      }
      return false;
    }

    return !!data.session;
  } catch (e) {
    console.error('❌ [Auth] Exceção no refresh:', e);
    return false;
  }
};

/**
 * Create a promise that rejects after timeout
 */
const timeoutPromise = (ms: number, message: string): Promise<'timeout'> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve('timeout'), ms);
  });
};

/**
 * Cleanup all Supabase realtime channels
 * CRITICAL: Must be called before reload/redirect to prevent hanging connections
 */
export const cleanupAllChannels = async (): Promise<void> => {
  try {
    const channels = supabase.getChannels();
    console.log(`🧹 [Auth] Limpando ${channels.length} canais realtime...`);

    // Remove all channels in parallel with timeout
    await Promise.race([
      supabase.removeAllChannels(),
      new Promise(resolve => setTimeout(resolve, 2000)), // Max 2s para cleanup
    ]);

    console.log('✅ [Auth] Canais realtime limpos.');
  } catch (e) {
    console.error('⚠️ [Auth] Erro ao limpar canais:', e);
    // Continue even if cleanup fails
  }
};

/**
 * Force page reload - this clears all hanging queries and React state
 */
const forcePageReload = async () => {
  if (typeof window !== 'undefined') {
    console.log('🔄 [Auth] Preparando reload...');
    await cleanupAllChannels();
    window.location.reload();
  }
};

/**
 * Redirect to login page
 */
const forceLoginRedirect = async () => {
  if (typeof window !== 'undefined') {
    console.log('🔒 [Auth] Preparando redirect para login...');
    await cleanupAllChannels();
    localStorage.removeItem(`sb-${CURRENT_PROJECT_REF}-auth-token`);
    window.location.href = '/login';
  }
};

/**
 * Check if we've been successfully authenticated recently
 */
export const wasRecentlyAuthenticated = (): boolean => {
  return (Date.now() - lastSuccessfulCheck) < 60000; // Within last minute
};

// NOTA: O auto-refresh de token é gerenciado pelo FocusManager em App.tsx
// Não duplicar aqui para evitar comportamento inesperado
