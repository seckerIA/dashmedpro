import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function listAndLink() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando...');
    await client.connect();

    // Listar secretarias
    console.log('\n1. Secretarias:');
    const secretarias = await client.query(`
      SELECT id, full_name, email FROM profiles WHERE role = 'secretaria' AND is_active = true
    `);
    secretarias.rows.forEach(s => console.log('   ID:', s.id, '|', s.full_name, '(' + s.email + ')'));

    // Listar medicos
    console.log('\n2. Medicos:');
    const medicos = await client.query(`
      SELECT id, full_name, email FROM profiles
      WHERE role IN ('medico', 'admin', 'dono') AND is_active = true
    `);
    medicos.rows.forEach(m => console.log('   ID:', m.id, '|', m.full_name, '(' + m.email + ')'));

    // Vincular TODAS as secretarias a TODOS os medicos
    if (secretarias.rows.length > 0 && medicos.rows.length > 0) {
      console.log('\n3. Criando vinculos...');

      for (const secretaria of secretarias.rows) {
        for (const medico of medicos.rows) {
          try {
            await client.query(`
              INSERT INTO secretary_doctor_links (secretary_id, doctor_id)
              VALUES ($1, $2)
              ON CONFLICT (secretary_id, doctor_id) DO NOTHING
            `, [secretaria.id, medico.id]);
            console.log('   Vinculado:', secretaria.full_name, '->', medico.full_name);
          } catch (e) {
            console.log('   Erro ao vincular:', e.message);
          }
        }
      }
    }

    // Verificar vinculos criados
    console.log('\n4. Vinculos criados:');
    const links = await client.query(`
      SELECT
        sec.full_name as secretary_name,
        doc.full_name as doctor_name
      FROM secretary_doctor_links sdl
      JOIN profiles sec ON sec.id = sdl.secretary_id
      JOIN profiles doc ON doc.id = sdl.doctor_id
    `);
    links.rows.forEach(l => console.log('   ', l.secretary_name, '->', l.doctor_name));

    console.log('\nPronto! Secretarias vinculadas a todos os medicos.');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

listAndLink();
