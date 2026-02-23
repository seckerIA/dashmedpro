// =====================================================
// Flow 1: CRM → Agendamento → Financeiro
// O fluxo mais critico do DashMedPro
// Simula: Cadastrar paciente → Agendar → Pagar → Verificar financeiro
// =====================================================

import { format } from 'date-fns';
import {
  supabaseAdmin,
  supabaseUser,
  TEST_RUN_ID,
  authenticate,
  getUserId,
  getOrganizationId,
  getFirstFinancialAccount,
  getFirstEntradaCategory,
  cleanup,
} from './config.js';
import {
  TestResult,
  FlowResult,
  runTest,
  logStep,
  logFlowHeader,
  logInfo,
  buildFlowResult,
  assert,
  assertEqual,
  assertNotNull,
  assertRowExists,
  reportResults,
} from './helpers.js';

const FLOW_NAME = 'Flow 1: CRM → Agendamento → Financeiro';

// Shared state between tests
let contactId: string;
let appointmentId: string;
let dealId: string;
let accountId: string;
let categoryId: string;
let initialBalance: number;

export async function runFlow1(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Test 1: Create CRM Contact
  // ==========================================
  results.push(await runTest('1.1 Create CRM Contact', async () => {
    logStep(1, 'Creating CRM contact...');

    const { data, error } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow1`,
        phone: '11999990001',
        email: `flow1_${Date.now()}@qa.test`,
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!error, `Insert failed: ${error?.message}`);
    assertNotNull(data, 'Contact data');
    contactId = data.id;
    logInfo(`Contact created: ${contactId}`);
  }));

  // ==========================================
  // Test 2: Verify contact exists
  // ==========================================
  results.push(await runTest('1.2 Verify contact exists in DB', async () => {
    logStep(2, 'Verifying contact...');
    const row = await assertRowExists('crm_contacts', { id: contactId }, 'Contact lookup');
    assertEqual(row.full_name, `${TEST_RUN_ID}_Patient_Flow1`, 'Contact name');
  }));

  // ==========================================
  // Test 3: Create Medical Appointment
  // ==========================================
  results.push(await runTest('1.3 Create medical appointment', async () => {
    logStep(3, 'Creating appointment...');

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30min

    const { data, error } = await supabaseUser
      .from('medical_appointments')
      .insert({
        user_id: getUserId(),
        doctor_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Consulta_Flow1`,
        appointment_type: 'first_visit',
        status: 'scheduled',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 30,
        estimated_value: 250,
        payment_status: 'pending',
        paid_in_advance: false,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!error, `Insert failed: ${error?.message}`);
    assertNotNull(data, 'Appointment data');
    appointmentId = data.id;
    logInfo(`Appointment created: ${appointmentId}`);
  }));

  // ==========================================
  // Test 4: Verify appointment exists
  // ==========================================
  results.push(await runTest('1.4 Verify appointment exists', async () => {
    logStep(4, 'Verifying appointment...');
    const row = await assertRowExists('medical_appointments', { id: appointmentId }, 'Appointment lookup');
    assertEqual(row.estimated_value, 250, 'Estimated value');
    assertEqual(row.payment_status, 'pending', 'Payment status');
    assertEqual(row.status, 'scheduled', 'Status');
  }));

  // ==========================================
  // Test 5: Pipeline automation — deal should be created/updated
  // ==========================================
  results.push(await runTest('1.5 Pipeline: deal created with stage agendado', async () => {
    logStep(5, 'Simulating pipeline automation (updateDealPipeline)...');

    // The pipeline automation runs in the frontend hook.
    // We simulate it: create/update a deal for this contact.
    const { data: existingDeal } = await supabaseAdmin
      .from('crm_deals')
      .select('id, stage')
      .eq('contact_id', contactId)
      .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (existingDeal) {
      // Update existing deal
      await supabaseAdmin
        .from('crm_deals')
        .update({ stage: 'agendado', is_defaulting: false, value: 250, updated_at: new Date().toISOString() })
        .eq('id', existingDeal.id);
      dealId = existingDeal.id;
    } else {
      // Create new deal
      const { data, error } = await supabaseAdmin
        .from('crm_deals')
        .insert({
          user_id: getUserId(),
          contact_id: contactId,
          title: `${TEST_RUN_ID}_Deal_Flow1`,
          value: 250,
          stage: 'agendado',
          is_defaulting: false,
          organization_id: getOrganizationId(),
        })
        .select('id')
        .single();

      assert(!error, `Deal insert failed: ${error?.message}`);
      assertNotNull(data, 'Deal data');
      dealId = data.id;
    }

    // Verify deal is in 'agendado' stage
    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal lookup');
    assertEqual(deal.stage, 'agendado', 'Deal stage');
    logInfo(`Deal: ${dealId} → stage=agendado`);
  }));

  // ==========================================
  // Test 6: Mark appointment as completed + paid
  // ==========================================
  results.push(await runTest('1.6 Mark appointment completed + paid', async () => {
    logStep(6, 'Updating appointment to completed + paid...');

    const { error } = await supabaseUser
      .from('medical_appointments')
      .update({
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    assert(!error, `Update failed: ${error?.message}`);

    const row = await assertRowExists('medical_appointments', { id: appointmentId }, 'Updated appointment');
    assertEqual(row.status, 'completed', 'Appointment status');
    assertEqual(row.payment_status, 'paid', 'Payment status');
  }));

  // ==========================================
  // Test 7: Create financial transaction (simulating frontend logic)
  // ==========================================
  results.push(await runTest('1.7 Financial transaction created for R$250', async () => {
    logStep(7, 'Simulating createFinancialTransactionForAppointment...');

    // Get financial account
    const account = await getFirstFinancialAccount();
    assertNotNull(account, 'Financial account');
    accountId = account.id;
    initialBalance = account.current_balance;

    // Get category
    const catId = await getFirstEntradaCategory();
    assertNotNull(catId, 'Entrada category');
    categoryId = catId;

    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        account_id: accountId,
        category_id: categoryId,
        type: 'entrada',
        amount: 250,
        description: `${TEST_RUN_ID}_Consulta_Flow1`,
        date: today,
        transaction_date: today,
        contact_id: contactId,
        payment_method: 'pix',
        status: 'concluida',
        notes: 'Consulta medica - first_visit',
        tags: ['consulta-medica', 'qa_test'],
        has_costs: false,
        total_costs: 0,
        metadata: {
          appointment_id: appointmentId,
          appointment_type: 'first_visit',
          is_sinal: false,
        },
      })
      .select('id, amount, type, metadata')
      .single();

    assert(!error, `Transaction insert failed: ${error?.message}`);
    assertNotNull(data, 'Transaction data');
    assertEqual(data.amount, 250, 'Transaction amount');
    assertEqual(data.type, 'entrada', 'Transaction type');
    assertEqual((data.metadata as any)?.is_sinal, false, 'is_sinal flag');
    logInfo(`Transaction created: ${data.id}, R$${data.amount}`);

    // Link transaction to appointment
    await supabaseAdmin
      .from('medical_appointments')
      .update({ financial_transaction_id: data.id })
      .eq('id', appointmentId);
  }));

  // ==========================================
  // Test 8: Balance updated
  // ==========================================
  results.push(await runTest('1.8 Financial account balance increased by R$250', async () => {
    logStep(8, 'Updating and verifying account balance...');

    // Simulate balance update (frontend does this)
    const newBalance = initialBalance + 250;
    await supabaseAdmin
      .from('financial_accounts')
      .update({ current_balance: newBalance })
      .eq('id', accountId);

    const { data: account } = await supabaseAdmin
      .from('financial_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .single();

    assertNotNull(account, 'Account after update');
    assertEqual(account.current_balance, newBalance, 'Account balance');
    logInfo(`Balance: R$${initialBalance} → R$${newBalance}`);

    // Restore original balance for other tests
    await supabaseAdmin
      .from('financial_accounts')
      .update({ current_balance: initialBalance })
      .eq('id', accountId);
  }));

  // ==========================================
  // Test 9: Deal moved to follow_up / aguardando_retorno
  // ==========================================
  results.push(await runTest('1.9 Pipeline: deal moved to follow_up after completion', async () => {
    logStep(9, 'Simulating pipeline update after payment...');

    // Simulate updateDealPipeline for completed+paid
    await supabaseAdmin
      .from('crm_deals')
      .update({ stage: 'follow_up', is_defaulting: false, updated_at: new Date().toISOString() })
      .eq('id', dealId);

    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal after completion');
    assertEqual(deal.stage, 'follow_up', 'Deal stage after payment');
    assertEqual(deal.is_defaulting, false, 'Deal is_defaulting');
    logInfo(`Deal ${dealId} → stage=follow_up`);
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow1();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-1')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
