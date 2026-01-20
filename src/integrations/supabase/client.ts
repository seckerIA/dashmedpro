export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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
    const { data: { session } } = await supabase.auth.getSession();

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
    console.error('❌ [Auth] Erro no check de token:', e);
    // On any error, force reload to get clean state
    forcePageReload();
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
 * Force page reload - this clears all hanging queries and React state
 */
const forcePageReload = () => {
  if (typeof window !== 'undefined') {
    console.log('🔄 [Auth] Recarregando página...');
    window.location.reload();
  }
};

/**
 * Redirect to login page
 */
const forceLoginRedirect = () => {
  if (typeof window !== 'undefined') {
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

// Auto-refresh interval (every 60 seconds while tab is active)
if (typeof window !== 'undefined') {
  // Check token every minute (only if tab is visible)
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      checkToken();
    }
  }, 60000);

  // Also check when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [Auth] Tab visível. Verificando sessão...');
      checkToken();
    }
  });
}