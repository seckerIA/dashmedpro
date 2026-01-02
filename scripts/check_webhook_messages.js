import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRecentMessages() {
    console.log('🔍 Buscando mensagens recentes do WhatsApp...');

    // Buscar últimas 5 mensagens
    const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select(`
      id,
      content,
      status,
      created_at,
      direction,
      phone_number
    `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Erro ao buscar mensagens:', error.message);
        return;
    }

    if (!messages || messages.length === 0) {
        console.log('⚠️ Nenhuma mensagem encontrada na tabela.');
        return;
    }

    console.log(`✅ Encontradas ${messages.length} mensagens recentes:\n`);

    messages.forEach(msg => {
        console.log(`[${new Date(msg.created_at).toLocaleString('pt-BR')}] ${msg.direction === 'inbound' ? '⬅️' : '➡️'} ${msg.phone_number}: "${msg.content}" (${msg.status})`);
    });

    // Verificar se alguma é o nosso teste
    const testMsg = messages.find(m => m.content.includes("n8n"));
    if (testMsg) {
        console.log('\n🎯 MENSAGEM DE TESTE ENCONTRADA NO BANCO!');
        console.log('Isso significa que o Webhook funcionou e salvou no banco.');
        console.log('Se não aparece na tela, pode ser filtro de frontend ou cache.');
    } else {
        console.log('\n❌ Mensagem de teste "n8n" NÃO encontrada nas últimas 5.');
        console.log('O Webhook provavelmente rejeitou o payload ou falhou silenciosamente (ver logs da Edge Function).');
    }
}

checkRecentMessages();
