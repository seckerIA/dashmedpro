import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const USER_ID = '2cffb770-1afe-4dc7-bf7f-4d2a0969ec51'; // gustavosantosbbs@gmail.com

async function checkWhatsAppConfig() {
    console.log(`🔍 Verificando whatsapp_config para o usuário: ${USER_ID}`);

    const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', USER_ID);

    if (error) {
        console.error('❌ Erro ao buscar configuração:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma configuração de WhatsApp encontrada para este usuário.');
    } else {
        console.log('✅ Configuração encontrada:');
        console.table(data);
    }
}

checkWhatsAppConfig();
