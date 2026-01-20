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

type AdminRequest = CreateOrgRequest | ListOrgRequest;

const ALLOWED_ADMIN_EMAILS = [
    'gustavosantosbbs@gmail.com', // O email do usuário principal
    'admin@dashmed.com'
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

        if (!ALLOWED_ADMIN_EMAILS.includes(user.email)) {
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
            const password = adminPassword || "DashMed@2026";

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
            const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                email: adminEmail,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: adminName }
            });

            if (createAuthError) {
                // If user likely exists
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existing = users.find(u => u.email === adminEmail);
                if (existing) {
                    userId = existing.id;
                } else {
                    throw new Error(`Failed to create user and could not find existing: ${createAuthError.message}`);
                }
            } else {
                userId = newUser.user.id;
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

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
};

serve(handler);
