import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const OLD_USER_ID = '49704dd5-01ab-4cfe-8854-07799641a1f0'; // secretaria.teste
const NEW_USER_ID = '2cffb770-1afe-4dc7-bf7f-4d2a0969ec51'; // gustavosantosbbs (Você)

async function migrateConfig() {
    console.log('🔄 Migrando configuração do WhatsApp...');
    console.log(`De: ${OLD_USER_ID} (secretaria.teste)`);
    console.log(`Para: ${NEW_USER_ID} (gustavosantosbbs)`);

    // 1. Verificar se já existe config no destino (para evitar erro de chave única)
    const { data: existingTarget } = await supabase
        .from('whatsapp_config')
        .select('id')
        .eq('user_id', NEW_USER_ID)
        .single();

    if (existingTarget) {
        console.log('⚠️ O usuário de destino JÁ possui uma configuração. Abortando migração para evitar sobrescrita acidental.');
        return;
    }

    // 2. Atualizar o user_id da configuração existente
    const { data, error } = await supabase
        .from('whatsapp_config')
        .update({ user_id: NEW_USER_ID })
        .eq('user_id', OLD_USER_ID)
        .select();

    if (error) {
        console.error('❌ Erro na migração:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Migração concluída com sucesso!');
        console.log('A configuração agora pertence ao seu usuário atual.');
    } else {
        console.log('⚠️ Nenhuma configuração encontrada no usuário de origem para migrar.');
    }
}

migrateConfig();
