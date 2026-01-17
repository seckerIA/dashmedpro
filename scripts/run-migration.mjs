/**
 * Script para executar migrations manuais
 * Uso: node run-migration.mjs "SELECT 1"
 */
import { supabaseAdmin } from './config.mjs';

async function runMigration() {
    const sql = process.argv[2];

    if (!sql) {
        console.error('❌ Uso: node run-migration.mjs "SQL QUERY"');
        console.error('   Exemplo: node run-migration.mjs "SELECT * FROM profiles LIMIT 5"');
        process.exit(1);
    }

    try {
        console.log('🔧 Executando SQL...\n');
        console.log('Query:', sql);
        console.log('');

        const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });

        if (error) {
            // Tentar via REST direto
            const response = await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ query: sql })
                }
            );

            if (!response.ok) {
                console.log('⚠️  Função RPC não disponível. Use o SQL Editor do Supabase.');
                console.log('   Dashboard → SQL Editor → Cole a query');
                return;
            }
        }

        console.log('✅ Executado com sucesso!');
        if (data) {
            console.log('Resultado:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

runMigration();
