import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, expires",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

/**
 * Reseta senha de uma ou várias secretárias de uma vez.
 *
 * Body:
 *   {
 *     userIds?: string[];       // se omitido, reseta TODAS as secretárias da organização do caller
 *     newPassword?: string;     // se omitido, gera senha aleatória individual
 *   }
 *
 * Retorna:
 *   {
 *     success: true,
 *     credentials: [
 *       { user_id, full_name, email, password }
 *     ]
 *   }
 */

const generatePassword = (length = 10) => {
  // Senha amigável: 4 letras minúsculas + 2 dígitos + 4 letras minúsculas, sem caracteres ambíguos
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    const pool = i % 3 === 2 ? digits : letters;
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }
  return pwd;
};

const bearerJwt = (req: Request): string | null => {
  const h = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!h?.trim()) return null;
  const m = /^Bearer\s+(\S+)/i.exec(h.trim());
  return m?.[1] ?? null;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const jwt = bearerJwt(req);
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      },
    );

    // 1) Identificar caller e checar permissão
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: authError?.message || "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = authData.user.id;
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", callerId)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Caller profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedRoles = ["admin", "dono", "medico"];
    if (!allowedRoles.includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId: string | null = callerProfile.organization_id;
    const isMedicoOnly = callerProfile.role === "medico";

    // 2) Resolver alvo
    const body = await req.json().catch(() => ({}));
    const requestedIds: string[] | undefined = Array.isArray(body?.userIds) ? body.userIds : undefined;
    const requestedPassword: string | undefined = typeof body?.newPassword === "string" && body.newPassword.length >= 6
      ? body.newPassword
      : undefined;

    // Se médico, escopa pelas secretárias vinculadas a ele
    let allowedSecretaryIds: string[] = [];
    if (isMedicoOnly) {
      const { data: links } = await supabaseAdmin
        .from("secretary_doctor_links")
        .select("secretary_id")
        .eq("doctor_id", callerId);
      allowedSecretaryIds = (links || []).map((l: { secretary_id: string }) => l.secretary_id);
    }

    // 3) Buscar secretárias
    let secQuery = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "secretaria")
      .eq("is_active", true);

    if (orgId) secQuery = secQuery.eq("organization_id", orgId);
    if (requestedIds && requestedIds.length > 0) secQuery = secQuery.in("id", requestedIds);
    if (isMedicoOnly) {
      if (allowedSecretaryIds.length === 0) {
        return new Response(JSON.stringify({ success: true, credentials: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      secQuery = secQuery.in("id", allowedSecretaryIds);
    }

    const { data: secretaries, error: secError } = await secQuery;
    if (secError) {
      return new Response(JSON.stringify({ error: secError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!secretaries || secretaries.length === 0) {
      return new Response(JSON.stringify({ success: true, credentials: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Resetar senhas
    const credentials: Array<{ user_id: string; full_name: string | null; email: string; password: string }> = [];

    for (const sec of secretaries) {
      const newPwd = requestedPassword ?? generatePassword(10);
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(sec.id, {
        password: newPwd,
      });
      if (updateErr) {
        console.error(`Falha ao resetar senha de ${sec.email}:`, updateErr);
        continue;
      }

      // Marcar para troca de senha no próximo login (se a coluna existir)
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ force_password_change: true })
          .eq("id", sec.id);
      } catch (_) {
        // coluna pode não existir em todas as instalações
      }

      credentials.push({
        user_id: sec.id,
        full_name: sec.full_name,
        email: sec.email,
        password: newPwd,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        credentials,
        total: credentials.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
