/**
 * Script de Migração via Supabase REST API
 * Usa a API REST do Supabase para copiar dados (não requer conexão direta PostgreSQL)
 */

import { createClient } from '@supabase/supabase-js';

// FONTE (Produção) - usando service_role para bypass RLS
const SOURCE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SOURCE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

// DESTINO (Backup/Dev)
const DEST_URL = 'https://puylqvsnooquefkingki.supabase.co';
const DEST_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1eWxxdnNub29xdWVma2luZ2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwODI0MSwiZXhwIjoyMDg1Mzg0MjQxfQ.PoQHyK3CbjkfI3iWLxsgo92YDAoX5g0CsT9E7z9SxLE';

// Criar clientes (usando service_role para bypass RLS)
const sourceClient = createClient(SOURCE_URL, SOURCE_SERVICE_KEY);
const destClient = createClient(DEST_URL, DEST_SERVICE_KEY);

// Lista de tabelas para migrar (ordem importante para FKs)
const TABLES = [
  'organizations',
  'profiles',
  'crm_contacts',
  'organization_members',
  'secretary_doctor_links',
  'crm_deals',
  'crm_activities',
  'medical_appointments',
  'medical_records',
  'medical_prescriptions',
  'medical_attachments',
  'financial_accounts',
  'financial_categories',
  'financial_transactions',
  'financial_recurring',
  'inventory_suppliers',
  'inventory_items',
  'inventory_batches',
  'inventory_movements',
  'commercial_leads',
  'commercial_calls',
  'commercial_procedures',
  'commercial_quotations',
  'commercial_campaigns',
  'commercial_utm_links',
  'tasks',
  'task_comments',
  'task_attachments',
  'whatsapp_config',
  'whatsapp_conversations',
  'whatsapp_messages',
  'whatsapp_media',
  'whatsapp_templates',
  'whatsapp_quick_replies',
  'whatsapp_internal_notes',
  'whatsapp_conversation_analysis',
  'whatsapp_ai_suggestions',
  'whatsapp_ai_config',
  'specialty_procedures',
  'onboarding_state',
  'allowed_emails',
  'patients',
];

async function migrateTable(tableName) {
  console.log(`\n📦 Migrando tabela: ${tableName}`);

  try {
    // Buscar dados da fonte (limite de 10000 por vez)
    const { data: sourceData, error: fetchError } = await sourceClient
      .from(tableName)
      .select('*')
      .limit(10000);

    if (fetchError) {
      // Tabela pode não existir ou não ter permissão
      if (fetchError.message.includes('does not exist') || fetchError.code === '42P01') {
        console.log(`  ⚠️ Tabela não existe na fonte`);
        return { table: tableName, status: 'not_found', count: 0 };
      }
      console.log(`  ⚠️ Erro ao ler: ${fetchError.message}`);
      return { table: tableName, status: 'error', error: fetchError.message };
    }

    if (!sourceData || sourceData.length === 0) {
      console.log(`  ℹ️ Tabela vazia`);
      return { table: tableName, status: 'empty', count: 0 };
    }

    console.log(`  📊 Encontrados ${sourceData.length} registros`);

    // Inserir no destino em lotes
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);

      const { error: insertError } = await destClient
        .from(tableName)
        .upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.log(`\n  ⚠️ Erro no batch ${i}-${i+batchSize}: ${insertError.message.substring(0, 80)}`);
        // Tentar inserir um por um
        for (const record of batch) {
          try {
            const { error: singleError } = await destClient
              .from(tableName)
              .upsert(record, { onConflict: 'id' });
            if (!singleError) inserted++;
          } catch (e) {
            // Ignorar erros individuais
          }
        }
      } else {
        inserted += batch.length;
      }

      process.stdout.write(`\r  ⏳ Progresso: ${inserted}/${sourceData.length}`);
    }

    console.log(`\n  ✅ Inseridos: ${inserted} registros`);
    return { table: tableName, status: 'success', count: inserted };

  } catch (err) {
    console.log(`  ❌ Exceção: ${err.message}`);
    return { table: tableName, status: 'exception', error: err.message };
  }
}

async function main() {
  console.log('🚀 Iniciando migração via Supabase REST API...\n');
  console.log(`📤 Fonte: ${SOURCE_URL}`);
  console.log(`📥 Destino: ${DEST_URL}`);

  // Teste de conexão
  console.log('\n🔗 Testando conexões...');

  const { data: sourceTest, error: sourceErr } = await sourceClient.from('profiles').select('id').limit(1);
  if (sourceErr) {
    console.log(`❌ Erro na fonte: ${sourceErr.message}`);
  } else {
    console.log('✅ Fonte OK');
  }

  const { data: destTest, error: destErr } = await destClient.from('profiles').select('id').limit(1);
  if (destErr && !destErr.message.includes('does not exist')) {
    console.log(`❌ Erro no destino: ${destErr.message}`);
  } else {
    console.log('✅ Destino OK');
  }

  const results = [];

  for (const table of TABLES) {
    const result = await migrateTable(table);
    results.push(result);

    // Pequeno delay para evitar rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  // Resumo
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('='.repeat(50));

  const success = results.filter(r => r.status === 'success');
  const empty = results.filter(r => r.status === 'empty');
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error' || r.status === 'exception');

  console.log(`✅ Sucesso: ${success.length} tabelas (${success.reduce((a, b) => a + b.count, 0)} registros)`);
  console.log(`ℹ️ Vazias: ${empty.length} tabelas`);
  console.log(`🔍 Não encontradas: ${notFound.length} tabelas`);
  console.log(`❌ Erros: ${errors.length} tabelas`);

  if (errors.length > 0) {
    console.log('\nTabelas com erro:');
    errors.forEach(e => console.log(`  - ${e.table}: ${e.error?.substring(0, 80)}`));
  }

  console.log('\n✨ Migração concluída!');
}

main().catch(console.error);
