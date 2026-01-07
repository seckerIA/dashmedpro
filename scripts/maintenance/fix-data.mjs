import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function fixEverything() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('✓ Conectado');

        const doctorId = '2cffb770-1afe-4dc7-bf7f-4d2a0969ec51';
        const secretaryId = '49704dd5-01ab-4cfe-8854-07799641a1f0';

        // 1. Transferir configuração de WhatsApp
        const { rows: configs } = await client.query('SELECT * FROM public.whatsapp_config');
        const secretaryConfig = configs.find(c => c.user_id === secretaryId);

        if (secretaryConfig) {
            console.log('Transferindo configuração da secretária para o médico...');
            // Deletar qualquer config existente do médico para evitar conflito
            await client.query('DELETE FROM public.whatsapp_config WHERE user_id = $1', [doctorId]);
            await client.query(
                'UPDATE public.whatsapp_config SET user_id = $1 WHERE id = $2',
                [doctorId, secretaryConfig.id]
            );
        }

        // 2. Unificar conversas duplicadas
        const phoneNumber = '5524999409021';
        const { rows: conversations } = await client.query(
            'SELECT id, user_id FROM public.whatsapp_conversations WHERE phone_number = $1',
            [phoneNumber]
        );

        if (conversations.length > 1) {
            const targetConv = conversations.find(c => c.user_id === doctorId) || conversations[0];
            const otherConvs = conversations.filter(c => c.id !== targetConv.id);

            for (const other of otherConvs) {
                console.log(`Unificando conversa ${other.id} na conversa oficial ${targetConv.id}...`);

                // Mover mensagens
                await client.query(
                    'UPDATE public.whatsapp_messages SET conversation_id = $1, user_id = $2 WHERE conversation_id = $3',
                    [targetConv.id, doctorId, other.id]
                );

                // Deletar análise duplicada se existir
                await client.query('DELETE FROM public.whatsapp_conversation_analysis WHERE conversation_id = $1', [other.id]);

                // Deletar a duplicada
                await client.query('DELETE FROM public.whatsapp_conversations WHERE id = $1', [other.id]);
            }
        }

        // 3. Garantir que todas as conversas do número pertençam ao médico
        await client.query(
            'UPDATE public.whatsapp_conversations SET user_id = $1 WHERE phone_number = $2',
            [doctorId, phoneNumber]
        );

        console.log('✓ Tudo unificado e transferido para o médico!');
    } catch (e) {
        console.error('Erro:', e.message);
    } finally {
        await client.end();
    }
}

fixEverything();
