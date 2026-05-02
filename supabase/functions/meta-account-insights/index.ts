/**
 * Edge Function: meta-account-insights
 * Retorna métricas agregadas da conta Meta Ads para um time_range (ex.: gasto no período do dashboard).
 * GET act_XXX/insights — mesma base que o Ads Manager usa para totais por intervalo.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v22.0";

interface MetaInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
}

function extractConversions(insights: MetaInsights): { count: number; value: number } {
  const conversions = insights.actions?.find((a) =>
    ["lead", "purchase", "complete_registration"].includes(a.action_type)
  );
  const count = parseInt(conversions?.value || "0", 10);

  const convValueAction = insights.action_values?.find((av) =>
    ["purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase"].includes(
      av.action_type
    )
  );
  const value = parseFloat(convValueAction?.value || "0");

  return { count, value };
}

async function fetchAccountInsights(
  formattedAccountId: string,
  accessToken: string,
  since: string,
  until: string
): Promise<MetaInsights | null> {
  const fields = "impressions,clicks,spend,reach,actions,action_values";
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${formattedAccountId}/insights?fields=${fields}&time_range=${timeRange}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  return data.data?.[0] || null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header", success: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenPart = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenPart);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", success: false, detail: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: { connection_id?: string; since?: string; until?: string } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body", success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { connection_id, since, until } = body;

    if (!connection_id || !since || !until) {
      return new Response(
        JSON.stringify({ error: "connection_id, since e until são obrigatórios (YYYY-MM-DD)", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(since) || !dateRe.test(until)) {
      return new Response(
        JSON.stringify({ error: "Datas devem estar no formato YYYY-MM-DD", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (since > until) {
      return new Response(JSON.stringify({ error: "since não pode ser maior que until", success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connection, error: connError } = await supabase
      .from("ad_platform_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "Connection not found or access denied", success: false }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (connection.platform !== "meta_ads") {
      return new Response(JSON.stringify({ error: "Apenas conexões Meta Ads", success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (connection.account_category && connection.account_category !== "other") {
      return new Response(
        JSON.stringify({
          error: "Conta não é um Ad Account padrão",
          success: false,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountId = connection.account_id as string;
    if (
      accountId.startsWith("bm_") ||
      accountId.startsWith("waba_") ||
      accountId.startsWith("page_") ||
      accountId === "meta_oauth"
    ) {
      return new Response(JSON.stringify({ error: "Registro não é uma conta de anúncios", success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = connection.api_key as string;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token ausente", success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

    const insights = await fetchAccountInsights(formattedAccountId, accessToken, since, until);
    if (!insights) {
      return new Response(
        JSON.stringify({
          success: true,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          conversion_value: 0,
          message: "Sem dados de insights para o período",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: conversions, value: conversion_value } = extractConversions(insights);

    return new Response(
      JSON.stringify({
        success: true,
        spend: parseFloat(insights.spend || "0"),
        impressions: parseInt(insights.impressions || "0", 10),
        clicks: parseInt(insights.clicks || "0", 10),
        conversions,
        conversion_value,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const friendly =
      message.includes("OAuthException") || message.includes("token")
        ? "Token Meta expirado ou inválido. Reconecte a conta."
        : message;

    return new Response(JSON.stringify({ success: false, error: friendly }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
