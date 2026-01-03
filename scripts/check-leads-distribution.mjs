import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkLeads() {
    try {
        console.log('--- Profiles ---');
        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role');

        if (pError) throw pError;
        console.table(profiles);

        console.log('\n--- Commercial Leads Count per User ---');
        const { data: leads, error: lError } = await supabase
            .from('commercial_leads')
            .select('user_id');

        if (lError) throw lError;

        const counts = leads.reduce((acc, lead) => {
            acc[lead.user_id] = (acc[lead.user_id] || 0) + 1;
            return acc;
        }, {});

        const countsTable = Object.entries(counts).map(([userId, count]) => {
            const p = profiles.find(pr => pr.id === userId);
            return {
                id: userId,
                name: p?.full_name || 'N/A',
                role: p?.role || 'N/A',
                count
            };
        });
        console.table(countsTable);

        console.log('\n--- Secretary-Doctor Links ---');
        const { data: links, error: sError } = await supabase
            .from('secretary_doctor_links')
            .select('*, secretary:profiles!secretary_doctor_links_secretary_id_fkey(full_name), doctor:profiles!secretary_doctor_links_doctor_id_fkey(full_name)');

        if (sError) throw sError;
        console.table(links.map(l => ({
            secretary: l.secretary?.full_name,
            doctor: l.doctor?.full_name,
            is_active: l.is_active
        })));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkLeads();
