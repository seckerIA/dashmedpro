import pg from 'pg';

const { Client } = pg;

async function checkPolicies() {
    const client = new Client({
        user: 'postgres',
        host: 'db.adzaqkduxnpckbcuqpmg.supabase.co',
        database: 'postgres',
        password: 'Vq79qn7t@96037951aA',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- RLS Policies for commercial_leads ---');
        const { rows: policies } = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'commercial_leads'
    `);
        console.table(policies);

        console.log('\n--- RLS Policies for commercial_procedures ---');
        const { rows: pPolicies } = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'commercial_procedures'
    `);
        console.table(pPolicies);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkPolicies();
