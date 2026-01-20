export const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// console.log('🚀 [Supabase] Inicializando cliente...');

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

// Refresh proativo simplificado
if (typeof window !== 'undefined') {
  // console.log('✅ [Supabase] Cliente pronto.');

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