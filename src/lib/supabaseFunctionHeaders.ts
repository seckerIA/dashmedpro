import { supabase, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

/**
 * Headers exigidos pelo gateway do Supabase ao chamar Edge Functions com JWT do usuário:
 * - Authorization: Bearer <access_token>
 * - apikey: chave publicável (anon)
 */
export async function getEdgeFunctionInvokeHeaders(): Promise<Record<string, string>> {
  let { data: sessionData } = await supabase.auth.getSession();
  let accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    accessToken = refreshed.session?.access_token;
  }
  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente para continuar.');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
}
