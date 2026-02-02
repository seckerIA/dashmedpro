/**
 * Obtém o schema completo do Supabase fonte via REST API
 * e gera SQL para aplicar no destino
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SOURCE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SOURCE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const sourceClient = createClient(SOURCE_URL, SOURCE_SERVICE_KEY);

async function getTableColumns(tableName) {
  const { data, error } = await sourceClient.rpc('get_table_columns', { p_table_name: tableName });
  if (error) {
    // Fallback: query information_schema directly
    const { data: cols, error: err2 } = await sourceClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, udt_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    return cols || [];
  }
  return data || [];
}

async function getAllTables() {
  // Get tables from a known working query
  const tables = [
    'organizations', 'profiles', 'organization_members', 'crm_contacts',
    'crm_deals', 'crm_activities', 'secretary_doctor_links',
    'medical_appointments', 'medical_records',
    'financial_accounts', 'financial_categories', 'financial_transactions',
    'inventory_suppliers', 'inventory_items', 'inventory_batches', 'inventory_movements',
    'commercial_leads', 'commercial_procedures', 'commercial_campaigns',
    'tasks', 'task_attachments',
    'whatsapp_config', 'whatsapp_conversations', 'whatsapp_messages', 'whatsapp_media',
    'whatsapp_templates', 'whatsapp_internal_notes', 'whatsapp_conversation_analysis',
    'whatsapp_ai_suggestions', 'whatsapp_ai_config',
    'specialty_procedures', 'onboarding_state', 'allowed_emails'
  ];
  return tables;
}

async function introspectSchema() {
  console.log('🔍 Introspecting source database schema...\n');

  // Get one record from each table to see the actual columns
  const tables = await getAllTables();
  const schema = {};

  for (const table of tables) {
    console.log(`📋 Checking ${table}...`);

    const { data, error } = await sourceClient
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`  ⚠️ Error: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      schema[table] = {
        columns,
        sampleData: data[0]
      };
      console.log(`  ✅ Found ${columns.length} columns`);
    } else {
      // Table exists but is empty, try to get structure differently
      schema[table] = { columns: [], empty: true };
      console.log(`  ℹ️ Empty table`);
    }
  }

  // Save schema info
  const outputPath = 'scripts/source_schema.json';
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
  console.log(`\n📁 Schema saved to ${outputPath}`);

  // Generate column list for debugging
  console.log('\n\n=== SCHEMA SUMMARY ===\n');
  for (const [table, info] of Object.entries(schema)) {
    if (info.columns && info.columns.length > 0) {
      console.log(`${table}: ${info.columns.join(', ')}`);
    }
  }
}

introspectSchema().catch(console.error);
