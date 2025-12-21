import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Database connection (password URL-encoded: @ becomes %40)
// Using port 6543 (pooler) instead of 5432 (direct)
const connectionString = 'postgresql://postgres:Vq79qn7t%4096037951aA@db.adzaqkduxnpckbcuqpmg.supabase.co:6543/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251221000001_fix_crm_rls_for_dono.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executando migration...\n');
    
    // Executar todo o SQL de uma vez
    await client.query(sql);
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log('📋 Políticas RLS corrigidas para permitir admin/dono ver todos os dados.');

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    if (error.detail) console.error('Detalhes:', error.detail);
    if (error.position) console.error('Posição do erro:', error.position);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

applyMigration();
