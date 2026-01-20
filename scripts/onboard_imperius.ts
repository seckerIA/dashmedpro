
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required.');
    console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/onboard_imperius.ts');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const DEFAULT_PASSWORD = 'Imperius@2026';

const USERS = [
    { email: 'dono@imperiustech.dashmed.com', role: 'dono', name: 'Dono Imperius' },
    { email: 'medico@imperiustech.dashmed.com', role: 'medico', name: 'Dr. Imperius' },
    { email: 'secretaria@imperiustech.dashmed.com', role: 'secretaria', name: 'Secretária Imperius' },
];

async function main() {
    console.log('🚀 Starting Imperius Onboarding...');

    // 1. Create Organization
    console.log('👉 Creating/Fetching Organization...');
    let orgId: string;

    const { data: existingOrg, error: findError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'imperius')
        .single();

    if (existingOrg) {
        orgId = existingOrg.id;
        console.log(`✅ Organization 'Imperius' already exists (ID: ${orgId})`);
    } else {
        const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert({
                name: 'Imperius Tech',
                slug: 'imperius',
                plan: 'enterprise',
                status: 'active'
            })
            .select('id')
            .single();

        if (createError) {
            console.error('❌ Failed to create organization:', createError);
            process.exit(1);
        }
        orgId = newOrg.id;
        console.log(`✅ Created Organization 'Imperius Tech' (ID: ${orgId})`);
    }

    // 2. Create Users
    console.log('👉 Creating Users...');

    for (const user of USERS) {
        console.log(`\nProcessing ${user.role} (${user.email})...`);

        // Check if user exists in Auth
        // Note: admin.listUsers is strictly paginated or we can just try creating and catch error
        // We'll try to create, if fails, we try to update password/metadata? No, just fetch ID.

        let userId: string;

        // Attempt Create
        const { data: matchUsers, error: searchError } = await supabase.auth.admin.listUsers();
        // This is inefficient for production but fine for a script with few users. 
        // Ideally we use createUser and handle "already exists" error

        const existingUser = matchUsers?.users.find(u => u.email === user.email);

        if (existingUser) {
            console.log(`   User already exists in Auth (ID: ${existingUser.id})`);
            userId = existingUser.id;

            // Optional: Update password
            // await supabase.auth.admin.updateUserById(userId, { password: DEFAULT_PASSWORD });
        } else {
            const { data: newUser, error: createAuthError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
                user_metadata: { full_name: user.name }
            });

            if (createAuthError) {
                console.error(`   ❌ Failed to create auth user: ${createAuthError.message}`);
                continue;
            }

            userId = newUser.user.id;
            console.log(`   ✅ Created Auth User (ID: ${userId})`);
        }

        // 3. Ensure Profile exists and is linked to Org
        // Trigger likely created profile, but we need to update organization_id and role
        // Wait a bit for trigger? Or just upsert.

        // Let's Insert/Update Organization Member
        const { error: memberError } = await supabase
            .from('organization_members')
            .upsert({
                organization_id: orgId,
                user_id: userId,
                role: user.role
            }, {
                onConflict: 'organization_id,user_id'
            });

        if (memberError) {
            console.error(`   ❌ Failed to add to organization: ${memberError.message}`);
        } else {
            console.log(`   ✅ Added to Organization 'Imperius' as '${user.role}'`);
        }

        // Update Profile with current org (context)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                organization_id: orgId,
                role: user.role, // Legacy role column update
                full_name: user.name
            })
            .eq('id', userId);

        if (profileError) {
            console.error(`   ⚠️ Failed to update profile context: ${profileError.message}`);
        } else {
            console.log(`   ✅ Updated Profile context`);
        }
    }

    console.log('\n✨ Onboarding Complete!');
}

main().catch(console.error);
