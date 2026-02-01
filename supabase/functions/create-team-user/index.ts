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
    const { email, password, full_name, role, doctor_ids, consultation_value } = body;

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, and role are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        organization_id: profile.organization_id // Associa a mesma org do criador
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