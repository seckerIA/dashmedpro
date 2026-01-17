/**
 * Configuração centralizada para scripts de manutenção
 * Usa variáveis de ambiente do arquivo .env
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar .env do diretório scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Validar variáveis obrigatórias
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas!');
    console.error('');
    console.error('Configure o arquivo scripts/.env com:');
    console.error('  SUPABASE_URL=https://adzaqkduxnpckbcuqpmg.supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
    console.error('');
    console.error('Copie de scripts/.env.example');
    process.exit(1);
}

// Cliente Supabase com service role
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Exportar URL para uso em scripts
export { SUPABASE_URL };

console.log('✅ Conectado ao Supabase:', SUPABASE_URL);
