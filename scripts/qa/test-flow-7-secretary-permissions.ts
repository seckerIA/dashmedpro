// =====================================================
// Flow 7: Secretary Permissions (RLS)
// Verifica que secretaria so ve dados de medicos vinculados
// Se usuario de teste nao for secretaria, pula com mensagem clara
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
  logSkip,
  buildFlowResult,
  assert,
  assertEqual,
  assertNotNull,
  reportResults,
} from './helpers.js';

const FLOW_NAME = 'Flow 7: Secretary Permissions (RLS)';

let userRole: string | null = null;
let linkedDoctorIds: string[] = [];

export async function runFlow7(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Detect user role
  // ==========================================
  results.push(await runTest('7.1 Detect test user role', async () => {
    logStep(1, 'Checking user role...');

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', getUserId())
      .single();

    userRole = profile?.role ?? null;
    logInfo(`User role: ${userRole ?? 'unknown'}`);

    // Check for secretary_doctor_links
    const { data: links } = await supabaseAdmin
      .from('secretary_doctor_links')
      .select('doctor_id')
      .eq('secretary_id', getUserId());

    linkedDoctorIds = (links ?? []).map((l: any) => l.doctor_id);
    logInfo(`Linked doctors: ${linkedDoctorIds.length > 0 ? linkedDoctorIds.join(', ') : 'none'}`);
  }));

  // ==========================================
  // Test: Secretary sees linked doctor data
  // ==========================================
  results.push(await runTest('7.2 Secretary can access linked doctor appointments', async () => {
    logStep(2, 'Testing access to linked doctor data...');

    if (userRole !== 'secretary' && linkedDoctorIds.length === 0) {
      logSkip('7.2', 'Test user is not a secretary with linked doctors');
      return; // Pass — not applicable
    }

    const doctorId = linkedDoctorIds[0];
    logInfo(`Testing with linked doctor: ${doctorId}`);

    // Query appointments of linked doctor via user client (respects RLS)
    const { data, error } = await supabaseUser
      .from('medical_appointments')
      .select('id, doctor_id')
      .eq('doctor_id', doctorId)
      .limit(5);

    // Should succeed (either returns data or empty array, but no RLS error)
    assert(!error, `RLS blocked linked doctor query: ${error?.message}`);
    logInfo(`Found ${data?.length ?? 0} appointments for linked doctor`);
  }));

  // ==========================================
  // Test: Secretary cannot see unlinked doctor data
  // ==========================================
  results.push(await runTest('7.3 Secretary cannot access unlinked doctor appointments', async () => {
    logStep(3, 'Testing access to unlinked doctor data...');

    if (userRole !== 'secretary' && linkedDoctorIds.length === 0) {
      logSkip('7.3', 'Test user is not a secretary — testing own-data isolation instead');

      // For non-secretary users: verify they can only see their own data
      const { data: ownAppts } = await supabaseUser
        .from('medical_appointments')
        .select('id, user_id')
        .limit(10);

      if (ownAppts && ownAppts.length > 0) {
        const allOwnData = ownAppts.every((a: any) => a.user_id === getUserId());
        assert(allOwnData, 'Non-secretary user sees appointments from other users');
        logInfo(`All ${ownAppts.length} appointments belong to current user — RLS OK`);
      } else {
        logInfo('No appointments found — RLS may be working (or no data)');
      }
      return;
    }

    // Find a doctor NOT linked to this secretary
    const { data: allDoctors } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'doctor')
      .not('id', 'in', `(${linkedDoctorIds.join(',')})`);

    if (!allDoctors || allDoctors.length === 0) {
      logSkip('7.3', 'No unlinked doctors found to test against');
      return;
    }

    const unlinkedDoctorId = allDoctors[0].id;
    logInfo(`Testing with unlinked doctor: ${unlinkedDoctorId}`);

    // Query appointments of unlinked doctor
    const { data, error } = await supabaseUser
      .from('medical_appointments')
      .select('id, doctor_id')
      .eq('doctor_id', unlinkedDoctorId)
      .limit(5);

    // Should return empty array (RLS blocks access)
    if (error) {
      logInfo(`RLS blocked query with error: ${error.message} — this is expected`);
    } else {
      assertEqual(data?.length ?? 0, 0, 'Should see 0 appointments from unlinked doctor');
      logInfo('Correctly returned 0 appointments for unlinked doctor — RLS OK');
    }
  }));

  // ==========================================
  // Test: Own data always accessible
  // ==========================================
  results.push(await runTest('7.4 User can always access own data', async () => {
    logStep(4, 'Testing own-data access...');

    // Create a test contact owned by this user
    const { data: contact, error: cErr } = await supabaseUser
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_Patient_Flow7`,
        phone: '11999990007',
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['qa_test'],
      })
      .select('id')
      .single();

    assert(!cErr, `Contact insert: ${cErr?.message}`);

    // Read it back via user client
    const { data: readBack, error: rErr } = await supabaseUser
      .from('crm_contacts')
      .select('id, full_name')
      .eq('id', contact!.id)
      .single();

    assert(!rErr, `Contact read: ${rErr?.message}`);
    assertNotNull(readBack, 'Read back contact');
    assertEqual(readBack.full_name, `${TEST_RUN_ID}_Patient_Flow7`, 'Contact name');
    logInfo(`Own data access verified for contact ${contact!.id}`);
  }));

  // ==========================================
  // Test: CRM deals respect RLS
  // ==========================================
  results.push(await runTest('7.5 CRM deals only show own user data via RLS', async () => {
    logStep(5, 'Testing CRM deals RLS...');

    const { data: deals } = await supabaseUser
      .from('crm_deals')
      .select('id, user_id')
      .limit(20);

    if (deals && deals.length > 0) {
      // All deals should belong to the user or to linked doctors
      const allowedIds = [getUserId(), ...linkedDoctorIds];
      const unauthorized = deals.filter((d: any) => !allowedIds.includes(d.user_id));

      if (unauthorized.length > 0) {
        logInfo(`WARNING: Found ${unauthorized.length} deals from unauthorized users`);
        assert(false, `RLS leak: ${unauthorized.length} deals from unauthorized users`);
      } else {
        logInfo(`All ${deals.length} deals belong to authorized users — RLS OK`);
      }
    } else {
      logInfo('No deals found — RLS working (or no data)');
    }
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow7();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-7')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
