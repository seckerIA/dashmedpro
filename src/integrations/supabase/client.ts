// Lê do .env (permite alternar entre produção e backup)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";
export const CURRENT_PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_ID || "adzaqkduxnpckbcuqpmg";

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createTrackedController, removeController } from '@/lib/fetchRegistry';

// ============================================================================
// WORKAROUND: Web Locks API Deadlock (Issue #1594)
// ============================================================================
// Chrome extensions can interfere with the Web Locks API, causing deadlocks.
// This noOpLock bypasses Web Locks entirely, preventing extension interference.
// Trade-off: Loses cross-tab session synchronization (rarely needed in practice).
// Reference: https://github.com/supabase/supabase-js/issues/1594
const noOpLock = async (
  name: string,
  acquireTimeout: number,
  fn: () => Promise<any>
): Promise<any> => {
  return await fn();
};

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
// FETCH COM TIMEOUT E RETRY COM URL MODIFICADA (v6)
// ============================================================================

const FETCH_TIMEOUT_MS = 40000;
const FAST_TIMEOUT_MS = 2000; // Timeout curto para primeira tentativa após idle

/**
 * Executa uma tentativa de fetch com timeout
 */
async function attemptFetch(
  url: RequestInfo | URL,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const { id, controller } = createTrackedController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      throw new Error(`Request timeout (${timeout}ms)`);
    }
    throw error;
  } finally {
    removeController(id);
  }
}

/**
 * Fetch com timeout e estratégia de 2 tentativas após idle.
 *
 * Problema: Após idle longo, browser tenta reutilizar conexões TCP "mortas".
 * Solução: Se primeira tentativa falhar rápido (2s), tentar com URL modificada
 * para forçar o browser a criar nova conexão.
 *
 * Referência: https://github.com/supabase/supabase/issues/38238
 */
const fetchWithTimeout: typeof fetch = async (url, options = {}) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const isPostRecovery = typeof window !== 'undefined' &&
    (window as any).__postRecoveryMode === true;

  // Em post-recovery mode, usar estratégia de 2 tentativas
  if (isPostRecovery) {
    console.log('⚡ [Fetch] Post-recovery mode - tentando com timeout curto');

    // Primeira tentativa: timeout curto (2s)
    try {
      const result = await attemptFetch(url, options, FAST_TIMEOUT_MS);
      console.log('✅ [Fetch] Primeira tentativa OK');
      return result;
    } catch (firstError: any) {
      console.log('⚠️ [Fetch] Primeira tentativa falhou:', firstError?.message);

      // Segunda tentativa: URL modificada para forçar nova conexão TCP
      // Browser trata URL diferente como recurso diferente → pode alocar nova conexão
      const separator = urlStr.includes('?') ? '&' : '?';
      const newUrl = `${urlStr}${separator}_t=${Date.now()}`;

      console.log('🔄 [Fetch] Tentando com URL modificada para forçar nova conexão');
      return await attemptFetch(newUrl, options, FETCH_TIMEOUT_MS);
    }
  }

  // Modo normal (sem post-recovery)
  return await attemptFetch(url, options, FETCH_TIMEOUT_MS);
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
      lock: noOpLock, // Bypass Web Locks API to prevent Chrome extension deadlocks
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: AUTH_STORAGE_KEY,
      detectSessionInUrl: true, // Habilitar para OAuth (Google, etc.)
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
    // IMPORTANT: Do NOT use await inside onAuthStateChange callback!
    // This causes deadlocks in supabase-js. See: https://github.com/supabase/gotrue-js/issues/762
    // ============================================================================

    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 [Supabase] Auth event: ${event}`);

      // Atualizar lastSuccessfulCheck quando auth tiver sucesso
      // Isso permite que wasRecentlyAuthenticated() retorne true
      if (session && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        (window as any).__lastSupabaseAuthSuccess = Date.now();
      }

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
  // Se acabamos de voltar de idle longo, pular verificação de rede
  // Isso evita timeout que bloqueia queries - 401 faz logout se token inválido
  if (typeof window !== 'undefined' && (window as any).__skipNextAuthCheck) {
    (window as any).__skipNextAuthCheck = false;
    console.log('⏭️ [checkToken] Pulando verificação (retornou de idle)');

    // Verificar apenas se existe sessão no localStorage (sem rede)
    const stored = localStorage.getItem(`sb-${CURRENT_PROJECT_REF}-auth-token`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token) {
          lastSuccessfulCheck = Date.now();
          return true;
        }
      } catch {
        // Se não conseguir parsear, continuar com verificação normal
      }
    }
    // Se não há sessão no localStorage, continuar normalmente
  }

  // Evitar checks simultâneos
  if (isCheckingToken) {
    return true;
  }

  isCheckingToken = true;

  try {
    // Timeout de 8s para evitar que getSession() trave indefinidamente após idle longo
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout (8s)')), 8000)
    );

    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]) as Awaited<typeof sessionPromise>;

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

    // Se foi timeout do getSession, tentar refresh direto (conexão pode estar morta mas token válido)
    if (e?.message?.includes('timeout')) {
      console.log('🔄 [checkToken] Tentando refresh direto após timeout...');
      try {
        const refreshPromise = supabase.auth.refreshSession();
        const refreshTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('refreshSession timeout')), 10000)
        );

        const { data, error: refreshError } = await Promise.race([
          refreshPromise,
          refreshTimeout
        ]) as Awaited<typeof refreshPromise>;

        if (!refreshError && data?.session) {
          console.log('✅ [checkToken] Refresh direto bem-sucedido!');
          lastSuccessfulCheck = Date.now();
          return true;
        }

        if (refreshError?.message?.includes('Refresh Token') || refreshError?.message?.includes('invalid')) {
          console.log('🚪 [checkToken] Refresh token inválido, redirecionando...');
          localStorage.removeItem(AUTH_STORAGE_KEY);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (refreshErr: any) {
        console.log('❌ [checkToken] Refresh direto também falhou:', refreshErr?.message);
      }
    }

    return false;
  } finally {
    isCheckingToken = false;
  }
}

/**
 * Verifica se foi autenticado recentemente (para evitar checks desnecessários)
 * Considera tanto checkToken() manual quanto auto-refresh do Supabase
 */
export function wasRecentlyAuthenticated(): boolean {
  const now = Date.now();
  const supabaseAuthSuccess = (window as any).__lastSupabaseAuthSuccess || 0;

  // Considerar autenticado se checkToken() foi bem-sucedido OU se Supabase fez auto-refresh
  return (now - lastSuccessfulCheck < 60000) || (now - supabaseAuthSuccess < 60000);
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

// ============================================================================
// RESET DO CLIENTE (SOLUÇÃO PARA CONEXÕES MORTAS)
// ============================================================================

/**
 * Recria o cliente Supabase para forçar novas conexões HTTP.
 *
 * Quando extensões do Chrome congelam o thread principal, as conexões HTTP
 * ficam "zumbi" (abertas mas não respondem). Esta função:
 * 1. Remove o singleton atual
 * 2. Força reimportação do módulo (cria nova instância)
 * 3. Auth state é preservado em localStorage (seguro!)
 *
 * Use quando getSession() E refreshSession() ambos falharem por timeout.
 */
export async function resetSupabaseClient(): Promise<typeof supabase> {
  if (typeof window === 'undefined') {
    return supabase;
  }

  console.log('🔄 [Supabase] Recriando cliente para forçar novas conexões...');

  try {
    // 1. Limpar canais de realtime primeiro
    const channels = supabase.getChannels();
    if (channels.length > 0) {
      console.log(`🧹 [Supabase] Limpando ${channels.length} canais antes de recriar...`);
      await Promise.all(channels.map(channel => {
        try {
          return channel.unsubscribe();
        } catch {
          return Promise.resolve();
        }
      }));
    }

    // 2. Deletar singleton - isso força recriação na próxima importação
    delete (window as any)[SUPABASE_CLIENT_KEY];

    // 3. Aguardar um pouco para conexões antigas fecharem
    await new Promise(r => setTimeout(r, 300));

    // 4. Recriar cliente inline (não podemos reimportar o módulo de si mesmo)
    const newClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        lock: noOpLock, // Bypass Web Locks API to prevent Chrome extension deadlocks
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: AUTH_STORAGE_KEY,
        detectSessionInUrl: true, // Habilitar para OAuth (Google, etc.)
        flowType: 'pkce',
      },
      global: {
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Connection': 'close',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        fetch: fetchWithTimeout,
      },
    });

    // 5. Salvar novo singleton
    (window as any)[SUPABASE_CLIENT_KEY] = newClient;

    // 6. Atualizar a variável local exportada
    // @ts-ignore - Reassigning module-level variable
    supabase = newClient;

    // 7. Configurar listener de auth no novo cliente
    // IMPORTANT: Do NOT use await inside - causes deadlocks!
    newClient.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 [Supabase] Auth event: ${event}`);

      if (session && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        (window as any).__lastSupabaseAuthSuccess = Date.now();
      }

      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('⚠️ [Supabase] Refresh falhou - limpando sessão');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/reset-password') {
          window.location.href = '/login';
        }
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    console.log('✅ [Supabase] Cliente recriado com sucesso');
    return newClient;

  } catch (error) {
    console.error('❌ [Supabase] Erro ao recriar cliente:', error);
    return supabase;
  }
}

/**
 * Retorna o cliente Supabase atual (singleton)
 * Útil para garantir que sempre pegamos a instância mais recente após reset
 */
export function getSupabaseClient(): typeof supabase {
  if (typeof window !== 'undefined' && (window as any)[SUPABASE_CLIENT_KEY]) {
    return (window as any)[SUPABASE_CLIENT_KEY];
  }
  return supabase;
}
