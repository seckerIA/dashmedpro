import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkAllWhatsAppConfigs() {
    console.log('🔍 Verificando configurações de WhatsApp para TODOS os usuários...');

    const { data, error } = await supabase
        .from('whatsapp_config')
        .select(`
      *,
      profile:profiles(email, full_name, role)
    `);

    if (error) {
        console.error('❌ Erro:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️ Tabela whatsapp_config está COMPLETAMENTE VAZIA.');
        return;
    }

    console.log(`✅ Encontradas ${data.length} configurações:\n`);

    data.forEach(config => {
        const user = config.profile;
        console.log(`--- Config ID: ${config.id} ---`);
        console.log(`   Usuário: ${user?.full_name} (${user?.email}) [Role: ${user?.role}]`);
        console.log(`   User ID: ${config.user_id}`);
        console.log(`   Phone ID: ${config.phone_number_id}`);
        console.log(`   Ativo: ${config.is_active}`);
        console.log(`   Última Sync: ${config.last_synced_at}`);
        console.log('----------------------------------\n');
    });
}

checkAllWhatsAppConfigs();
