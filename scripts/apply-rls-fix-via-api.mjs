import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  try {
    console.log('🔧 Aplicando correções RLS via Supabase API...\n');

    // Como não podemos executar DDL diretamente via API, vamos criar uma função SQL
    // que será executada usando rpc() ou vamos aplicar manualmente via SQL Editor
    
    console.log('⚠️  DDL statements (DROP/CREATE POLICY) não podem ser executados via API REST.');
    console.log('📋 É necessário aplicar manualmente via Supabase Dashboard SQL Editor.\n');
    
    console.log('📄 Conteúdo da migration para copiar:\n');
    console.log('─'.repeat(80));
    
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251221000001_fix_crm_rls_for_dono.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log(sql);
    console.log('─'.repeat(80));
    
    console.log('\n📋 INSTRUÇÕES:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/sql/new');
    console.log('2. Copie o SQL acima');
    console.log('3. Cole no editor SQL');
    console.log('4. Clique em "Run"');
    
    // Tentar verificar se as policies existem antes
    console.log('\n🔍 Verificando policies atuais...\n');
    
    // Verificar se a função is_admin_or_dono existe
    const { data: funcCheck, error: funcError } = await supabase.rpc('is_admin_or_dono', { _user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (funcError && funcError.message.includes('function') && funcError.message.includes('does not exist')) {
      console.log('⚠️  Função is_admin_or_dono não encontrada. A migration pode falhar.');
      console.log('   Certifique-se de que a função existe no banco antes de executar a migration.\n');
    } else {
      console.log('✅ Função is_admin_or_dono existe.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

applyRLSFix();

