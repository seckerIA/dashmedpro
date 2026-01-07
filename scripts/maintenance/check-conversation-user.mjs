import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function checkConversation() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Conectado\n');

    const result = await client.query(
      'SELECT id, user_id, phone_number, contact_name FROM public.whatsapp_conversations WHERE id = $1',
      ['472f4916-1468-4eee-a567-705c8742d42d']
    );

    if (result.rows.length > 0) {
      console.log('Conversa encontrada:');
      console.log(JSON.stringify(result.rows[0], null, 2));

      // Buscar info do usuário
      const userResult = await client.query(
        'SELECT id, email FROM auth.users WHERE id = $1',
        [result.rows[0].user_id]
      );

      console.log('\nUsuário dono da conversa:');
      console.log(JSON.stringify(userResult.rows[0], null, 2));
    } else {
      console.log('Conversa NÃO encontrada!');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkConversation();
