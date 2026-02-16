import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v22.0";

interface TestRequest {
  platform: 'google_ads' | 'meta_ads';
  api_key: string;
  account_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, api_key, account_id }: TestRequest = await req.json();

    if (!platform || !api_key || !account_id) {
      return new Response(
        JSON.stringify({ error: 'platform, api_key, and account_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    // Testar conexão baseado na plataforma
    if (platform === 'google_ads') {
      result = await testGoogleAdsConnection(api_key, account_id);
    } else if (platform === 'meta_ads') {
      result = await testMetaAdsConnection(api_key, account_id);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in test-ad-connection function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function testGoogleAdsConnection(apiKey: string, accountId: string) {
  try {
    // TODO: Implementar teste real de conexão com Google Ads API
    // Por enquanto, validação básica
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        error: 'API Key inválida'
      };
    }

    if (!accountId || !/^\d{10}$/.test(accountId)) {
      return {
        success: false,
        error: 'Account ID inválido. Deve ser um número de 10 dígitos.'
      };
    }

    // Mock: retorna sucesso se validações passarem
    return {
      success: true,
      message: 'Conexão testada com sucesso (mock). Implemente integração real com Google Ads API.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testMetaAdsConnection(accessToken: string, accountId: string) {
  try {
    if (!accessToken || accessToken.trim().length === 0) {
      return { success: false, error: 'Access Token inválido' };
    }

    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // 1. Validar token via /me
    console.log('[test-ad-connection] Validating token via /me...');
    const meResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id,name&access_token=${accessToken}`
    );

    if (!meResponse.ok) {
      const errorData = await meResponse.json();
      const errorMsg = errorData.error?.message || 'Token inválido ou expirado';
      console.error('[test-ad-connection] /me failed:', errorData);
      if (errorData.error?.code === 190) {
        return { success: false, error: 'Token expirado. Reconecte sua conta Meta.' };
      }
      return { success: false, error: errorMsg };
    }

    const meData = await meResponse.json();
    console.log('[test-ad-connection] Token valid for user:', meData.name);

    // 2. Verificar acesso à conta de anúncios
    console.log(`[test-ad-connection] Checking access to ${formattedAccountId}...`);
    const accountResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${formattedAccountId}?fields=id,name,account_status,currency,balance&access_token=${accessToken}`
    );

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      console.error('[test-ad-connection] Account check failed:', errorData);
      return {
        success: false,
        error: `Sem acesso à conta ${formattedAccountId}: ${errorData.error?.message || 'Permissão negada'}`
      };
    }

    const accountData = await accountResponse.json();

    const statusMap: Record<number, string> = {
      1: 'Ativa',
      2: 'Desativada',
      3: 'Não configurada',
      7: 'Pendente de revisão',
      8: 'Em revisão',
      9: 'Em período de carência',
      100: 'Suspensa',
      101: 'Encerrada',
    };

    return {
      success: true,
      message: 'Conexão validada com sucesso!',
      details: {
        user_name: meData.name,
        account_name: accountData.name,
        account_id: accountData.id,
        account_status: statusMap[accountData.account_status] || `Status ${accountData.account_status}`,
        currency: accountData.currency,
        balance: accountData.balance,
      }
    };
  } catch (error: any) {
    console.error('[test-ad-connection] Error:', error);
    return { success: false, error: error.message };
  }
}

serve(handler);
