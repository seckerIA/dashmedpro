export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

console.log('🚀 [Supabase] Inicializando cliente...');

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
    fetch: (url, options: any = {}) => {
      const urlStr = url.toString();
      console.log(`📡 [Supabase Fetch] Iniciando: ${urlStr}`);

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => {
        (timeoutController.signal as any).isTimeout = true;
        console.warn(`⏳ [Supabase Fetch] TIMEOUT de 60s em: ${urlStr}`);
        timeoutController.abort();
      }, 60000);

      const externalSignal = options.signal;
      if (externalSignal) {
        if (externalSignal.aborted) {
          console.log(`🛑 [Supabase Fetch] Já abortado externamente: ${urlStr}`);
          clearTimeout(timeoutId);
          timeoutController.abort();
        } else {
          externalSignal.addEventListener('abort', () => {
            console.log(`🛑 [Supabase Fetch] Abortado externamente via signal: ${urlStr}`);
            timeoutController.abort();
          }, { once: true });
        }
      }

      return fetch(url, {
        ...options,
        signal: timeoutController.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          console.log(`✅ [Supabase Fetch] Sucesso (${response.status}): ${urlStr}`);
          return response;
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            const isInternalTimeout = (timeoutController.signal as any).isTimeout;
            if (isInternalTimeout) {
              // Já logado
            } else {
              console.log(`ℹ️ [Supabase Fetch] Cancelado: ${urlStr}`);
            }
          } else {
            console.error(`❌ [Supabase Fetch] ERRO em ${urlStr}:`, error);
          }
          throw error;
        });
    },
  },
});

// Refresh proativo simplificado
if (typeof window !== 'undefined') {
  console.log('✅ [Supabase] Cliente pronto.');

  const checkToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);

      if (expiresAt > 0 && (expiresAt - now) < 300) { // 5 min
        console.log('⏰ [Auth] Token perto de expirar, forçando refresh...');
        await supabase.auth.refreshSession();
      }
    } catch (e) {
      console.error('❌ [Auth] Erro no check de token:', e);
    }
  };

  setInterval(checkToken, 60000);
  window.addEventListener('focus', checkToken);
}