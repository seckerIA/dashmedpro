import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkConfigsSimple() {
    console.log('🔍 Verificando tabela whatsapp_config (modo raw)...');

    const { data: configs, error } = await supabase
        .from('whatsapp_config')
        .select('*');

    if (error) {
        console.error('❌ Erro:', error.message);
        return;
    }

    if (!configs || configs.length === 0) {
        console.log('⚠️ Tabela whatsapp_config está VAZIA.');
        return;
    }

    console.log(`✅ Encontradas ${configs.length} configurações.`);

    // Buscar detalhes dos usuários donos dessas configs
    for (const config of configs) {
        const { data: user } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', config.user_id)
            .single();

        console.log(`\n--- Config ID: ${config.id} ---`);
        console.log(`   Usuário ID: ${config.user_id}`);
        console.log(`   Email: ${user?.email || 'N/A'}`);
        console.log(`   Phone ID: ${config.phone_number_id}`);
        console.log(`   Ativo: ${config.is_active}`);
    }
}

checkConfigsSimple();
