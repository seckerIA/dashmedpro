import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SECRETARIA_ID = '49704dd5-01ab-4cfe-8854-07799641a1f0';
const GUSTAVO_ID = '2cffb770-1afe-4dc7-bf7f-4d2a0969ec51';

async function revertMigration() {
    console.log('⏪ Revertendo migração de WhatsApp...');

    // Buscar a config que está atualmente com o Gustavo (que era da secretária)
    // Sabemos que é aquela com phone_id final ...570 (do log anterior) ou simplesmente a única que existe
    const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', GUSTAVO_ID)
        .single();

    if (!config) {
        console.log('⚠️ Nenhuma configuração encontrada no Gustavo para reverter.');
        return;
    }

    console.log(`Encontrada config no Gustavo: ${config.id} (Phone: ${config.phone_number_id})`);

    // Devolver para a Secretária
    const { error } = await supabase
        .from('whatsapp_config')
        .update({ user_id: SECRETARIA_ID })
        .eq('id', config.id);

    if (error) {
        console.error('❌ Erro ao reverter:', error.message);
    } else {
        console.log('✅ Reversão concluída! A configuração voltou para a Secretária.');
        console.log('O usuário Gustavo agora está sem configuração, pronto para adicionar a dele.');
    }
}

revertMigration();
