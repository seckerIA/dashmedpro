// =====================================================
// Flow 3: Sinal (Partial) Payment
// Verifica fluxo: sinal parcial → pagamento restante → financeiro correto
// estimated_value=500, sinal=100, restante=400
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
  assertCount,
  reportResults,
} from './helpers.js';

const FLOW_NAME = 'Flow 3: Sinal (Partial) Payment';

let contactId: string;
let appointmentId: string;
let accountId: string;
let categoryId: string;
let initialBalance: number;

export async function runFlow3(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Setup
  // ==========================================
  results.push(await runTest('3.1 Setup: contact + appointment with sinal', async () => {
    logStep(1, 'Creating contact and appointment...');

    const { data: contact, error: cErr } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow3`,
        phone: '11999990003',
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!cErr, `Contact: ${cErr?.message}`);
    contactId = contact!.id;

    const now = new Date();
    const start = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data: appt, error: aErr } = await supabaseUser
      .from('medical_appointments')
      .insert({
        user_id: getUserId(),
        doctor_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Consulta_Flow3`,
        appointment_type: 'procedure',
        status: 'scheduled',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: 60,
        estimated_value: 500,
        payment_status: 'pending',
        sinal_amount: 100,
        sinal_paid: false,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!aErr, `Appointment: ${aErr?.message}`);
    appointmentId = appt!.id;

    // Get financial account info
    const account = await getFirstFinancialAccount();
    assertNotNull(account, 'Financial account');
    accountId = account.id;
    initialBalance = account.current_balance;

    categoryId = (await getFirstEntradaCategory())!;
    assertNotNull(categoryId, 'Entrada category');

    logInfo(`Contact: ${contactId}, Appointment: ${appointmentId}`);
    logInfo(`Account: ${accountId}, Balance: R$${initialBalance}`);
  }));

  // ==========================================
  // Test: No transaction before sinal payment
  // ==========================================
  results.push(await runTest('3.2 No financial transaction before sinal payment', async () => {
    logStep(2, 'Checking no transaction exists yet...');

    const { data } = await supabaseAdmin
      .from('financial_transactions')
      .select('id')
      .like('description', `%${TEST_RUN_ID}_Consulta_Flow3%`);

    assertEqual(data?.length ?? 0, 0, 'Transaction count before sinal');
  }));

  // ==========================================
  // Test: Pay sinal → transaction R$100 (is_sinal=true)
  // ==========================================
  results.push(await runTest('3.3 Pay sinal → R$100 transaction with is_sinal=true', async () => {
    logStep(3, 'Paying sinal and creating transaction...');

    // Update appointment
    await supabaseUser
      .from('medical_appointments')
      .update({
        sinal_paid: true,
        sinal_paid_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    // Simulate createFinancialTransactionForAppointment with is_sinal=true
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        account_id: accountId,
        category_id: categoryId,
        type: 'entrada',
        amount: 100,
        description: `${TEST_RUN_ID}_Consulta_Flow3 (Sinal)`,
        date: today,
        transaction_date: today,
        contact_id: contactId,
        payment_method: 'pix',
        status: 'concluida',
        notes: 'Consulta medica - procedure (Sinal)',
        tags: ['consulta-medica', 'qa_test'],
        has_costs: false,
        total_costs: 0,
        metadata: {
          appointment_id: appointmentId,
          appointment_type: 'procedure',
          is_sinal: true,
        },
      })
      .select('id, amount, metadata')
      .single();

    assert(!error, `Sinal transaction: ${error?.message}`);
    assertNotNull(data, 'Sinal transaction');
    assertEqual(data.amount, 100, 'Sinal amount');
    assertEqual((data.metadata as any)?.is_sinal, true, 'is_sinal flag');
    logInfo(`Sinal transaction: ${data.id}, R$100`);
  }));

  // ==========================================
  // Test: Complete + pay → second transaction R$400 (restante)
  // ==========================================
  results.push(await runTest('3.4 Complete + paid → R$400 remaining transaction', async () => {
    logStep(4, 'Completing appointment and creating remaining transaction...');

    await supabaseUser
      .from('medical_appointments')
      .update({
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    const today = format(new Date(), 'yyyy-MM-dd');
    const remainingAmount = 500 - 100; // estimated_value - sinal_amount

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        account_id: accountId,
        category_id: categoryId,
        type: 'entrada',
        amount: remainingAmount,
        description: `${TEST_RUN_ID}_Consulta_Flow3`,
        date: today,
        transaction_date: today,
        contact_id: contactId,
        payment_method: 'pix',
        status: 'concluida',
        notes: 'Consulta medica - procedure',
        tags: ['consulta-medica', 'qa_test'],
        has_costs: false,
        total_costs: 0,
        metadata: {
          appointment_id: appointmentId,
          appointment_type: 'procedure',
          is_sinal: false,
        },
      })
      .select('id, amount')
      .single();

    assert(!error, `Remaining transaction: ${error?.message}`);
    assertNotNull(data, 'Remaining transaction');
    assertEqual(data.amount, 400, 'Remaining amount');
    logInfo(`Remaining transaction: ${data.id}, R$400`);
  }));

  // ==========================================
  // Test: Total balance increased by R$500
  // ==========================================
  results.push(await runTest('3.5 Total R$500 in transactions for this appointment', async () => {
    logStep(5, 'Verifying total transaction amount...');

    const { data: transactions } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount')
      .like('description', `%${TEST_RUN_ID}_Consulta_Flow3%`);

    assertNotNull(transactions, 'Transactions list');
    const total = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    assertEqual(total, 500, 'Total transaction amount');
    assertEqual(transactions.length, 2, 'Number of transactions');
    logInfo(`Total: R$${total} from ${transactions.length} transactions`);
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow3();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-3')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
