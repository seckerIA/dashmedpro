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

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000000_create_medical_appointments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executando migração...');
    await client.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('📋 Tabela medical_appointments criada com ENUMs, índices, RLS e triggers.');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    if (error.detail) console.error('Detalhes:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

runMigration();
