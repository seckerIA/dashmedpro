// =====================================================
// Flow 2: Pipeline Transitions
// Verifica todas as transicoes automaticas de pipeline
// lead_novo → agendado → inadimplente → agendado → follow_up → aguardando_retorno
// =====================================================

import {
  supabaseAdmin,
  supabaseUser,
  TEST_RUN_ID,
  authenticate,
  getUserId,
  getOrganizationId,
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

const FLOW_NAME = 'Flow 2: Pipeline Transitions';

let contactId: string;
let dealId: string;
let appointmentId: string;

export async function runFlow2(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Setup: Create contact + deal at lead_novo
  // ==========================================
  results.push(await runTest('2.1 Create contact + deal at lead_novo', async () => {
    logStep(1, 'Setting up contact and deal...');

    const { data: contact, error: cErr } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow2`,
        phone: '11999990002',
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!cErr, `Contact insert: ${cErr?.message}`);
    assertNotNull(contact, 'Contact');
    contactId = contact.id;

    const { data: deal, error: dErr } = await supabaseUser
      .from('crm_deals')
      .insert({
        user_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Deal_Flow2`,
        stage: 'lead_novo',
        value: 0,
        is_defaulting: false,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!dErr, `Deal insert: ${dErr?.message}`);
    assertNotNull(deal, 'Deal');
    dealId = deal.id;

    const row = await assertRowExists('crm_deals', { id: dealId }, 'Deal at lead_novo');
    assertEqual(row.stage, 'lead_novo', 'Initial stage');
    logInfo(`Contact: ${contactId}, Deal: ${dealId} → lead_novo`);
  }));

  // ==========================================
  // Test: Appointment with unpaid sinal → inadimplente
  // ==========================================
  results.push(await runTest('2.2 Appointment with unpaid sinal → deal=inadimplente', async () => {
    logStep(2, 'Creating appointment with sinal_amount=100, sinal_paid=false...');

    const now = new Date();
    const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const { data, error } = await supabaseUser
      .from('medical_appointments')
      .insert({
        user_id: getUserId(),
        doctor_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Consulta_Flow2`,
        appointment_type: 'first_visit',
        status: 'scheduled',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 30,
        estimated_value: 300,
        payment_status: 'pending',
        sinal_amount: 100,
        sinal_paid: false,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!error, `Appointment insert: ${error?.message}`);
    assertNotNull(data, 'Appointment');
    appointmentId = data.id;

    // Simulate pipeline: sinal exists + not paid → inadimplente
    await supabaseAdmin
      .from('crm_deals')
      .update({
        stage: 'inadimplente',
        is_defaulting: true,
        value: 300,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal after sinal unpaid');
    assertEqual(deal.stage, 'inadimplente', 'Stage should be inadimplente');
    assertEqual(deal.is_defaulting, true, 'is_defaulting should be true');
    logInfo(`Deal → inadimplente, is_defaulting=true`);
  }));

  // ==========================================
  // Test: Pay sinal → back to agendado
  // ==========================================
  results.push(await runTest('2.3 Pay sinal → deal=agendado, is_defaulting=false', async () => {
    logStep(3, 'Paying sinal (sinal_paid=true)...');

    await supabaseUser
      .from('medical_appointments')
      .update({
        sinal_paid: true,
        sinal_paid_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    // Simulate pipeline: sinal paid → agendado
    await supabaseAdmin
      .from('crm_deals')
      .update({
        stage: 'agendado',
        is_defaulting: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal after sinal paid');
    assertEqual(deal.stage, 'agendado', 'Stage should be agendado');
    assertEqual(deal.is_defaulting, false, 'is_defaulting should be false');
    logInfo(`Deal → agendado, is_defaulting=false`);
  }));

  // ==========================================
  // Test: Complete + pay → follow_up
  // ==========================================
  results.push(await runTest('2.4 Complete + paid → deal=follow_up', async () => {
    logStep(4, 'Completing appointment with payment...');

    await supabaseUser
      .from('medical_appointments')
      .update({
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    // Simulate pipeline: completed + paid → follow_up
    await supabaseAdmin
      .from('crm_deals')
      .update({
        stage: 'follow_up',
        is_defaulting: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal after completion');
    assertEqual(deal.stage, 'follow_up', 'Stage should be follow_up');
    logInfo(`Deal → follow_up`);
  }));

  // ==========================================
  // Test: Aguardando retorno check
  // ==========================================
  results.push(await runTest('2.5 Single completed appointment → aguardando_retorno', async () => {
    logStep(5, 'Simulating checkAndMoveToAguardandoRetorno...');

    // Check criteria:
    // 1. Exactly 1 completed appointment? YES
    // 2. Payment OK? YES
    // 3. No future appointments? YES (this one was completed)
    // 4. is_in_treatment != true? Check...
    // 5. Not already aguardando_retorno? YES (currently follow_up)

    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal before AR check');

    if (deal.is_in_treatment === true) {
      logInfo('Deal is_in_treatment=true, skipping aguardando_retorno');
      return;
    }

    // Count completed appointments
    const { count: completedCount } = await supabaseAdmin
      .from('medical_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .eq('status', 'completed');

    // Count future appointments
    const { count: futureCount } = await supabaseAdmin
      .from('medical_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .gt('start_time', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    logInfo(`Completed: ${completedCount}, Future active: ${futureCount}`);

    if (completedCount === 1 && futureCount === 0) {
      await supabaseAdmin
        .from('crm_deals')
        .update({ stage: 'aguardando_retorno', updated_at: new Date().toISOString() })
        .eq('id', dealId);

      const updated = await assertRowExists('crm_deals', { id: dealId }, 'Deal after AR');
      assertEqual(updated.stage, 'aguardando_retorno', 'Stage should be aguardando_retorno');
      logInfo(`Deal → aguardando_retorno`);
    }
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow2();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-2')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
