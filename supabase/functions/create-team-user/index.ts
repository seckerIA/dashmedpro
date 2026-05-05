import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, expires",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role: 'admin' | 'dono' | 'vendedor' | 'gestor_trafego' | 'secretaria' | 'medico';
  doctor_ids?: string[];
  consultation_value?: number;
}

const calculateBillableCount = (roles: string[], newRole?: string) => {
  const allRoles = newRole ? [...roles, newRole] : roles;
  const adminCount = allRoles.filter((r) => r === "admin").length;
  const secretaryCount = allRoles.filter((r) => r === "secretaria").length;
  const otherCount = allRoles.filter((r) => r !== "admin" && r !== "secretaria").length;

  const billableAdmins = Math.max(adminCount - 1, 0);
  const billableSecretaries = Math.max(secretaryCount - 1, 0);
  const billableOthers = otherCount;

  return billableAdmins + billableSecretaries + billableOthers;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabase.from('profiles').select('role, organization_id').eq('id', user.id).single();
    if (!profile || !['admin', 'dono', 'medico'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: CreateUserRequest = await req.json();
    const { email, full_name, role, doctor_ids, consultation_value } = body;
    let { password } = body;

    // Usar senha padrão se não for fornecida
    if (!password || password.trim() === '') {
      password = "12345678";
    }

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Regra comercial de assentos:
    // - 1 admin incluso
    // - 1 secretária inclusa
    // - membros adicionais usam assentos pagos (organizations.member_limit)
    if (profile.organization_id) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('member_limit, owner_id, additional_member_price')
        .eq('id', profile.organization_id)
        .single();

      const paidSlots = org?.member_limit ?? 0;

      let membersQuery = supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (org?.owner_id) {
        membersQuery = membersQuery.neq('id', org.owner_id);
      }

      const { data: membersData } = await membersQuery;
      const currentRoles = (membersData || []).map((m: any) => m.role as string);
      const projectedBillable = calculateBillableCount(currentRoles, role);

      if (projectedBillable > paidSlots) {
        const price = org?.additional_member_price ?? 89.90;
        return new Response(
          JSON.stringify({
            error: `Limite de assentos adicionais atingido. Este plano inclui 1 admin e 1 secretária. Membro adicional custa R$ ${Number(price).toFixed(2).replace('.', ',')}.`,
            code: 'MEMBER_LIMIT_REACHED',
            required_additional_slots: projectedBillable,
            paid_slots: paidSlots,
            additional_member_price: price,
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (newUser.user) {
      const updateData: any = {
        role,
        full_name: full_name || null,
        invited_by: user.id,
        organization_id: profile.organization_id, // Associa a mesma org do criador
        force_password_change: true // Obriga a troca no primeiro login
      };

      if (doctor_ids && doctor_ids.length > 0) {
        updateData.doctor_id = doctor_ids[0];
      }

      if ((role === 'medico' || role === 'dono') && consultation_value) {
        updateData.consultation_value = consultation_value;
      }

      await supabaseAdmin.from('profiles').update(updateData).eq('id', newUser.user.id);

      // Sync links
      if (doctor_ids && doctor_ids.length > 0 && profile.organization_id) {
        const links = doctor_ids.map(docId => ({
          secretary_id: newUser.user.id,
          doctor_id: docId,
          organization_id: profile.organization_id
        }));
        await supabaseAdmin.from('secretary_doctor_links').insert(links);
      }

      // Create consultation procedure
      if ((role === 'medico' || role === 'dono') && consultation_value && consultation_value > 0) {
        await supabaseAdmin.from('commercial_procedures').insert({
          user_id: newUser.user.id,
          name: 'CONSULTA',
          category: 'consultation',
          price: consultation_value,
          duration_minutes: 30,
          description: 'Consulta médica padrão',
          is_active: true
        });
      }
    }

    return new Response(JSON.stringify({ success: true, user: newUser.user }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);