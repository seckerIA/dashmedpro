import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role: 'admin' | 'dono' | 'vendedor' | 'gestor_trafego' | 'secretaria' | 'medico';
  doctor_id?: string;
  consultation_value?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')!;

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the user is authenticated and authorized (admin or dono)
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

    // Check if user has admin, dono or medico role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'dono', 'medico'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, full_name, role, doctor_id, consultation_value }: CreateUserRequest = await req.json();

    // Validate required fields
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Médicos só podem criar 'medico' ou 'secretaria'
    if (profile.role === 'medico' && !['medico', 'secretaria'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Médicos só podem criar usuários com role medico ou secretaria' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate: secretaria should have doctor_id (mas não é obrigatório na criação para flexibilidade)
    // A validação obrigatória será feita no frontend (TeamManagement)

    // Create the user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true // Auto-confirm email
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The profile will be created automatically by the trigger
    // But we need to update the role since the trigger sets default role
    if (newUser.user) {
      const updateData: any = {
        role,
        full_name: full_name || null,
        invited_by: user.id
      };

      // Add doctor_id if role is secretaria
      if (role === 'secretaria' && doctor_id) {
        updateData.doctor_id = doctor_id;
      }

      // Add consultation_value if role is medico or dono
      if ((role === 'medico' || role === 'dono') && consultation_value) {
        updateData.consultation_value = consultation_value;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', newUser.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Criar procedimento "CONSULTA" automaticamente para médico/dono
      if ((role === 'medico' || role === 'dono') && consultation_value && consultation_value > 0) {
        // Verificar se já existe procedimento CONSULTA para este médico
        const { data: existingConsultation } = await supabaseAdmin
          .from('commercial_procedures')
          .select('id')
          .eq('user_id', newUser.user.id)
          .eq('name', 'CONSULTA')
          .eq('category', 'consultation')
          .single();

        if (!existingConsultation) {
          // Criar procedimento CONSULTA
          const { error: procedureError } = await supabaseAdmin
            .from('commercial_procedures')
            .insert({
              user_id: newUser.user.id,
              name: 'CONSULTA',
              category: 'consultation',
              price: consultation_value,
              duration_minutes: 30,
              description: 'Consulta médica padrão',
              is_active: true
            });

          if (procedureError) {
            console.error('Error creating consultation procedure:', procedureError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: newUser.user,
        message: 'User created successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in create-team-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);