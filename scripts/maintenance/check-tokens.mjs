import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function checkAllConfigs() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Conectado ao banco\n');

        const result = await client.query(
            'SELECT id, user_id, phone_number_id, display_phone_number, is_active, access_token FROM public.whatsapp_config'
        );

        console.log(`Encontradas ${result.rows.length} configurações:`);
        result.rows.forEach(row => {
            console.log(`- Config ID: ${row.id}`);
            console.log(`  User ID: ${row.user_id}`);
            console.log(`  Phone Number ID: ${row.phone_number_id}`);
            console.log(`  Ativo: ${row.is_active}`);
            console.log(`  Possui Access Token: ${row.access_token ? 'SIM (tamanho: ' + row.access_token.length + ')' : 'NÃO (null ou vazio)'}`);
            console.log('---');
        });

        // Também verificar quem é o dono da conversa mencionada pelo usuário se possível
        const convId = 'd08ab726-26b2-4b98-b3f3-bd06a59c813a';
        const convResult = await client.query(
            'SELECT id, user_id, contact_name, phone_number FROM public.whatsapp_conversations WHERE id = $1',
            [convId]
        );

        if (convResult.rows.length > 0) {
            console.log('\nDados da conversa d08ab726-26b2-4b98-b3f3-bd06a59c813a:');
            console.log(JSON.stringify(convResult.rows[0], null, 2));

            const ownerId = convResult.rows[0].user_id;
            const ownerConfig = await client.query(
                'SELECT id, is_active, access_token FROM public.whatsapp_config WHERE user_id = $1',
                [ownerId]
            );

            console.log(`\nConfiguração do dono da conversa (${ownerId}):`);
            if (ownerConfig.rows.length > 0) {
                console.log(JSON.stringify({
                    id: ownerConfig.rows[0].id,
                    is_active: ownerConfig.rows[0].is_active,
                    has_token: !!ownerConfig.rows[0].access_token
                }, null, 2));
            } else {
                console.log('Nenhuma configuração encontrada para este dono.');
            }
        }

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await client.end();
    }
}

checkAllConfigs();
