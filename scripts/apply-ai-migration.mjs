import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration(fileName) {
    const client = new Client({
        user: 'postgres.adzaqkduxnpckbcuqpmg', // Try pooled user format
        host: 'aws-0-us-west-1.pooler.supabase.com', // Pooled host
        database: 'postgres',
        password: 'Vq79qn7t@96037951aA',
        port: 6543,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`🔌 Conectando para aplicar ${fileName}...`);
        await client.connect();
        console.log('✅ Conectado!');

        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', fileName);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`🚀 Executando SQL...`);
        await client.query(sql);
        console.log(`✅ ${fileName} aplicado com sucesso!`);

    } catch (error) {
        console.error(`❌ Erro em ${fileName}:`, error.message);
    } finally {
        await client.end();
    }
}

async function main() {
    await runMigration('20260102000001_whatsapp_lead_analysis.sql');
    await runMigration('20260102000002_secretary_leads_patients_access.sql');
    await runMigration('20260102000003_fix_ai_rpc_and_columns.sql');
}

main();
