import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = "Dashmedpro2026@";
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function addAguardandoRetorno() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('Conectado!\n');

    // Verificar valores atuais do enum
    console.log('1. Verificando valores atuais do enum crm_pipeline_stage...');
    const currentValues = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'crm_pipeline_stage'::regtype
      ORDER BY enumsortorder
    `);
    console.log('Valores atuais:', currentValues.rows.map(r => r.enumlabel).join(', '));

    // Adicionar aguardando_retorno se não existir
    console.log('\n2. Adicionando "aguardando_retorno" ao enum...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'aguardando_retorno'
          AND enumtypid = 'crm_pipeline_stage'::regtype
        ) THEN
          ALTER TYPE crm_pipeline_stage ADD VALUE 'aguardando_retorno';
          RAISE NOTICE 'Valor aguardando_retorno adicionado com sucesso';
        ELSE
          RAISE NOTICE 'Valor aguardando_retorno já existe';
        END IF;
      END $$;
    `);

    // Verificar novamente
    console.log('\n3. Verificando valores após adição...');
    const newValues = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'crm_pipeline_stage'::regtype
      ORDER BY enumsortorder
    `);
    console.log('Valores atualizados:', newValues.rows.map(r => r.enumlabel).join(', '));

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addAguardandoRetorno();
