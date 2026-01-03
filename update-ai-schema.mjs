import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'Dashmedpro2026@';
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function updateSchema() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('Adicionando colunas à whatsapp_ai_config...');

        await client.query(`
      ALTER TABLE public.whatsapp_ai_config 
      ADD COLUMN IF NOT EXISTS knowledge_base TEXT,
      ADD COLUMN IF NOT EXISTS already_known_info TEXT,
      ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS custom_prompt_instructions TEXT;
    `);

        console.log('✓ Colunas adicionadas com sucesso!');
    } catch (e) {
        console.error('Erro ao atualizar schema:', e.message);
    } finally {
        await client.end();
    }
}
updateSchema();
