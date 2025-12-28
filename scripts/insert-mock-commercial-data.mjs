/**
 * Script para inserir dados fictícios para testar métricas KPI comerciais
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Database connection
const connectionString = 'postgresql://postgres:Vq79qn7t%4096037951aA@db.adzaqkduxnpckbcuqpmg.supabase.co:6543/postgres';

async function insertMockData() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Primeiro, buscar um user_id existente
    const { rows: users } = await client.query('SELECT id FROM auth.users LIMIT 1');
    if (users.length === 0) {
      console.error('❌ Nenhum usuário encontrado. Crie um usuário primeiro.');
      return;
    }
    const userId = users[0].id;
    console.log('👤 Usando user_id:', userId);

    // 1. Criar contatos fictícios
    console.log('📝 Criando contatos fictícios...');
    const contacts = [];
    for (let i = 1; i <= 10; i++) {
      const { rows } = await client.query(`
        INSERT INTO public.crm_contacts (user_id, full_name, email, phone, company)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        userId,
        `Cliente Teste ${i}`,
        `cliente${i}@teste.com`,
        `1198765432${i}`,
        `Empresa ${i}`
      ]);
      contacts.push(rows[0].id);
    }
    console.log(`✅ ${contacts.length} contatos criados`);

    // 2. Criar deals fictícios
    console.log('💼 Criando deals fictícios...');
    const deals = [];
    const stages = ['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao', 'fechado_ganho'];
    for (let i = 0; i < 20; i++) {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const value = Math.floor(Math.random() * 10000) + 1000;
      const { rows } = await client.query(`
        INSERT INTO public.crm_deals (user_id, contact_id, title, value, stage, probability)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        userId,
        contacts[Math.floor(Math.random() * contacts.length)],
        `Deal ${i + 1} - ${stage}`,
        value,
        stage,
        Math.floor(Math.random() * 100)
      ]);
      deals.push(rows[0].id);
    }
    console.log(`✅ ${deals.length} deals criados`);

    // 3. Criar leads comerciais
    console.log('🎯 Criando leads comerciais...');
    const leads = [];
    const origins = ['google', 'instagram', 'facebook', 'indication', 'website'];
    for (let i = 0; i < 15; i++) {
      const { rows } = await client.query(`
        INSERT INTO public.commercial_leads (user_id, name, email, phone, origin, status, estimated_value)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        userId,
        `Lead ${i + 1}`,
        `lead${i + 1}@teste.com`,
        `1198765432${i}`,
        origins[Math.floor(Math.random() * origins.length)],
        ['new', 'contacted', 'qualified', 'converted'][Math.floor(Math.random() * 4)],
        Math.floor(Math.random() * 5000) + 500
      ]);
      leads.push(rows[0].id);
    }
    console.log(`✅ ${leads.length} leads criados`);

    // 4. Criar vendas comerciais
    console.log('💰 Criando vendas comerciais...');
    const sales = [];
    const statuses = ['quote', 'confirmed', 'completed'];
    for (let i = 0; i < 12; i++) {
      const value = Math.floor(Math.random() * 8000) + 1000;
      const { rows } = await client.query(`
        INSERT INTO public.commercial_sales (user_id, lead_id, value, status, sale_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        userId,
        leads[Math.floor(Math.random() * leads.length)],
        value,
        statuses[Math.floor(Math.random() * statuses.length)],
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      ]);
      sales.push(rows[0].id);
    }
    console.log(`✅ ${sales.length} vendas criadas`);

    // 5. Criar consultas médicas
    console.log('🏥 Criando consultas médicas...');
    const appointments = [];
    for (let i = 0; i < 8; i++) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 30));
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);
      
      const { rows } = await client.query(`
        INSERT INTO public.medical_appointments (
          user_id, contact_id, title, appointment_type, status, 
          start_time, end_time, duration_minutes, estimated_value, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        userId,
        contacts[Math.floor(Math.random() * contacts.length)],
        `Consulta ${i + 1}`,
        ['first_visit', 'return', 'procedure'][Math.floor(Math.random() * 3)],
        ['scheduled', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
        startTime.toISOString(),
        endTime.toISOString(),
        30,
        Math.floor(Math.random() * 500) + 200,
        ['pending', 'paid'][Math.floor(Math.random() * 2)]
      ]);
      appointments.push(rows[0].id);
    }
    console.log(`✅ ${appointments.length} consultas criadas`);

    console.log('\n✅ Dados fictícios inseridos com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - Contatos: ${contacts.length}`);
    console.log(`   - Deals: ${deals.length}`);
    console.log(`   - Leads: ${leads.length}`);
    console.log(`   - Vendas: ${sales.length}`);
    console.log(`   - Consultas: ${appointments.length}`);

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error.message);
    if (error.detail) console.error('Detalhes:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

insertMockData();









