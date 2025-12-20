import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de nomes brasileiros para geração de dados fictícios
const FIRST_NAMES = [
  'Ana', 'Maria', 'Fernanda', 'Juliana', 'Patrícia', 'Mariana', 'Carla', 'Beatriz',
  'João', 'Pedro', 'Carlos', 'Lucas', 'Rafael', 'Gabriel', 'Bruno', 'Felipe',
  'Paulo', 'Ricardo', 'Marcos', 'André', 'Rodrigo', 'Daniel', 'Thiago', 'Gustavo'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Lima', 'Araújo', 'Ferreira', 'Carvalho', 'Gomes', 'Martins', 'Rocha',
  'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Barbosa', 'Dias'
];

// Função para gerar nome completo
function generateFullName() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Função para gerar telefone brasileiro
function generatePhone() {
  const ddd = ['11', '21', '31', '41', '47', '48', '51', '61'].sort(() => Math.random() - 0.5)[0];
  const number = Math.floor(100000000 + Math.random() * 900000000);
  return `${ddd}${number}`;
}

// Função para gerar email
function generateEmail(name) {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com.br', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const username = name.toLowerCase().replace(/\s+/g, '.');
  return `${username}@${domain}`;
}

// Função para gerar data aleatória no período
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Função para distribuir dados temporalmente
function getRandomDateInPeriod(period) {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 2);
  
  if (period === 'month1') {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return randomDate(start, end);
  } else if (period === 'month2') {
    const start2 = new Date(start);
    start2.setMonth(start2.getMonth() + 1);
    const end2 = new Date(now);
    end2.setDate(end2.getDate() - 14);
    return randomDate(start2, end2);
  } else {
    const start3 = new Date(now);
    start3.setDate(start3.getDate() - 14);
    return randomDate(start3, now);
  }
}

// Função para selecionar período baseado na distribuição
function selectPeriod() {
  const rand = Math.random();
  if (rand < 0.3) return 'month1'; // 30% no mês 1
  if (rand < 0.8) return 'month2'; // 50% no mês 2
  return 'recent'; // 20% nas últimas 2 semanas
}

// =====================================================
// FASE 1: LIMPEZA DE DADOS
// =====================================================

async function cleanupData(userId) {
  console.log('🧹 Iniciando limpeza de dados...\n');
  
  try {
    // Limpar tabelas dependentes primeiro
    console.log('   Limpando tabelas dependentes...');
    
    await supabase.from('crm_activities').delete().eq('user_id', userId);
    await supabase.from('crm_follow_ups').delete().eq('user_id', userId);
    await supabase.from('commercial_lead_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // transaction_costs e financial_attachments são deletados via CASCADE quando deletamos financial_transactions
    // Mas vamos deletá-los explicitamente para garantir
    
    // Limpar tabelas principais (a ordem importa devido a foreign keys)
    console.log('   Limpando tabelas principais...');
    
    // Primeiro deletar financial_transactions (transaction_costs e attachments serão deletados via CASCADE)
    await supabase.from('financial_transactions').delete().eq('user_id', userId);
    await supabase.from('financial_recurring_transactions').delete().eq('user_id', userId);
    await supabase.from('financial_budgets').delete().eq('user_id', userId);
    await supabase.from('commercial_sales').delete().eq('user_id', userId);
    await supabase.from('commercial_leads').delete().eq('user_id', userId);
    await supabase.from('medical_appointments').delete().eq('user_id', userId);
    await supabase.from('crm_deals').delete().eq('user_id', userId);
    await supabase.from('crm_contacts').delete().eq('user_id', userId);
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('commercial_procedures').delete().eq('user_id', userId);
    await supabase.from('commercial_campaigns').delete().eq('user_id', userId);
    
    // Limpar categorias e contas (serão recriadas)
    console.log('   Limpando configurações base...');
    await supabase.from('financial_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('financial_accounts').delete().eq('user_id', userId);
    
    console.log('✅ Limpeza concluída!\n');
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    throw error;
  }
}

// =====================================================
// FASE 2: CONFIGURAÇÃO BASE
// =====================================================

async function createBaseData(userId) {
  console.log('⚙️  Criando dados base...\n');
  
  // Criar contas financeiras
  console.log('   Criando contas financeiras...');
  const { data: accounts, error: accountsError } = await supabase
    .from('financial_accounts')
    .insert([
      {
        user_id: userId,
        name: 'Conta Principal',
        type: 'conta_corrente',
        bank_name: 'Banco do Brasil',
        current_balance: 45000,
        initial_balance: 10000,
        is_active: true
      },
      {
        user_id: userId,
        name: 'Poupança',
        type: 'poupanca',
        bank_name: 'Banco do Brasil',
        current_balance: 25000,
        initial_balance: 20000,
        is_active: true
      },
      {
        user_id: userId,
        name: 'Pix',
        type: 'caixa',
        bank_name: null,
        current_balance: 5000,
        initial_balance: 0,
        is_active: true
      }
    ])
    .select();
  
  if (accountsError) throw accountsError;
  console.log(`   ✅ ${accounts.length} contas criadas`);
  
  // Criar categorias financeiras
  console.log('   Criando categorias financeiras...');
  const { data: categories, error: categoriesError } = await supabase
    .from('financial_categories')
    .insert([
      // Entradas
      { name: 'Consultas', type: 'entrada', color: '#10b981', icon: 'stethoscope', is_system: true },
      { name: 'Procedimentos Estéticos', type: 'entrada', color: '#3b82f6', icon: 'sparkles', is_system: true },
      { name: 'Exames', type: 'entrada', color: '#8b5cf6', icon: 'clipboard', is_system: true },
      // Saídas
      { name: 'Aluguel', type: 'saida', color: '#ef4444', icon: 'home', is_system: true },
      { name: 'Salários', type: 'saida', color: '#f59e0b', icon: 'users', is_system: true },
      { name: 'Materiais Médicos', type: 'saida', color: '#06b6d4', icon: 'package', is_system: true },
      { name: 'Marketing', type: 'saida', color: '#ec4899', icon: 'megaphone', is_system: true },
      { name: 'Internet', type: 'saida', color: '#6366f1', icon: 'wifi', is_system: true },
      { name: 'Telefone', type: 'saida', color: '#14b8a6', icon: 'phone', is_system: true },
      { name: 'Energia Elétrica', type: 'saida', color: '#f97316', icon: 'zap', is_system: true },
      { name: 'Água', type: 'saida', color: '#0ea5e9', icon: 'droplet', is_system: true }
    ])
    .select();
  
  if (categoriesError) throw categoriesError;
  console.log(`   ✅ ${categories.length} categorias criadas`);
  
  // Criar procedimentos comerciais
  console.log('   Criando procedimentos comerciais...');
  const procedures = [
    { name: 'Consulta Inicial', category: 'consultation', price: 250, duration: 60 },
    { name: 'Consulta Retorno', category: 'consultation', price: 150, duration: 30 },
    { name: 'Limpeza de Pele', category: 'procedure', price: 300, duration: 60 },
    { name: 'Toxina Botulínica', category: 'procedure', price: 1200, duration: 30 },
    { name: 'Preenchimento Labial', category: 'procedure', price: 1500, duration: 45 },
    { name: 'Preenchimento Facial', category: 'procedure', price: 2800, duration: 60 },
    { name: 'Laser Facial', category: 'procedure', price: 800, duration: 45 },
    { name: 'Peeling Químico', category: 'procedure', price: 450, duration: 45 },
    { name: 'Radiofrequência', category: 'procedure', price: 600, duration: 60 },
    { name: 'Exame Laboratorial', category: 'exam', price: 200, duration: 15 }
  ];
  
  const proceduresWithUserId = procedures.map(p => ({
    user_id: userId,
    name: p.name,
    category: p.category,
    price: p.price,
    duration_minutes: p.duration,
    is_active: true
  }));
  
  const { data: createdProcedures, error: proceduresError } = await supabase
    .from('commercial_procedures')
    .insert(proceduresWithUserId)
    .select();
  
  if (proceduresError) throw proceduresError;
  console.log(`   ✅ ${createdProcedures.length} procedimentos criados`);
  
  console.log('✅ Dados base criados!\n');
  
  return {
    accounts,
    categories,
    procedures: createdProcedures
  };
}

// =====================================================
// FASE 3: GERAÇÃO DE DADOS FICTÍCIOS
// =====================================================

async function createContacts(userId, baseData) {
  console.log('👥 Criando contatos/pacientes...');
  
  const contacts = [];
  for (let i = 0; i < 80; i++) {
    const name = generateFullName();
    const phone = generatePhone();
    const email = generateEmail(name);
    const period = selectPeriod();
    const createdAt = getRandomDateInPeriod(period);
    
    // 30% têm procedimento vinculado
    const hasProcedure = Math.random() < 0.3;
    const procedure = hasProcedure ? baseData.procedures[Math.floor(Math.random() * baseData.procedures.length)] : null;
    
    contacts.push({
      user_id: userId,
      full_name: name,
      email: email,
      phone: phone,
      company: Math.random() < 0.2 ? 'Empresa ' + Math.floor(Math.random() * 100) : null,
      position: Math.random() < 0.15 ? ['Gerente', 'Diretor', 'Analista'][Math.floor(Math.random() * 3)] : null,
      lead_score: Math.floor(Math.random() * 100),
      tags: Math.random() < 0.3 ? ['vip', 'retorno', 'indicacao'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
      custom_fields: procedure ? { procedure_id: procedure.id } : {},
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      last_contact_at: Math.random() < 0.5 ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null
    });
  }
  
  // Inserir em lotes de 50
  const batchSize = 50;
  const allContacts = [];
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allContacts.push(...data);
  }
  
  console.log(`   ✅ ${allContacts.length} contatos criados`);
  return allContacts;
}

async function createLeads(userId, contacts, baseData) {
  console.log('📋 Criando leads comerciais...');
  
  const origins = ['google', 'instagram', 'facebook', 'indication', 'website', 'other'];
  const originWeights = [0.3, 0.55, 0.75, 0.90, 1.0]; // Pesos acumulativos (30%, 25%, 20%, 15%, 10%)
  
  function selectOrigin() {
    const rand = Math.random();
    for (let i = 0; i < originWeights.length; i++) {
      if (rand < originWeights[i]) return origins[i];
    }
    return origins[origins.length - 1]; // other como fallback
  }
  
  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const statusWeights = [0.15, 0.20, 0.25, 0.35, 0.05]; // 35% convertidos
  
  function selectStatus() {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < statusWeights.length; i++) {
      sum += statusWeights[i];
      if (rand < sum) return statuses[i];
    }
    return statuses[statuses.length - 1];
  }
  
  const leads = [];
  const convertedContacts = contacts.filter((_, i) => i < contacts.length * 0.6); // 60% convertidos
  
  for (let i = 0; i < 100; i++) {
    const period = selectPeriod();
    const createdAt = getRandomDateInPeriod(period);
    const origin = selectOrigin();
    const status = selectStatus();
    const procedure = baseData.procedures[Math.floor(Math.random() * baseData.procedures.length)];
    
    // Leads convertidos são vinculados a contatos
    const contactId = status === 'converted' && convertedContacts[i % convertedContacts.length] 
      ? convertedContacts[i % convertedContacts.length].id 
      : null;
    
    leads.push({
      user_id: userId,
      name: generateFullName(),
      email: Math.random() < 0.8 ? generateEmail(generateFullName()) : null,
      phone: generatePhone(),
      origin: origin,
      status: status,
      estimated_value: procedure.price + (Math.random() * 500 - 250), // Variação de +/- 250
      contact_id: contactId,
      converted_at: status === 'converted' ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      notes: Math.random() < 0.4 ? `Lead interessado em ${procedure.name}` : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    });
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allLeads = [];
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('commercial_leads')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allLeads.push(...data);
  }
  
  console.log(`   ✅ ${allLeads.length} leads criados`);
  return allLeads;
}

async function createAppointments(userId, contacts, baseData, accounts, categories) {
  console.log('📅 Criando consultas médicas...');
  
  const appointmentTypes = ['first_visit', 'return', 'procedure', 'follow_up', 'exam'];
  const statuses = ['completed', 'scheduled', 'cancelled'];
  const statusWeights = [0.70, 0.20, 0.10]; // 70% completed, 20% scheduled, 10% cancelled
  
  function selectStatus() {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < statusWeights.length; i++) {
      sum += statusWeights[i];
      if (rand < sum) return statuses[i];
    }
    return statuses[statuses.length - 1];
  }
  
  const appointments = [];
  const consultationCategory = categories.find(c => c.name === 'Consultas');
  const procedureCategory = categories.find(c => c.name === 'Procedimentos Estéticos');
  
  for (let i = 0; i < 200; i++) {
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const procedure = baseData.procedures[Math.floor(Math.random() * baseData.procedures.length)];
    const period = selectPeriod();
    const createdAt = getRandomDateInPeriod(period);
    
    // Criar data de consulta (algumas no passado, algumas no futuro)
    const appointmentDate = new Date(createdAt);
    if (Math.random() < 0.7) {
      // 70% no passado (completed ou cancelled)
      appointmentDate.setDate(appointmentDate.getDate() - Math.random() * 60);
    } else {
      // 30% no futuro (scheduled)
      appointmentDate.setDate(appointmentDate.getDate() + Math.random() * 30);
    }
    
    const status = selectStatus();
    const startTime = new Date(appointmentDate);
    startTime.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 4) * 15, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + procedure.duration_minutes);
    
    const appointmentType = procedure.category === 'consultation' 
      ? (Math.random() < 0.5 ? 'first_visit' : 'return')
      : procedure.category === 'exam' ? 'exam' : 'procedure';
    
    appointments.push({
      user_id: userId,
      contact_id: contact.id,
      title: procedure.name,
      appointment_type: appointmentType,
      status: status,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: procedure.duration_minutes,
      estimated_value: procedure.price,
      notes: Math.random() < 0.3 ? 'Paciente pontual, sem intercorrências' : null,
      internal_notes: Math.random() < 0.2 ? 'Notas internas sobre o paciente' : null,
      payment_status: status === 'completed' ? (Math.random() < 0.9 ? 'paid' : 'pending') : 'pending',
      paid_in_advance: Math.random() < 0.1,
      completed_at: status === 'completed' ? startTime.toISOString() : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    });
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allAppointments = [];
  for (let i = 0; i < appointments.length; i += batchSize) {
    const batch = appointments.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('medical_appointments')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allAppointments.push(...data);
  }
  
  console.log(`   ✅ ${allAppointments.length} consultas criadas`);
  return allAppointments;
}

async function createTransactions(userId, appointments, baseData, accounts, categories) {
  console.log('💰 Criando transações financeiras...');
  
  const transactions = [];
  const mainAccount = accounts.find(a => a.name === 'Conta Principal');
  const consultationCategory = categories.find(c => c.name === 'Consultas');
  const procedureCategory = categories.find(c => c.name === 'Procedimentos Estéticos');
  const examCategory = categories.find(c => c.name === 'Exames');
  
  // Transações de ENTRADA (consultas completadas)
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  
  for (const appointment of completedAppointments) {
    const category = appointment.appointment_type === 'exam' 
      ? examCategory
      : appointment.appointment_type === 'procedure' 
        ? procedureCategory 
        : consultationCategory;
    
    const hasCosts = Math.random() < 0.3; // 30% têm custos
    const costAmount = hasCosts ? appointment.estimated_value * (0.15 + Math.random() * 0.25) : 0; // 15-40% de custo
    
    transactions.push({
      user_id: userId,
      account_id: mainAccount.id,
      category_id: category.id,
      type: 'entrada',
      amount: appointment.estimated_value,
      description: `Consulta: ${appointment.title}`,
      date: appointment.start_time.split('T')[0],
      transaction_date: appointment.start_time.split('T')[0],
      payment_method: ['pix', 'cartao_debito', 'cartao_credito', 'dinheiro'][Math.floor(Math.random() * 4)],
      contact_id: appointment.contact_id,
      status: 'concluida',
      has_costs: hasCosts,
      total_costs: costAmount,
      metadata: {},
      created_at: appointment.created_at,
      updated_at: appointment.created_at
    });
  }
  
  // Transações de SAÍDA (despesas mensais)
  const expenseCategories = categories.filter(c => c.type === 'saida');
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  // Gerar despesas para cada mês
  for (let month = 0; month < 2; month++) {
    const monthStart = new Date(twoMonthsAgo);
    monthStart.setMonth(monthStart.getMonth() + month);
    monthStart.setDate(1);
    
    // Aluguel (1 por mês)
    const rentCategory = expenseCategories.find(c => c.name === 'Aluguel');
    transactions.push({
      user_id: userId,
      account_id: mainAccount.id,
      category_id: rentCategory.id,
      type: 'saida',
      amount: 8000,
      description: 'Aluguel do consultório',
      date: monthStart.toISOString().split('T')[0],
      transaction_date: monthStart.toISOString().split('T')[0],
      payment_method: 'pix',
      status: 'concluida',
      has_costs: false,
      total_costs: 0,
      metadata: {},
      created_at: monthStart.toISOString(),
      updated_at: monthStart.toISOString()
    });
    
    // Salários (2 por mês)
    const salaryCategory = expenseCategories.find(c => c.name === 'Salários');
    for (let i = 0; i < 2; i++) {
      const salaryDate = new Date(monthStart);
      salaryDate.setDate(5 + i * 15);
      transactions.push({
        user_id: userId,
        account_id: mainAccount.id,
        category_id: salaryCategory.id,
        type: 'saida',
        amount: 3500,
        description: `Salário funcionário ${i + 1}`,
        date: salaryDate.toISOString().split('T')[0],
        transaction_date: salaryDate.toISOString().split('T')[0],
        payment_method: 'pix',
        status: 'concluida',
        has_costs: false,
        total_costs: 0,
        metadata: {},
        created_at: salaryDate.toISOString(),
        updated_at: salaryDate.toISOString()
      });
    }
    
    // Outras despesas (materiais, marketing, internet, telefone, energia, água)
    const otherExpenses = [
      { category: 'Materiais Médicos', amount: 2000 + Math.random() * 1000 },
      { category: 'Marketing', amount: 1500 + Math.random() * 1000 },
      { category: 'Internet', amount: 150 },
      { category: 'Telefone', amount: 100 },
      { category: 'Energia Elétrica', amount: 400 + Math.random() * 200 },
      { category: 'Água', amount: 150 + Math.random() * 50 }
    ];
    
    for (const expense of otherExpenses) {
      const category = expenseCategories.find(c => c.name === expense.category);
      const expenseDate = new Date(monthStart);
      expenseDate.setDate(1 + Math.floor(Math.random() * 28));
      
      transactions.push({
        user_id: userId,
        account_id: mainAccount.id,
        category_id: category.id,
        type: 'saida',
        amount: Math.round(expense.amount * 100) / 100,
        description: expense.category,
        date: expenseDate.toISOString().split('T')[0],
        transaction_date: expenseDate.toISOString().split('T')[0],
        payment_method: ['pix', 'cartao_debito'][Math.floor(Math.random() * 2)],
        status: 'concluida',
        has_costs: false,
        total_costs: 0,
        metadata: {},
        created_at: expenseDate.toISOString(),
        updated_at: expenseDate.toISOString()
      });
    }
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allTransactions = [];
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allTransactions.push(...data);
  }
  
  // Vincular algumas consultas às transações
  const entryTransactions = allTransactions.filter(t => t.type === 'entrada');
  for (let i = 0; i < Math.min(completedAppointments.length, entryTransactions.length); i++) {
    await supabase
      .from('medical_appointments')
      .update({ financial_transaction_id: entryTransactions[i].id })
      .eq('id', completedAppointments[i].id);
  }
  
  console.log(`   ✅ ${allTransactions.length} transações criadas`);
  return allTransactions;
}

async function createDeals(userId, contacts, baseData) {
  console.log('🤝 Criando deals do CRM...');
  
  const stages = ['lead_novo', 'qualificado', 'apresentacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'];
  const stageWeights = [0.10, 0.15, 0.15, 0.15, 0.15, 0.25, 0.05]; // 25% fechados ganho, 5% perdidos
  
  function selectStage() {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < stageWeights.length; i++) {
      sum += stageWeights[i];
      if (rand < sum) return stages[i];
    }
    return stages[stages.length - 1];
  }
  
  const deals = [];
  const dealsPerContact = Math.ceil(100 / contacts.length);
  
  for (const contact of contacts) {
    const numDeals = Math.random() < 0.8 ? 1 : (Math.random() < 0.9 ? 2 : 0); // 80% têm 1 deal, 10% têm 2
        
    for (let i = 0; i < numDeals && deals.length < 100; i++) {
      const procedure = baseData.procedures[Math.floor(Math.random() * baseData.procedures.length)];
      const stage = selectStage();
      const period = selectPeriod();
      const createdAt = getRandomDateInPeriod(period);
      
      deals.push({
        user_id: userId,
        contact_id: contact.id,
        title: `Negócio: ${procedure.name}`,
        description: `Oportunidade de ${procedure.name} para ${contact.full_name}`,
        value: procedure.price + (Math.random() * 500 - 250),
        stage: stage,
        probability: stage === 'fechado_ganho' ? 100 : stage === 'fechado_perdido' ? 0 : Math.floor(20 + (stages.indexOf(stage) * 15)),
        expected_close_date: stage.includes('fechado') ? null : new Date(createdAt.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        closed_at: stage.includes('fechado') ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        position: deals.length,
        tags: [],
        custom_fields: {},
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString()
      });
    }
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allDeals = [];
  for (let i = 0; i < deals.length; i += batchSize) {
    const batch = deals.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('crm_deals')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allDeals.push(...data);
  }
  
  console.log(`   ✅ ${allDeals.length} deals criados`);
  return allDeals;
}

async function createSales(userId, leads, contacts, baseData, appointments) {
  console.log('🛒 Criando vendas comerciais...');
  
  const convertedLeads = leads.filter(l => l.status === 'converted');
  const sales = [];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer'];
  const statuses = ['completed', 'confirmed', 'quote'];
  const statusWeights = [0.70, 0.20, 0.10];
  
  function selectStatus() {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < statusWeights.length; i++) {
      sum += statusWeights[i];
      if (rand < sum) return statuses[i];
    }
    return statuses[statuses.length - 1];
  }
  
  // Criar vendas para 40-50 leads convertidos
  const numSales = 40 + Math.floor(Math.random() * 11);
  const selectedLeads = convertedLeads.slice(0, numSales);
  
  for (const lead of selectedLeads) {
    const procedure = baseData.procedures[Math.floor(Math.random() * baseData.procedures.length)];
    const status = selectStatus();
    const period = selectPeriod();
    const saleDate = getRandomDateInPeriod(period);
    
    // Encontrar appointment relacionado se existir
    const relatedAppointment = appointments.find(a => a.contact_id === lead.contact_id);
    
    sales.push({
      user_id: userId,
      lead_id: lead.id,
      contact_id: lead.contact_id,
      procedure_id: procedure.id,
      appointment_id: relatedAppointment ? relatedAppointment.id : null,
      value: procedure.price,
      status: status,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      installments: status === 'completed' && Math.random() < 0.3 ? (Math.floor(Math.random() * 6) + 1) : 1,
      sale_date: saleDate.toISOString(),
      notes: Math.random() < 0.3 ? `Venda realizada com sucesso` : null,
      created_at: saleDate.toISOString(),
      updated_at: saleDate.toISOString()
    });
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allSales = [];
  for (let i = 0; i < sales.length; i += batchSize) {
    const batch = sales.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('commercial_sales')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allSales.push(...data);
  }
  
  console.log(`   ✅ ${allSales.length} vendas criadas`);
  return allSales;
}

async function createActivities(userId, contacts, deals) {
  console.log('📞 Criando atividades CRM...');
  
  const activityTypes = ['call', 'email', 'whatsapp', 'meeting', 'note'];
  const activities = [];
  
  // Criar 100-150 atividades
  const numActivities = 100 + Math.floor(Math.random() * 51);
  
  for (let i = 0; i < numActivities; i++) {
    const hasDeal = Math.random() < 0.4; // 40% têm deal
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const deal = hasDeal && deals.length > 0 ? deals[Math.floor(Math.random() * deals.length)] : null;
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const period = selectPeriod();
    const createdAt = getRandomDateInPeriod(period);
    
    const titles = {
      call: 'Ligação com paciente',
      email: 'Email enviado',
      whatsapp: 'Mensagem WhatsApp',
      meeting: 'Reunião agendada',
      note: 'Nota sobre paciente'
    };
    
    activities.push({
      user_id: userId,
      contact_id: contact.id,
      deal_id: deal ? deal.id : null,
      activity_type: activityType,
      title: titles[activityType],
      description: Math.random() < 0.6 ? `Detalhes da atividade ${activityType}` : null,
      completed: Math.random() < 0.8,
      scheduled_at: activityType === 'meeting' ? createdAt.toISOString() : null,
      completed_at: Math.random() < 0.8 ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : null,
      metadata: {},
      created_at: createdAt.toISOString()
    });
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allActivities = [];
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allActivities.push(...data);
  }
  
  console.log(`   ✅ ${allActivities.length} atividades criadas`);
  return allActivities;
}

async function createFollowUps(userId, deals, contacts) {
  console.log('📌 Criando follow-ups...');
  
  const followUps = [];
  const types = ['call', 'email', 'meeting'];
  
  // Criar 50-70 follow-ups
  const numFollowUps = 50 + Math.floor(Math.random() * 21);
  
  for (let i = 0; i < numFollowUps; i++) {
    const hasDeal = Math.random() < 0.6; // 60% têm deal
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const deal = hasDeal && deals.length > 0 ? deals[Math.floor(Math.random() * deals.length)] : null;
    const period = selectPeriod();
    const scheduledDate = getRandomDateInPeriod(period);
    const isCompleted = Math.random() < 0.6; // 60% completados
    
    followUps.push({
      user_id: userId,
      deal_id: deal ? deal.id : null,
      contact_id: contact.id,
      type: types[Math.floor(Math.random() * types.length)],
      scheduled_date: scheduledDate.toISOString(),
      notes: Math.random() < 0.4 ? 'Follow-up necessário' : null,
      completed: isCompleted,
      completed_at: isCompleted ? new Date(scheduledDate.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      created_at: scheduledDate.toISOString()
    });
  }
  
  // Inserir em lotes
  const batchSize = 50;
  const allFollowUps = [];
  for (let i = 0; i < followUps.length; i += batchSize) {
    const batch = followUps.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('crm_follow_ups')
      .insert(batch)
      .select();
    
    if (error) throw error;
    allFollowUps.push(...data);
  }
  
  console.log(`   ✅ ${allFollowUps.length} follow-ups criados`);
  return allFollowUps;
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

async function main() {
  try {
    console.log('🚀 Iniciando população do banco de dados...\n');
    
    // Buscar user_id do usuário logado
    const email = process.argv[2] || 'gustavosantosbbs@gmail.com';
    console.log(`📧 Buscando usuário: ${email}\n`);
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error(`Usuário com email ${email} não encontrado`);
    }
    
    const userId = user.id;
    console.log(`✅ Usuário encontrado: ${user.email} (${userId})\n`);
    
    // Fase 1: Limpeza
    await cleanupData(userId);
    
    // Fase 2: Dados base
    const baseData = await createBaseData(userId);
    
    // Fase 3: Dados fictícios
    console.log('📊 Gerando dados fictícios...\n');
    
    const contacts = await createContacts(userId, baseData);
    const leads = await createLeads(userId, contacts, baseData);
    const appointments = await createAppointments(userId, contacts, baseData, baseData.accounts, baseData.categories);
    const transactions = await createTransactions(userId, appointments, baseData, baseData.accounts, baseData.categories);
    const deals = await createDeals(userId, contacts, baseData);
    const sales = await createSales(userId, leads, contacts, baseData, appointments);
    const activities = await createActivities(userId, contacts, deals);
    const followUps = await createFollowUps(userId, deals, contacts);
    
    // Estatísticas finais
    console.log('\n📈 Estatísticas Finais:');
    console.log(`   👥 Contatos: ${contacts.length}`);
    console.log(`   📋 Leads: ${leads.length}`);
    console.log(`   📅 Consultas: ${appointments.length}`);
    console.log(`   💰 Transações: ${transactions.length}`);
    console.log(`   🤝 Deals: ${deals.length}`);
    console.log(`   🛒 Vendas: ${sales.length}`);
    console.log(`   📞 Atividades: ${activities.length}`);
    console.log(`   📌 Follow-ups: ${followUps.length}`);
    
    const totalRevenue = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    console.log(`\n💰 Resumo Financeiro:`);
    console.log(`   Receita Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`   Despesas Total: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`   Lucro: R$ ${(totalRevenue - totalExpenses).toFixed(2)}`);
    
    console.log('\n✅ Banco de dados populado com sucesso! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao popular banco de dados:', error.message);
    if (error.details) console.error('Detalhes:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

main();


