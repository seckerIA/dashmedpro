import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyDuplicates() {
    console.log('Verificando duplicatas...');

    // Buscar todas as conversas para o número de exemplo
    const { data: convs, error: cError } = await supabase
        .from('whatsapp_conversations')
        .select('id, user_id, phone_number, contact_name, created_at')
        .eq('phone_number', '5511999998888');

    if (cError) {
        console.error('Erro ao buscar conversas:', cError);
        return;
    }

    console.log('\nConversas encontradas:');
    console.table(convs);

    if (convs && convs.length > 1) {
        const userIds = convs.map(c => c.user_id);

        // Buscar perfis desses usuários
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('id', userIds);

        console.log('\nPerfis dos donos das conversas:');
        console.table(profiles);

        // Verificar se existe link de secretária
        const { data: links } = await supabase
            .from('secretary_doctor_links')
            .select('*');

        console.log('\nLinks de Secretária:');
        console.table(links);

        // Verificar configs de WhatsApp
        const { data: configs } = await supabase
            .from('whatsapp_config')
            .select('user_id, phone_number_id, is_active');

        console.log('\nConfigs de WhatsApp:');
        console.table(configs);
    }
}

verifyDuplicates();
