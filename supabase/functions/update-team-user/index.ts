import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  userId: string;
  full_name?: string;
  role?: 'admin' | 'dono' | 'vendedor' | 'gestor_trafego' | 'secretaria' | 'medico';
  password?: string;
  doctor_id?: string | null;
  consultation_value?: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'dono')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { userId, full_name, role, password, doctor_id, consultation_value }: UpdateUserRequest = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate: secretaria must have doctor_id
    if (role === 'secretaria' && doctor_id === undefined) {
      // Se está mudando para secretaria mas não forneceu doctor_id, verificar se já tem
      // Se não tiver, retornar erro
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('role, doctor_id')
        .eq('id', userId)
        .single();
      
      if (currentProfile?.role !== 'secretaria' && !doctor_id) {
        return new Response(
          JSON.stringify({ error: 'Secretária deve ser vinculada a um médico (doctor_id obrigatório)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if target user exists
    const { data: targetProfile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single();
    if (profileError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prevent non-dono from updating dono accounts
    if (targetProfile.role === 'dono' && profile.role !== 'dono') {
      return new Response(JSON.stringify({ error: 'Cannot update owner account' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update profile
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name || null;
    
    // Try to update role in profiles table (if column exists)
    if (role !== undefined) {
      updateData.role = role;
    }

    // Update doctor_id if provided
    if (doctor_id !== undefined) {
      if (role === 'secretaria' && !doctor_id) {
        return new Response(
          JSON.stringify({ error: 'Secretária deve ser vinculada a um médico (doctor_id obrigatório)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Se não for secretária, garantir que doctor_id seja NULL
      updateData.doctor_id = (role === 'secretaria' && doctor_id) ? doctor_id : null;
    } else if (role !== undefined && role !== 'secretaria') {
      // Se mudou role para algo que não é secretaria, remover doctor_id
      updateData.doctor_id = null;
    }

    // Update consultation_value if provided
    if (consultation_value !== undefined) {
      if ((role === 'medico' || role === 'dono') && (!consultation_value || consultation_value <= 0)) {
        return new Response(
          JSON.stringify({ error: 'Médico/dono deve ter um valor de consulta maior que zero' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Se não for médico/dono, garantir que consultation_value seja NULL
      updateData.consultation_value = ((role === 'medico' || role === 'dono') && consultation_value) ? consultation_value : null;
    } else if (role !== undefined && role !== 'medico' && role !== 'dono') {
      // Se mudou role para algo que não é médico/dono, remover consultation_value
      updateData.consultation_value = null;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        // If role column doesn't exist, try user_roles table
        if (updateError.message.includes('column') && updateError.message.includes('role')) {
          // Remove role from updateData and try again
          delete updateData.role;
          if (Object.keys(updateData).length > 0) {
            const { error: retryError } = await supabaseAdmin
              .from('profiles')
              .update(updateData)
              .eq('id', userId);
            
            if (retryError) {
              return new Response(JSON.stringify({ error: retryError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
        } else {
          return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Update user_roles table if role was provided
    // First delete existing roles for this user, then insert new one
    if (role !== undefined) {
      try {
        // Delete existing roles
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Insert new role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: role 
          });

        // Ignore error if table doesn't exist (some databases use profiles.role directly)
        if (roleError && !roleError.message.includes('does not exist') && !roleError.message.includes('relation')) {
          console.warn('Could not update user_roles table:', roleError.message);
        }
      } catch (e) {
        // Silently fail if user_roles table doesn't exist
        console.warn('user_roles table may not exist, using profiles.role instead');
      }
    }

    // Update password if provided
    if (password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });

      if (passwordError) {
        return new Response(JSON.stringify({ error: passwordError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Criar ou atualizar procedimento "CONSULTA" se for médico/dono e tiver consultation_value
    if ((role === 'medico' || role === 'dono') && consultation_value && consultation_value > 0) {
      // Verificar se já existe procedimento CONSULTA para este médico
      const { data: existingConsultation } = await supabaseAdmin
        .from('commercial_procedures')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'CONSULTA')
        .eq('category', 'consultation')
        .single();

      if (existingConsultation) {
        // Atualizar procedimento existente
        const { error: updateProcedureError } = await supabaseAdmin
          .from('commercial_procedures')
          .update({
            price: consultation_value,
            is_active: true
          })
          .eq('id', existingConsultation.id);

        if (updateProcedureError) {
          console.error('Error updating consultation procedure:', updateProcedureError);
        }
      } else {
        // Criar novo procedimento CONSULTA
        const { error: createProcedureError } = await supabaseAdmin
          .from('commercial_procedures')
          .insert({
            user_id: userId,
            name: 'CONSULTA',
            category: 'consultation',
            price: consultation_value,
            duration_minutes: 30,
            description: 'Consulta médica padrão',
            is_active: true
          });

        if (createProcedureError) {
          console.error('Error creating consultation procedure:', createProcedureError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'User updated successfully' }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error in update-team-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
















