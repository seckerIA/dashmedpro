import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, expires",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // DEBUG: Immediate response
  // return new Response(JSON.stringify({ debug: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { userId, doctor_ids, full_name, role, password, consultation_value } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, role')
      .eq('id', userId)
      .single();

    if (targetError) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orgId = targetProfile?.organization_id;

    // Update profile
    const profilesUpdate: any = {};
    if (full_name !== undefined) profilesUpdate.full_name = full_name || null;
    if (role !== undefined) profilesUpdate.role = role;

    if (doctor_ids && doctor_ids.length > 0) {
      profilesUpdate.doctor_id = doctor_ids[0];
    } else if (role && role !== 'secretaria') {
      profilesUpdate.doctor_id = null;
    }

    if (consultation_value !== undefined) {
      profilesUpdate.consultation_value = consultation_value;
    }

    if (Object.keys(profilesUpdate).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profilesUpdate)
        .eq('id', userId);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Sync secretary_doctor_links table
    if (doctor_ids !== undefined && orgId) {
      await supabaseAdmin
        .from('secretary_doctor_links')
        .delete()
        .eq('secretary_id', userId);

      if (doctor_ids.length > 0) {
        const links = doctor_ids.map(docId => ({
          secretary_id: userId,
          doctor_id: docId,
          organization_id: orgId
        }));
        await supabaseAdmin
          .from('secretary_doctor_links')
          .insert(links);
      }
    }

    if (password) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
