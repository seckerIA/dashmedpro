import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Conexão direta ao banco (sem pooler)
const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function runMigration(fileName) {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`\n🔌 Conectando para aplicar ${fileName}...`);
        await client.connect();
        console.log('✅ Conectado!');

        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', fileName);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`🚀 Executando SQL (${sql.length} caracteres)...`);
        await client.query(sql);
        console.log(`✅ ${fileName} aplicado com sucesso!`);

    } catch (error) {
        console.error(`❌ Erro em ${fileName}:`, error.message);
        if (error.detail) console.error('   Detalhe:', error.detail);
    } finally {
        await client.end();
    }
}

async function main() {
    console.log('🚀 Aplicando migrations de IA do WhatsApp...\n');

    await runMigration('20260102000001_whatsapp_lead_analysis.sql');
    await runMigration('20260102000002_secretary_leads_patients_access.sql');
    await runMigration('20260102000003_fix_ai_rpc_and_columns.sql');

    console.log('\n✅ Todas as migrations processadas!');
}

main();
