import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CreateOrgRequest {
    action: 'create';
    name: string;
    slug: string;
    adminEmail: string;
    adminName: string;
    adminPassword?: string;
}

interface ListOrgRequest {
    action: 'list';
}

interface UpdatePortalSettingsRequest {
    action: 'update_portal_settings';
    organizationId: string;
    portal_settings: Record<string, unknown>;
}

interface ListUsersRequest {
    action: 'list_users';
}

interface GetMetricsRequest {
    action: 'get_metrics';
}

type AdminRequest = CreateOrgRequest | ListOrgRequest | UpdatePortalSettingsRequest | ListUsersRequest | GetMetricsRequest;

const ALLOWED_ADMIN_EMAILS = [
    'gustavosantosbbs@gmail.com', // O email do usuário principal
    'admin@dashmed.com',
    'helloword.txt@gmail.com',
    'rafaelcarvalhomed@gmail.com', // Dr. Rafael — acesso ao painel /admin quando role permitir
];

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization')!;

        // 1. Setup Clients
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // 2. Verify Caller
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user || !user.email) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: callerProfile, error: callerProfErr } = await supabaseClient
            .from('profiles')
            .select('role, organization_id')
            .eq('id', user.id)
            .maybeSingle();

        const row = callerProfile as { role?: string; organization_id?: string | null } | null;
        /** Evita coluna is_super_admin ausente no PostgREST; plataforma = admin sem org. */
        const isSuperAdmin =
            callerProfErr == null &&
            row?.role === 'admin' &&
            (row.organization_id == null || row.organization_id === '');
        const isAllowlisted = ALLOWED_ADMIN_EMAILS.includes(user.email);

        if (!isAllowlisted && !isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden: You are not a Platform Admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. Handle Actions
        const body: AdminRequest = await req.json();

        if (body.action === 'list') {
            const { data: orgs, error } = await supabaseAdmin
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify({ organizations: orgs }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (body.action === 'create') {
            const { name, slug, adminEmail, adminName, adminPassword } = body;
            const effectivePassword =
                typeof adminPassword === "string" && adminPassword.trim().length > 0
                    ? adminPassword.trim()
                    : "DashMed@2026";

            // a) Create Org
            const { data: org, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({ name, slug, status: 'active', plan: 'pro' })
                .select()
                .single();

            if (orgError) throw new Error(`Failed to create org: ${orgError.message}`);

            // b) Create/Get User
            // Try to list users to find existing
            // NOTE: listUsers is slow/expensive, but optimize later.
            // Better: Try createUser, if fail, try to fetch/update.
            let userId: string;

            // This is a simplified "get or create" logic tailored for admin flow
            // Ideally we check if user exists first to avoid error spam
            const adminEmailNormalized = adminEmail.trim().toLowerCase();

            const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                email: adminEmail,
                password: effectivePassword,
                email_confirm: true,
                user_metadata: { full_name: adminName }
            });

            if (createAuthError) {
                // Conta já existente: igual ao fluxo novo — aplicar mesma senha inicial (evita mismatch com o toast do Super Admin).
                const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
                if (listUsersError) {
                    throw new Error(`Could not list users after create failure: ${listUsersError.message}`);
                }
                const existing = users.find((u) => (u.email ?? "").toLowerCase() === adminEmailNormalized);
                if (existing) {
                    userId = existing.id;
                    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                        password: effectivePassword,
                        email_confirm: true,
                        user_metadata: { ...(existing.user_metadata ?? {}), full_name: adminName },
                    });
                    if (updErr) {
                        throw new Error(
                            `Conta já existia (${adminEmail}); não foi possível atualizar senha/perfil para o onboarding: ${updErr.message}`,
                        );
                    }
                } else {
                    throw new Error(`Failed to create user and could not find existing: ${createAuthError.message}`);
                }
            } else {
                userId = newUser!.user!.id;
            }

            // c) Add to Org Membership
            const { error: memberError } = await supabaseAdmin
                .from('organization_members')
                .upsert({
                    organization_id: org.id,
                    user_id: userId,
                    role: 'dono'
                }, { onConflict: 'organization_id,user_id' });

            if (memberError) throw new Error(`Failed to add member: ${memberError.message}`);

            // d) Update Profile Context
            await supabaseAdmin.from('profiles').update({ organization_id: org.id, role: 'dono', full_name: adminName }).eq('id', userId);

            return new Response(JSON.stringify({ success: true, organization: org, userId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (body.action === "list_users") {
            const { data: profileRows, error: profErr } = await supabaseAdmin
                .from("profiles")
                .select(`
          id,
          email,
          full_name,
          role,
          avatar_url,
          is_active,
          created_at,
          organization_id,
          organizations (
            id,
            name,
            slug
          )
        `)
                .order("created_at", { ascending: false });

            if (profErr) throw profErr;

            const users = (profileRows ?? []).map((row: Record<string, unknown>) => {
                const r = row as Record<string, unknown>;
                const isSa =
                    r.role === 'admin' && (r.organization_id == null || r.organization_id === '');
                const orgRaw = row["organizations"];
                const org = Array.isArray(orgRaw)
                    ? (orgRaw[0] ?? null)
                    : (orgRaw ?? null);
                const { organizations: _omit, ...rest } = row;
                return { ...rest, is_super_admin: isSa, organizations: org };
            });

            return new Response(JSON.stringify({ users }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (body.action === "get_metrics") {
            const { count: totalOrgs } = await supabaseAdmin
                .from("organizations")
                .select("*", { count: "exact", head: true });

            const { count: activeOrgs } = await supabaseAdmin
                .from("organizations")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            const { count: totalUsers } = await supabaseAdmin
                .from("profiles")
                .select("*", { count: "exact", head: true });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { count: activeUsers } = await supabaseAdmin
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("updated_at", sevenDaysAgo.toISOString());

            const { count: totalContacts } = await supabaseAdmin
                .from("crm_contacts")
                .select("*", { count: "exact", head: true });

            const { count: totalAppointments } = await supabaseAdmin
                .from("medical_appointments")
                .select("*", { count: "exact", head: true });

            const ao = activeOrgs ?? 0;
            const metrics = {
                totalOrgs: totalOrgs ?? 0,
                activeOrgs: ao,
                totalUsers: totalUsers ?? 0,
                activeUsers: activeUsers ?? 0,
                totalContacts: totalContacts ?? 0,
                totalAppointments: totalAppointments ?? 0,
                mrr: ao * 297,
            };

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const { data: orgRows } = await supabaseAdmin
                .from("organizations")
                .select("created_at")
                .gte("created_at", sixMonthsAgo.toISOString());

            const monthKeys = [
                "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez",
            ];
            const buckets = new Map<string, number>();
            for (const r of orgRows ?? []) {
                const raw = (r as { created_at?: string }).created_at;
                const d = raw ? new Date(raw) : new Date(Number.NaN);
                if (Number.isNaN(d.getTime())) continue;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                buckets.set(key, (buckets.get(key) ?? 0) + 1);
            }
            const sortedKeys = [...buckets.keys()].sort();
            let cum = 0;
            const growthData = sortedKeys.map((key) => {
                const parts = key.split("-");
                const m = parseInt(parts[1] ?? "1", 10);
                const monthIdx = Math.min(11, Math.max(0, m - 1));
                cum += buckets.get(key) ?? 0;
                return { name: monthKeys[monthIdx] ?? key, clinics: cum };
            });

            return new Response(JSON.stringify({ metrics, growthData }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (body.action === 'update_portal_settings') {
            const { organizationId, portal_settings } = body;
            if (!organizationId || typeof portal_settings !== 'object' || portal_settings === null) {
                return new Response(JSON.stringify({ error: 'organizationId and portal_settings object required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const { data: existing, error: fetchErr } = await supabaseAdmin
                .from('organizations')
                .select('portal_settings')
                .eq('id', organizationId)
                .maybeSingle();

            if (fetchErr) throw new Error(fetchErr.message);

            const prev = (existing?.portal_settings ?? {}) as Record<string, unknown>;
            const incoming = portal_settings as Record<string, unknown>;
            const prevBranding =
                typeof prev["branding"] === 'object' && prev["branding"] !== null
                    ? { ...(prev["branding"] as Record<string, unknown>) }
                    : {};
            const incBranding =
                typeof incoming["branding"] === 'object' && incoming["branding"] !== null
                    ? incoming["branding"] as Record<string, unknown>
                    : null;

            const prevFeatures =
                typeof prev["features"] === 'object' && prev["features"] !== null
                    ? { ...(prev["features"] as Record<string, unknown>) }
                    : {};
            const incFeatures =
                typeof incoming["features"] === 'object' && incoming["features"] !== null
                    ? incoming["features"] as Record<string, unknown>
                    : null;

            const merged: Record<string, unknown> = {
                ...prev,
                ...(incBranding ? { branding: { ...prevBranding, ...incBranding } } : {}),
                ...(incFeatures ? { features: { ...prevFeatures, ...incFeatures } } : {}),
            };

            const { error: updError } = await supabaseAdmin
                .from('organizations')
                .update({ portal_settings: merged })
                .eq('id', organizationId);

            if (updError) throw new Error(updError.message);

            await supabaseAdmin.from('admin_logs').insert({
                action: 'portal_settings_updated',
                target_type: 'organization',
                target_id: organizationId,
                performed_by: user.id,
                details: { email: user.email },
            });

            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
};

serve(handler);
