import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function listAllUsers() {
    console.log('🔍 Buscando usuários via Admin API (auth.users)...');

    // 1. Listar usuários da Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Erro ao listar usuários da Auth:', authError.message);
        return;
    }

    // 2. Listar perfis da tabela Profiles
    // Como estamos usando SERVICE_ROLE não precisamos nos preocupar com RLS
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

    if (profilesError) {
        console.error('❌ Erro ao listar perfis:', profilesError.message);
        return;
    }

    console.log(`\n✅ Encontrados ${users.length} usuários na Auth e ${profiles.length} perfis na tabela Profiles.\n`);

    // Cruzar dados
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const combinedData = users.map(user => {
        const profile = profileMap.get(user.id);
        return {
            ID: user.id,
            Email: user.email,
            'Criado em': new Date(user.created_at).toLocaleString('pt-BR'),
            'Último Login': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca',
            'Perfil: Nome': profile ? profile.full_name : '⚠️ PENDENTE',
            'Perfil: Role': profile ? profile.role : '⚠️ PENDENTE'
        };
    });

    console.table(combinedData);
}

listAllUsers();
