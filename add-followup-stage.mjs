import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function addFollowUpStage() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando...');
    await client.connect();

    // Adicionar follow_up ao enum
    console.log('Adicionando follow_up ao enum...');
    await client.query(`ALTER TYPE crm_pipeline_stage ADD VALUE IF NOT EXISTS 'follow_up'`);
    console.log('follow_up adicionado!');

    // Verificar
    const enumResult = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = 'crm_pipeline_stage'::regtype
      ORDER BY enumsortorder
    `);
    console.log('\nEstágios do pipeline:');
    enumResult.rows.forEach(e => console.log('   -', e.enumlabel));

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

addFollowUpStage();
