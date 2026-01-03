import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRelationships() {
    try {
        console.log('Testing join on commercial_leads with EXPLICIT FK...');
        const { data: leads, error: lError } = await supabase
            .from('commercial_leads')
            .select('*, doctor:profiles!commercial_leads_user_id_profiles_fk(full_name)')
            .limit(1);

        if (lError) {
            console.log('Lead explicit join failed:', lError.message);
        } else {
            console.log('Lead explicit join success!');
        }

        console.log('Testing join on commercial_leads with OLD FK name...');
        const { data: leads2, error: lError2 } = await supabase
            .from('commercial_leads')
            .select('*, doctor:profiles!commercial_leads_user_id_fkey(full_name)')
            .limit(1);

        if (lError2) {
            console.log('Lead old join failed:', lError2.message);
        } else {
            console.log('Lead old join success!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkRelationships();
