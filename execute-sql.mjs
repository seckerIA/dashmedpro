import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function executeSql() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Executar migrations de sinal
    console.log('1. Adicionando campos de sinal em medical_appointments...');
    await client.query(`
      ALTER TABLE public.medical_appointments
        ADD COLUMN IF NOT EXISTS sinal_amount DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS sinal_paid BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS sinal_receipt_url TEXT,
        ADD COLUMN IF NOT EXISTS sinal_paid_at TIMESTAMPTZ;
    `);
    console.log('   ✅ Colunas de sinal adicionadas!');

    // Criar índice
    console.log('2. Criando índice para consultas com sinal...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_medical_appointments_sinal_paid
      ON public.medical_appointments(sinal_paid)
      WHERE sinal_amount IS NOT NULL AND sinal_amount > 0;
    `);
    console.log('   ✅ Índice criado!');

    // Adicionar campo sinal em commercial_procedures
    console.log('3. Adicionando campo sinal_percentage em commercial_procedures...');
    await client.query(`
      ALTER TABLE public.commercial_procedures
        ADD COLUMN IF NOT EXISTS sinal_percentage DECIMAL(5,2) DEFAULT 0;
    `);
    console.log('   ✅ Coluna sinal_percentage adicionada!');

    // Verificar colunas
    console.log('\n=== Verificação ===');
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'medical_appointments'
      AND column_name LIKE 'sinal%'
    `);
    console.log('Colunas de sinal em medical_appointments:');
    columnsResult.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

    const procColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'commercial_procedures'
      AND column_name LIKE 'sinal%'
    `);
    console.log('\nColunas de sinal em commercial_procedures:');
    procColumnsResult.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

    console.log('\n✅ Tudo pronto!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

executeSql();
