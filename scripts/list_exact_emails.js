import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listExactEmails() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });

    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    // Buscar profiles para garantir o mapeamento correto de roles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    console.log('--- LISTA DE EMAILS (INFALÍVEL) ---');
    users.forEach((u, index) => {
        const profile = profileMap.get(u.id);
        const role = profile ? profile.role : 'N/A';
        const name = profile ? profile.full_name : 'N/A';
        // Formato simples para não sofrer truncagem
        console.log(`${index + 1}. [${u.email}] - Role: ${role} - Nome: ${name}`);
    });
    console.log('--- FIM DA LISTA ---');
}

listExactEmails();
