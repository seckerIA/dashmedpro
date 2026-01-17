/**
 * Script para verificar políticas RLS
 * Uso: node check-rls.mjs
 */
import { supabaseAdmin } from './config.mjs';

async function checkRLS() {
    try {
        console.log('🔍 Verificando políticas RLS...\n');

        // Buscar todas as políticas
        const { data, error } = await supabaseAdmin.rpc('get_all_policies');

        if (error) {
            // Fallback: query direta
            const { data: policies, error: queryError } = await supabaseAdmin
                .from('pg_policies')
                .select('*');

            if (queryError) {
                console.log('⚠️  Não foi possível listar políticas via RPC');
                console.log('   Use o Dashboard do Supabase para verificar');
                return;
            }
        }

        console.log('✅ Políticas encontradas:', data?.length || 0);

        if (data) {
            data.forEach(p => {
                console.log(`  - ${p.tablename}: ${p.policyname}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

checkRLS();
