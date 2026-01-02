
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
    console.log('Checking RLS policies for whatsapp_messages...');

    // Note: Standard Supabase client can't query pg_policies directly easily via API unless using RPC or custom view.
    // Instead, we will simulate a read as a specific user to test access.

    // 1. Get a test user (Gustavo)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const gustavo = users.users.find(u => u.email.includes('gustavo'));

    if (!gustavo) {
        console.error('User Gustavo not found');
        return;
    }

    console.log(`Testing access for user: ${gustavo.email} (${gustavo.id})`);

    // 2. Create a client impersonating this user
    const userClient = createClient(supabaseUrl, envConfig.VITE_SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${await getUserJwt(gustavo.id)}`
            }
        }
    });

    // 3. Try to select messages
    const { data, error } = await userClient
        .from('whatsapp_messages')
        .select('id, content, conversation_id')
        .limit(5);

    if (error) {
        console.error('❌ Access DENIED:', error);
    } else {
        console.log(`✅ Access GRANTED. Found ${data.length} messages.`);
        if (data.length > 0) console.log('Sample:', data[0]);
    }
}

// Helper to sign JWT (mocking, or just use password sign-in if needed, but here we can't easily mint a JWT without secret)
// Actually, with Service Key we can mint a JWT or just use 'supabase.auth.admin.getUserById' won't give us a token.
// Design change: simpler approach -> List policies via SQL function if available, or just use the behavior we saw.
// Wait, we can use the "postgres" connection string from .env if available to run raw SQL? No, we don't have it.

// Let's rely on the fact that the user said "it works when I click refresh". 
// If refresh works, RLS SELECT is working for HTTP requests.
// BUT Realtime works differently. 
// Realtime uses the "publication" setup.

console.log('Verifying publication settings via RPC (custom)...');
// If we can't run SQL, we can't check pg_publication_tables.

// So let's skip the complex check and assume RLS is open enough for HTTP (since refresh works) 
// and look at REALTIME SPECIFIC issues.

checkPolicies();

// Workaround for JWT: We can't easily forge one here without the JWT secret which is usually not in .env (only anon/service keys).
// Better approach: Check if "supabase_realtime" publication includes the table.
