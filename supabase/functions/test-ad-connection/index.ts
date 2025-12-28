import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

async function testMetaAdsConnection(apiKey: string, accountId: string) {
  try {
    // TODO: Implementar teste real de conexão com Meta Ads API
    // Por enquanto, validação básica
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        error: 'Access Token inválido'
      };
    }

    if (!accountId || !/^act_\d+$/.test(accountId)) {
      return {
        success: false,
        error: 'Account ID inválido. Deve começar com "act_" seguido de números.'
      };
    }

    // Mock: retorna sucesso se validações passarem
    return {
      success: true,
      message: 'Conexão testada com sucesso (mock). Implemente integração real com Meta Ads API.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

serve(handler);


