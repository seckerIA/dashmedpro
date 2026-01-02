import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkAccessTokenColumn() {
    console.log('🔍 Verificando coluna access_token na tabela whatsapp_config...');

    // Tentar selecionar a coluna access_token
    const { data, error } = await supabase
        .from('whatsapp_config')
        .select('access_token')
        .limit(1);

    if (error) {
        console.error('❌ Erro/Coluna não existe:', error.message);

        // Se não existe, vamos criar usando SQL via RPC (exec_sql se existir) ou alertar o usuário
        console.log('💡 DICA: Se a coluna não existir, precisaremos criar via Dashboard ou Migration.');
    } else {
        console.log('✅ Coluna access_token EXISTE na tabela whatsapp_config!');
    }
}

checkAccessTokenColumn();
