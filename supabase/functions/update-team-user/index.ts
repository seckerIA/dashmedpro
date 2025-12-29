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
  role?: 'admin' | 'dono' | 'vendedor' | 'gestor_trafego';
  password?: string;
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

    const { userId, full_name, role, password }: UpdateUserRequest = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    return new Response(JSON.stringify({ success: true, message: 'User updated successfully' }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error in update-team-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);















