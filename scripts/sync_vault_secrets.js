import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const OLD_USER_ID = '49704dd5-01ab-4cfe-8854-07799641a1f0'; // Secretaria
const NEW_USER_ID = '2cffb770-1afe-4dc7-bf7f-4d2a0969ec51'; // Gustavo (Dono)

async function syncSecrets() {
    console.log('🔐 Sincronizando Secrets do Vault...');

    // 1. Tentar ler o secret antigo
    const oldSecretName = `whatsapp_token_${OLD_USER_ID}`;
    console.log(`📖 Lendo secret antigo: ${oldSecretName}`);

    const { data: token, error: readError } = await supabase.rpc('read_secret', {
        secret_id: oldSecretName
    });

    if (readError) {
        console.error('❌ Erro ao ler secret antigo (pode não existir ou sem permissão):', readError.message);
        // Se falhar, tenta ler do novo (vai que já existe?)
        return;
    }

    if (!token) {
        console.error('❌ Secret antigo retornou vazio (null).');
        return;
    }

    console.log('✅ Token recuperado com sucesso (oculto por segurança). length:', token.length);

    // 2. Salvar para o Novo Usuário (Gustavo)
    const newSecretName = `whatsapp_token_${NEW_USER_ID}`;
    console.log(`💾 Salvando para novo usuário: ${newSecretName}`);

    const { error: saveError } = await supabase.rpc('create_secret', {
        secret_id: newSecretName,
        secret: token
    });

    if (saveError) {
        // Se falhar na criação, tenta update (caso já exista)
        if (saveError.message.includes('duplicate') || saveError.message.includes('violates unique constraint')) {
            console.log('   ⚠️ Secret já existe, tentando update...');
            const { error: updateError } = await supabase.rpc('update_secret', {
                secret_id: newSecretName,
                new_secret: token
            });
            if (updateError) {
                console.error('   ❌ Erro no update do secret:', updateError.message);
            } else {
                console.log('   ✅ Secret do Gustavo ATUALIZADO com sucesso.');
            }
        } else {
            console.error('❌ Erro ao criar secret para Gustavo:', saveError.message);
        }
    } else {
        console.log('✅ Secret do Gustavo CRIADO com sucesso.');
    }

    // 3. (Opcional) Restaurar/Manter para a Secretária também?
    // O usuário disse: "toda a função... também deve ir pra secretaria"
    // Então vamos GARANTIR que a secretária tenha o secret lá, caso precisemos dele no futuro.
    // Como acabamos de ler dele, ele já existe. Não precisamos recriar.
    console.log('👍 Secret da Secretária mantido intacto.');

    console.log('\n✅ Sincronização de Tokens Concluída!');
}

syncSecrets();
