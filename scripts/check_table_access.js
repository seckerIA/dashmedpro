import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTableStructure() {
    console.log('🔍 Verificando estrutura da tabela whatsapp_config...');

    // Tentar inserir um registro dummy para ver se dá erro de coluna inexistente
    // Usaremos um UUID aleatório para não conflitar
    const dummyId = '00000000-0000-0000-0000-000000000000';

    // Apenas tentar selecionar uma coluna específica para ver se existe
    const { error } = await supabase
        .from('whatsapp_config')
        .select('webhook_verify_token')
        .limit(1);

    if (error) {
        console.error('❌ Erro ao acessar tabela:', error.message);
        return;
    }

    console.log('✅ Tabela whatsapp_config acessível e coluna webhook_verify_token existe.');
}

checkTableStructure();
