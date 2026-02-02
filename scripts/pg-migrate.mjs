/**
 * Script de Migração PostgreSQL Direto
 * Copia schema e dados do Supabase fonte para destino
 */

import pg from 'pg';
const { Client } = pg;

// Configurações de conexão direta
const SOURCE_CONFIG = {
  connectionString: 'postgresql://postgres:Dashmedpro2026%40@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

const DEST_CONFIG = {
  connectionString: 'postgresql://postgres:xOZC9JeR25TrmSz9@db.puylqvsnooquefkingki.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

async function getPublicTables(client) {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(r => r.table_name);
}

async function copyTableData(sourceClient, destClient, tableName) {
  console.log(`\n📦 Copiando tabela: ${tableName}`);

  try {
    // Contar registros na fonte
    const countResult = await sourceClient.query(`SELECT COUNT(*) as count FROM public."${tableName}"`);
    const totalRows = parseInt(countResult.rows[0].count);

    if (totalRows === 0) {
      console.log(`  ℹ️ Tabela vazia`);
      return { table: tableName, status: 'empty', count: 0 };
    }

    console.log(`  📊 Total: ${totalRows} registros`);

    // Buscar todos os dados
    const dataResult = await sourceClient.query(`SELECT * FROM public."${tableName}"`);
    const rows = dataResult.rows;

    if (rows.length === 0) {
      return { table: tableName, status: 'empty', count: 0 };
    }

    // Obter nomes das colunas
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');

    // Inserir em lotes
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // Criar INSERT com múltiplos VALUES
      const valuePlaceholders = batch.map((_, rowIdx) => {
        const placeholders = columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`);
        return `(${placeholders.join(', ')})`;
      }).join(', ');

      const values = batch.flatMap(row => columns.map(col => row[col]));

      const insertQuery = `
        INSERT INTO public."${tableName}" (${columnList})
        VALUES ${valuePlaceholders}
        ON CONFLICT DO NOTHING
      `;

      try {
        await destClient.query(insertQuery, values);
        inserted += batch.length;
        process.stdout.write(`\r  ⏳ Progresso: ${inserted}/${totalRows}`);
      } catch (err) {
        console.log(`\n  ⚠️ Erro no batch: ${err.message.substring(0, 100)}`);
      }
    }

    console.log(`\n  ✅ Inseridos: ${inserted} registros`);
    return { table: tableName, status: 'success', count: inserted };

  } catch (err) {
    console.log(`  ❌ Erro: ${err.message}`);
    return { table: tableName, status: 'error', error: err.message };
  }
}

async function copyEnumTypes(sourceClient, destClient) {
  console.log('\n🔷 Copiando tipos ENUM...');

  const enumsResult = await sourceClient.query(`
    SELECT t.typname as enum_name,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  `);

  for (const enumType of enumsResult.rows) {
    const { enum_name, enum_values } = enumType;
    const valuesList = enum_values.map(v => `'${v}'`).join(', ');

    try {
      await destClient.query(`
        DO $$ BEGIN
          CREATE TYPE public."${enum_name}" AS ENUM (${valuesList});
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log(`  ✅ ENUM: ${enum_name}`);
    } catch (err) {
      console.log(`  ⚠️ ENUM ${enum_name}: ${err.message.substring(0, 50)}`);
    }
  }
}

async function disableTriggers(client) {
  console.log('\n⚙️ Desabilitando triggers temporariamente...');
  await client.query('SET session_replication_role = replica;');
}

async function enableTriggers(client) {
  console.log('\n⚙️ Reabilitando triggers...');
  await client.query('SET session_replication_role = DEFAULT;');
}

async function main() {
  console.log('🚀 Iniciando migração PostgreSQL direta...\n');

  const sourceClient = new Client(SOURCE_CONFIG);
  const destClient = new Client(DEST_CONFIG);

  try {
    console.log('📤 Conectando ao banco FONTE...');
    await sourceClient.connect();
    console.log('✅ Conectado ao fonte');

    console.log('📥 Conectando ao banco DESTINO...');
    await destClient.connect();
    console.log('✅ Conectado ao destino');

    await disableTriggers(destClient);
    await copyEnumTypes(sourceClient, destClient);

    const tables = await getPublicTables(sourceClient);
    console.log(`\n📋 Encontradas ${tables.length} tabelas no schema public`);

    const results = [];
    for (const table of tables) {
      const result = await copyTableData(sourceClient, destClient, table);
      results.push(result);
    }

    await enableTriggers(destClient);

    console.log('\n\n' + '='.repeat(50));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(50));

    const success = results.filter(r => r.status === 'success');
    const empty = results.filter(r => r.status === 'empty');
    const errors = results.filter(r => r.status === 'error');

    console.log(`✅ Sucesso: ${success.length} tabelas (${success.reduce((a, b) => a + b.count, 0)} registros)`);
    console.log(`ℹ️ Vazias: ${empty.length} tabelas`);
    console.log(`❌ Erros: ${errors.length} tabelas`);

    if (errors.length > 0) {
      console.log('\nTabelas com erro:');
      errors.forEach(e => console.log(`  - ${e.table}: ${e.error?.substring(0, 80)}`));
    }

    console.log('\n✨ Migração concluída!');

  } catch (err) {
    console.error('\n❌ Erro fatal:', err.message);
  } finally {
    await sourceClient.end();
    await destClient.end();
  }
}

main();
