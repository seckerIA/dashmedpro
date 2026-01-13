/**
 * Edge Function: Redis Cache Proxy
 * 
 * Esta função serve como proxy para operações Redis,
 * evitando expor o token do Upstash no frontend.
 * 
 * Usa a REST API do Upstash diretamente (sem bibliotecas externas).
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CacheRequest {
    action: "get" | "set" | "del" | "invalidate";
    key?: string;
    value?: unknown;
    ttl?: number;
    pattern?: string;
}

// Função helper para chamar a REST API do Upstash
async function upstashRequest(command: string[]): Promise<any> {
    const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (!url || !token) {
        throw new Error("Upstash Redis credentials not configured");
    }

    const response = await fetch(`${url}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upstash error: ${response.status} - ${text}`);
    }

    return await response.json();
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(
            JSON.stringify({ error: 'Authorization header required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Create Supabase client to verify token
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body: CacheRequest = await req.json();
        const { action, key, value, ttl, pattern } = body;

        switch (action) {
            case "get": {
                if (!key) {
                    return new Response(
                        JSON.stringify({ error: "Key is required for GET" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                const result = await upstashRequest(["GET", key]);
                let parsedValue = result.result;

                // Tentar fazer parse de JSON se for string
                if (typeof parsedValue === "string") {
                    try {
                        parsedValue = JSON.parse(parsedValue);
                    } catch {
                        // Manter como string se não for JSON válido
                    }
                }

                return new Response(
                    JSON.stringify({ value: parsedValue }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "set": {
                if (!key) {
                    return new Response(
                        JSON.stringify({ error: "Key is required for SET" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                const exSeconds = ttl ?? 300; // Default 5 minutos
                const stringValue = JSON.stringify(value);

                await upstashRequest(["SET", key, stringValue, "EX", String(exSeconds)]);

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "del": {
                if (!key) {
                    return new Response(
                        JSON.stringify({ error: "Key is required for DEL" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                await upstashRequest(["DEL", key]);

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "invalidate": {
                if (!pattern) {
                    return new Response(
                        JSON.stringify({ error: "Pattern is required for INVALIDATE" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                // SCAN para encontrar chaves que correspondem ao padrão
                let cursor = "0";
                let deletedCount = 0;

                do {
                    const scanResult = await upstashRequest(["SCAN", cursor, "MATCH", pattern, "COUNT", "100"]);
                    cursor = scanResult.result[0];
                    const keys = scanResult.result[1] as string[];

                    if (keys.length > 0) {
                        await upstashRequest(["DEL", ...keys]);
                        deletedCount += keys.length;
                    }
                } while (cursor !== "0");

                return new Response(
                    JSON.stringify({ success: true, deletedCount }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            default:
                return new Response(
                    JSON.stringify({ error: `Unknown action: ${action}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
        }
    } catch (error: any) {
        console.error("[redis-cache] Error:", error);

        // Se Redis não está configurado, retorna gracefully
        if (error.message?.includes("not configured")) {
            return new Response(
                JSON.stringify({ value: null, warning: "Redis not configured" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ error: error.message || "Internal error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
