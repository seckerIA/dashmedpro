import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function checkConfig() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao banco\n');

    const result = await client.query(
      'SELECT id, user_id, phone_number_id, display_phone_number, is_active FROM public.whatsapp_config WHERE phone_number_id = $1',
      ['994951350357570']
    );

    if (result.rows.length > 0) {
      console.log('✓ Configuração encontrada:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('\n✓ Phone Number ID está cadastrado e', result.rows[0].is_active ? 'ATIVO' : 'INATIVO');
    } else {
      console.log('✗ ERRO: Phone Number ID 994951350357570 NÃO está cadastrado!');
      console.log('Você precisa primeiro validar as credenciais no frontend.');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkConfig();
