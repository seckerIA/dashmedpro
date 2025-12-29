import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Database connection - use the database password from Supabase dashboard
// Project: adzaqkduxnpckbcuqpmg
// Direct connection (port 5432) instead of pooler (6543)
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Read migration file for commercial procedures FK
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251229000000_add_commercial_procedures_profiles_fk.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executando migração de FK para commercial_procedures...');
    await client.query(sql);
    console.log('✅ Migração executada com sucesso!');
    console.log('📋 Foreign keys adicionadas para permitir joins com profiles.');

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
