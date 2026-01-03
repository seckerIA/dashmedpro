import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyRPC() {
    console.log('🔍 Verificando existência das funções RPC...');

    const testUserId = '49704dd5-01ab-4cf8-8854-07799641a1f0'; // Maria Santos

    const { data: hotLeads, error: hotError } = await supabase.rpc('get_hot_leads', {
        p_user_id: testUserId,
        p_limit: 1
    });

    if (hotError) {
        console.error('❌ get_hot_leads failed:', hotError.message, hotError.code);
    } else {
        console.log('✅ get_hot_leads exists and returned:', hotLeads?.length || 0, 'leads');
    }

    const { data: followups, error: followError } = await supabase.rpc('get_pending_followups', {
        p_user_id: testUserId,
        p_hours: 24
    });

    if (followError) {
        console.error('❌ get_pending_followups failed:', followError.message, followError.code);
    } else {
        console.log('✅ get_pending_followups exists and returned:', followups?.length || 0, 'followups');
    }
}

verifyRPC();
