import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, cache-control, pragma, connection, expires",
};

interface OnboardingClinicData {
  name: string;
  slug: string;
  phone: string;
  city: string;
}

interface OnboardingDoctorData {
  fullName: string;
  specialty: string;
  consultationValue: number;
}

interface OnboardingProcedure {
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

interface OnboardingTeamMember {
  name: string;
  email: string;
  role: 'secretaria' | 'medico';
}

interface CompleteOnboardingRequest {
  clinic: OnboardingClinicData;
  doctor: OnboardingDoctorData;
  procedures: OnboardingProcedure[];
  teamMembers: OnboardingTeamMember[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Verify the user is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [complete-onboarding] Processing for user: ${user.email}`);

    // Parse request body
    const { clinic, doctor, procedures, teamMembers }: CompleteOnboardingRequest = await req.json();

    // Validate required fields
    if (!clinic?.name || !clinic?.slug || !doctor?.fullName || !doctor?.specialty) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinic name, slug, doctor name, and specialty are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check if slug is available (final verification)
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', clinic.slug)
      .single();

    if (existingOrg) {
      return new Response(
        JSON.stringify({ error: 'Slug already taken. Please choose a different one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Organization
    console.log(`🏥 [complete-onboarding] Creating organization: ${clinic.name}`);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: clinic.name,
        slug: clinic.slug,
        phone: clinic.phone || null,
        city: clinic.city || null,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return new Response(
        JSON.stringify({ error: 'Failed to create organization', details: orgError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create organization_member (user as 'dono')
    console.log(`👤 [complete-onboarding] Creating organization member`);
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'dono',
      });

    if (memberError) {
      console.error('Error creating organization member:', memberError);
      // Rollback: delete organization
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create organization member', details: memberError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update user's profile
    console.log(`📝 [complete-onboarding] Updating user profile`);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: doctor.fullName,
        specialty: doctor.specialty,
        consultation_value: doctor.consultationValue || 0,
        organization_id: organization.id,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        role: 'medico', // Ensure role is set
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Rollback
      await supabaseAdmin.from('organization_members').delete().eq('user_id', user.id);
      await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create Financial Account for the doctor
    console.log(`💰 [complete-onboarding] Creating financial account`);
    const { error: accountError } = await supabaseAdmin
      .from('financial_accounts')
      .insert({
        user_id: user.id,
        name: 'Conta Principal',
        type: 'checking',
        initial_balance: 0,
        current_balance: 0,
        color: '#10B981', // Emerald color
        is_active: true,
      });

    if (accountError) {
      console.error('Error creating financial account:', accountError);
      // Non-critical, continue
    }

    // 6. Create Commercial Procedures
    if (procedures && procedures.length > 0) {
      console.log(`📋 [complete-onboarding] Creating ${procedures.length} procedures`);

      const proceduresToInsert = procedures.map(proc => ({
        user_id: user.id,
        name: proc.name,
        category: proc.category || 'procedure',
        price: proc.price || 0,
        duration_minutes: proc.durationMinutes || 30,
        description: proc.description || null,
        is_active: true,
      }));

      const { error: proceduresError } = await supabaseAdmin
        .from('commercial_procedures')
        .insert(proceduresToInsert);

      if (proceduresError) {
        console.error('Error creating procedures:', proceduresError);
        // Non-critical, continue
      }
    }

    // 7. Invite Team Members (optional)
    const invitedMembers: Array<{ email: string; success: boolean; error?: string }> = [];

    if (teamMembers && teamMembers.length > 0) {
      console.log(`👥 [complete-onboarding] Inviting ${teamMembers.length} team members`);

      for (const member of teamMembers) {
        try {
          // Check if user already exists
          const { data: existingUser } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', member.email)
            .single();

          if (existingUser) {
            // User exists, link them as secretary if applicable
            if (member.role === 'secretaria') {
              await supabaseAdmin
                .from('secretary_doctor_links')
                .upsert({
                  secretary_id: existingUser.id,
                  doctor_id: user.id,
                });
            }
            invitedMembers.push({ email: member.email, success: true });
            continue;
          }

          // Create new user
          const tempPassword = crypto.randomUUID().slice(0, 12);

          const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: member.email,
            password: tempPassword,
            user_metadata: { full_name: member.name },
            email_confirm: false, // They'll need to confirm via magic link
          });

          if (createUserError) {
            console.error(`Error creating user ${member.email}:`, createUserError);
            invitedMembers.push({ email: member.email, success: false, error: createUserError.message });
            continue;
          }

          if (newUser.user) {
            // Update profile
            await supabaseAdmin
              .from('profiles')
              .update({
                role: member.role,
                full_name: member.name,
                organization_id: organization.id,
                invited_by: user.id,
                onboarding_completed: true, // Invited users skip onboarding
              })
              .eq('id', newUser.user.id);

            // Create secretary link if applicable
            if (member.role === 'secretaria') {
              await supabaseAdmin
                .from('secretary_doctor_links')
                .insert({
                  secretary_id: newUser.user.id,
                  doctor_id: user.id,
                });
            }

            // Send password reset email (acts as invite)
            await supabaseAdmin.auth.admin.generateLink({
              type: 'recovery',
              email: member.email,
            });

            invitedMembers.push({ email: member.email, success: true });
          }
        } catch (memberError: any) {
          console.error(`Error inviting ${member.email}:`, memberError);
          invitedMembers.push({ email: member.email, success: false, error: memberError.message });
        }
      }
    }

    // 8. Delete onboarding_state to clean up
    console.log(`🧹 [complete-onboarding] Cleaning up onboarding state`);
    await supabaseAdmin
      .from('onboarding_state')
      .delete()
      .eq('user_id', user.id);

    console.log(`✅ [complete-onboarding] Onboarding completed for ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        invitedMembers,
        message: 'Onboarding completed successfully',
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
    console.error("Error in complete-onboarding function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
