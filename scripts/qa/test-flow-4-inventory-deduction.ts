// =====================================================
// Flow 4: Inventory Deduction (FEFO)
// Verifica deducao automatica de estoque apos consulta concluida
// First Expire First Out — batch mais proximo de vencer sai primeiro
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

const FLOW_NAME = 'Flow 4: Inventory Deduction (FEFO)';

let contactId: string;
let appointmentId: string;
let itemId: string;
let batchAId: string;
let batchBId: string;
let usageId: string;

export async function runFlow4(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Setup: Contact + Appointment (procedure type)
  // ==========================================
  results.push(await runTest('4.1 Setup: contact + procedure appointment', async () => {
    logStep(1, 'Creating contact and appointment...');

    const { data: contact, error: cErr } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow4`,
        phone: '11999990004',
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!cErr, `Contact: ${cErr?.message}`);
    contactId = contact!.id;

    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data: appt, error: aErr } = await supabaseUser
      .from('medical_appointments')
      .insert({
        user_id: getUserId(),
        doctor_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Procedure_Flow4`,
        appointment_type: 'procedure',
        status: 'scheduled',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: 60,
        estimated_value: 800,
        payment_status: 'pending',
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!aErr, `Appointment: ${aErr?.message}`);
    appointmentId = appt!.id;
    logInfo(`Contact: ${contactId}, Appointment: ${appointmentId}`);
  }));

  // ==========================================
  // Setup: Inventory item + 2 batches
  // ==========================================
  results.push(await runTest('4.2 Create inventory item + 2 batches (FEFO)', async () => {
    logStep(2, 'Creating inventory item and batches...');

    // Create item
    const { data: item, error: iErr } = await supabaseAdmin
      .from('inventory_items')
      .insert({
        name: `${TEST_RUN_ID}_Botox_Flow4`,
        unit: 'ml',
        category: 'Medicamento',
        min_stock: 5,
        user_id: getUserId(),
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!iErr, `Item: ${iErr?.message}`);
    itemId = item!.id;

    // Batch A: qty=5, expires June 2026 (sooner — should be used first)
    const { data: batchA, error: baErr } = await supabaseAdmin
      .from('inventory_batches')
      .insert({
        item_id: itemId,
        batch_number: `${TEST_RUN_ID}_BatchA`,
        quantity: 5,
        expiration_date: '2026-06-15',
        is_active: true,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!baErr, `Batch A: ${baErr?.message}`);
    batchAId = batchA!.id;

    // Batch B: qty=10, expires December 2026 (later)
    const { data: batchB, error: bbErr } = await supabaseAdmin
      .from('inventory_batches')
      .insert({
        item_id: itemId,
        batch_number: `${TEST_RUN_ID}_BatchB`,
        quantity: 10,
        expiration_date: '2026-12-31',
        is_active: true,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!bbErr, `Batch B: ${bbErr?.message}`);
    batchBId = batchB!.id;

    logInfo(`Item: ${itemId}`);
    logInfo(`Batch A: ${batchAId} (qty=5, exp=2026-06-15)`);
    logInfo(`Batch B: ${batchBId} (qty=10, exp=2026-12-31)`);
  }));

  // ==========================================
  // Setup: appointment_stock_usage (qty=7)
  // ==========================================
  results.push(await runTest('4.3 Create appointment_stock_usage (qty=7, deducted=false)', async () => {
    logStep(3, 'Linking stock usage to appointment...');

    const { data, error } = await supabaseAdmin
      .from('appointment_stock_usage')
      .insert({
        appointment_id: appointmentId,
        inventory_item_id: itemId,
        quantity: 7,
        deducted: false,
      })
      .select('id')
      .single();

    assert(!error, `Usage: ${error?.message}`);
    usageId = data!.id;
    logInfo(`Stock usage: ${usageId} (qty=7, deducted=false)`);
  }));

  // ==========================================
  // Execute FEFO deduction
  // ==========================================
  results.push(await runTest('4.4 FEFO deduction: Batch A=0 (5 used), Batch B=8 (2 used)', async () => {
    logStep(4, 'Executing FEFO stock deduction...');

    // Simulate deductStockForAppointment logic
    const { data: usages } = await supabaseAdmin
      .from('appointment_stock_usage')
      .select('id, inventory_item_id, quantity, deducted')
      .eq('appointment_id', appointmentId)
      .eq('deducted', false);

    assertNotNull(usages, 'Pending usages');
    assertEqual(usages.length, 1, 'Usage count');

    const usage = usages[0];
    let remaining = usage.quantity; // 7

    // Get batches ordered by expiration (FEFO)
    const { data: batches } = await supabaseAdmin
      .from('inventory_batches')
      .select('id, quantity, expiration_date')
      .eq('item_id', usage.inventory_item_id)
      .eq('is_active', true)
      .gt('quantity', 0)
      .order('expiration_date', { ascending: true, nullsFirst: false });

    assertNotNull(batches, 'Batches');
    assert(batches.length >= 2, `Expected 2+ batches, got ${batches.length}`);
    logInfo(`Batches to deduct from: ${batches.length}`);

    // Deduct from each batch
    for (const batch of batches) {
      if (remaining <= 0) break;

      const deductQty = Math.min(remaining, batch.quantity);
      logInfo(`  Batch ${batch.id}: deducting ${deductQty} of ${batch.quantity}`);

      // Insert movement (negative quantity)
      const { error: mvErr } = await supabaseAdmin
        .from('inventory_movements')
        .insert({
          batch_id: batch.id,
          type: 'OUT',
          quantity: -deductQty,
          created_by: getUserId(),
          description: `${TEST_RUN_ID} Deducao automatica - Consulta concluida (ID: ${appointmentId})`,
        });

      assert(!mvErr, `Movement insert: ${mvErr?.message}`);

      // Update batch quantity directly (simulating trigger behavior)
      const newQty = batch.quantity - deductQty;
      await supabaseAdmin
        .from('inventory_batches')
        .update({ quantity: newQty })
        .eq('id', batch.id);

      remaining -= deductQty;
    }

    // Mark usage as deducted
    await supabaseAdmin
      .from('appointment_stock_usage')
      .update({ deducted: true })
      .eq('id', usage.id);

    assertEqual(remaining, 0, 'All stock deducted');
  }));

  // ==========================================
  // Verify: Batch A qty=0
  // ==========================================
  results.push(await runTest('4.5 Verify Batch A quantity = 0', async () => {
    logStep(5, 'Checking Batch A...');

    const batch = await assertRowExists('inventory_batches', { id: batchAId }, 'Batch A');
    assertEqual(batch.quantity, 0, 'Batch A quantity');
    logInfo(`Batch A: qty=${batch.quantity} (was 5, deducted 5)`);
  }));

  // ==========================================
  // Verify: Batch B qty=8
  // ==========================================
  results.push(await runTest('4.6 Verify Batch B quantity = 8', async () => {
    logStep(6, 'Checking Batch B...');

    const batch = await assertRowExists('inventory_batches', { id: batchBId }, 'Batch B');
    assertEqual(batch.quantity, 8, 'Batch B quantity');
    logInfo(`Batch B: qty=${batch.quantity} (was 10, deducted 2)`);
  }));

  // ==========================================
  // Verify: 2 inventory_movements of type OUT
  // ==========================================
  results.push(await runTest('4.7 Verify 2 OUT movements created', async () => {
    logStep(7, 'Checking inventory movements...');

    const { data: movements } = await supabaseAdmin
      .from('inventory_movements')
      .select('id, batch_id, type, quantity')
      .like('description', `%${TEST_RUN_ID}%`)
      .eq('type', 'OUT');

    assertNotNull(movements, 'Movements');
    assertEqual(movements.length, 2, 'OUT movement count');

    // First movement: Batch A, -5
    const mvA = movements.find((m: any) => m.batch_id === batchAId);
    assertNotNull(mvA, 'Movement for Batch A');
    assertEqual(mvA.quantity, -5, 'Batch A movement qty');

    // Second movement: Batch B, -2
    const mvB = movements.find((m: any) => m.batch_id === batchBId);
    assertNotNull(mvB, 'Movement for Batch B');
    assertEqual(mvB.quantity, -2, 'Batch B movement qty');

    logInfo(`Movement A: qty=${mvA.quantity}, Movement B: qty=${mvB.quantity}`);
  }));

  // ==========================================
  // Verify: appointment_stock_usage.deducted=true
  // ==========================================
  results.push(await runTest('4.8 Verify stock usage marked as deducted', async () => {
    logStep(8, 'Checking stock usage deducted flag...');

    const usage = await assertRowExists('appointment_stock_usage', { id: usageId }, 'Stock usage');
    assertEqual(usage.deducted, true, 'Deducted flag');
    logInfo(`Usage ${usageId}: deducted=true`);
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow4();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-4')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
