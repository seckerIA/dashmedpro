import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function checkRLS() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando...');
    await client.connect();
    console.log('Conectado!\n');

    // 1. Verificar políticas RLS na tabela medical_appointments
    console.log('=== 1. Políticas RLS em medical_appointments ===');
    const policiesResult = await client.query(`
      SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as qual
      FROM pg_policy
      WHERE polrelid = 'public.medical_appointments'::regclass
    `);
    console.log('Políticas encontradas:', policiesResult.rows.length);
    const cmdMap = {a: 'ALL', r: 'SELECT', w: 'UPDATE', d: 'DELETE'};
    policiesResult.rows.forEach((p, i) => {
      console.log(`\n  ${i+1}. ${p.polname}`);
      console.log(`     Comando: ${cmdMap[p.polcmd] || p.polcmd}`);
      console.log(`     Condição: ${p.qual ? p.qual.substring(0, 300) : 'N/A'}`);
    });

    // 2. Verificar secretária
    console.log('\n\n=== 2. Verificando secretária ===');
    const secretaria = await client.query(`
      SELECT id, full_name, email, role FROM profiles WHERE role = 'secretaria' LIMIT 1
    `);
    if (secretaria.rows.length > 0) {
      console.log('Secretária:', secretaria.rows[0].full_name);
      console.log('ID:', secretaria.rows[0].id);
    }

    // 3. Testar se secretária pode atualizar appointments
    console.log('\n\n=== 3. Testando permissões da secretária ===');
    // Buscar uma consulta qualquer
    const appointments = await client.query(`
      SELECT id, title, sinal_paid FROM medical_appointments LIMIT 3
    `);
    console.log('Consultas encontradas:', appointments.rows.length);
    appointments.rows.forEach(a => {
      console.log(`  - ${a.id.substring(0, 8)}... | ${a.title} | sinal_paid: ${a.sinal_paid}`);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkRLS();
