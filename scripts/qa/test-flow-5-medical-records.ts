// =====================================================
// Flow 5: Medical Records + Prescriptions
// Verifica criacao de prontuario e prescricao linkados corretamente
// =====================================================

import { format } from 'date-fns';
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

const FLOW_NAME = 'Flow 5: Medical Records + Prescriptions';

let contactId: string;
let appointmentId: string;
let recordId: string;
let prescriptionId: string;

export async function runFlow5(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Setup: Contact + Appointment
  // ==========================================
  results.push(await runTest('5.1 Setup: contact + appointment', async () => {
    logStep(1, 'Creating contact and appointment...');

    const { data: contact, error: cErr } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow5`,
        phone: '11999990005',
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!cErr, `Contact: ${cErr?.message}`);
    contactId = contact!.id;

    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60 * 1000); // 1h ago (already happened)
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const { data: appt, error: aErr } = await supabaseUser
      .from('medical_appointments')
      .insert({
        user_id: getUserId(),
        doctor_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_Consulta_Flow5`,
        appointment_type: 'first_visit',
        status: 'completed',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: 30,
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!aErr, `Appointment: ${aErr?.message}`);
    appointmentId = appt!.id;
    logInfo(`Contact: ${contactId}, Appointment: ${appointmentId}`);
  }));

  // ==========================================
  // Create medical record
  // ==========================================
  results.push(await runTest('5.2 Create medical record linked to contact + appointment', async () => {
    logStep(2, 'Creating medical record...');

    const { data, error } = await supabaseUser
      .from('medical_records')
      .insert({
        contact_id: contactId,
        doctor_id: getUserId(),
        user_id: getUserId(),
        appointment_id: appointmentId,
        chief_complaint: `${TEST_RUN_ID}_Dor lombar cronica`,
        history_current_illness: 'Paciente relata dor lombar ha 6 meses',
        diagnostic_hypothesis: 'Lombalgia cronica - M54.5',
        treatment_plan: 'Fisioterapia 2x/semana + anti-inflamatorio',
        record_type: 'consultation',
        record_status: 'completed',
        cid_codes: ['M54.5'],
        allergies_noted: ['dipirona'],
        prescriptions: [
          {
            medication: 'Ibuprofeno',
            dosage: '600mg',
            frequency: '8/8h',
            duration: '7 dias',
            quantity: '21 comprimidos',
            route: 'oral',
          },
        ],
      })
      .select('id')
      .single();

    assert(!error, `Record: ${error?.message}`);
    assertNotNull(data, 'Medical record');
    recordId = data.id;
    logInfo(`Medical record: ${recordId}`);
  }));

  // ==========================================
  // Verify record links
  // ==========================================
  results.push(await runTest('5.3 Verify record linked to correct contact + doctor', async () => {
    logStep(3, 'Verifying record links...');

    const record = await assertRowExists('medical_records', { id: recordId }, 'Medical record');
    assertEqual(record.contact_id, contactId, 'Record contact_id');
    assertEqual(record.doctor_id, getUserId(), 'Record doctor_id');
    assertEqual(record.appointment_id, appointmentId, 'Record appointment_id');
    assertEqual(record.record_type, 'consultation', 'Record type');
    assertEqual(record.record_status, 'completed', 'Record status');
    logInfo(`Record links: contact=${contactId}, doctor=${getUserId()}, appointment=${appointmentId}`);
  }));

  // ==========================================
  // Create prescription
  // ==========================================
  results.push(await runTest('5.4 Create prescription linked to medical record', async () => {
    logStep(4, 'Creating prescription...');

    const { data, error } = await supabaseUser
      .from('prescriptions')
      .insert({
        contact_id: contactId,
        doctor_id: getUserId(),
        medical_record_id: recordId,
        medications: [
          {
            medication: 'Ibuprofeno',
            dosage: '600mg',
            frequency: '8/8h',
            duration: '7 dias',
            quantity: '21 comprimidos',
            route: 'oral',
          },
          {
            medication: 'Omeprazol',
            dosage: '20mg',
            frequency: '1x/dia em jejum',
            duration: '7 dias',
            quantity: '7 capsulas',
            route: 'oral',
          },
        ],
        notes: `${TEST_RUN_ID}_Prescricao_Flow5`,
        prescription_type: 'simple',
        prescription_date: format(new Date(), 'yyyy-MM-dd'),
      })
      .select('id')
      .single();

    assert(!error, `Prescription: ${error?.message}`);
    assertNotNull(data, 'Prescription');
    prescriptionId = data.id;
    logInfo(`Prescription: ${prescriptionId}`);
  }));

  // ==========================================
  // Verify prescription links
  // ==========================================
  results.push(await runTest('5.5 Verify prescription linked to correct record + contact', async () => {
    logStep(5, 'Verifying prescription links...');

    const rx = await assertRowExists('prescriptions', { id: prescriptionId }, 'Prescription');
    assertEqual(rx.medical_record_id, recordId, 'Prescription record_id');
    assertEqual(rx.contact_id, contactId, 'Prescription contact_id');
    assertEqual(rx.doctor_id, getUserId(), 'Prescription doctor_id');
    assertEqual(rx.prescription_type, 'simple', 'Prescription type');

    // Verify medications array
    assertNotNull(rx.medications, 'Medications array');
    assert(Array.isArray(rx.medications), 'Medications is array');
    assertEqual(rx.medications.length, 2, 'Medications count');
    logInfo(`Prescription has ${rx.medications.length} medications`);
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow5();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-5')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
