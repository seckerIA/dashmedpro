// =====================================================
// Flow 6: WhatsApp Auto-Lead Creation
// Simula: numero desconhecido envia mensagem → auto-cria contato + deal
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

const FLOW_NAME = 'Flow 6: WhatsApp Auto-Lead Creation';

const UNKNOWN_PHONE = `5511${TEST_RUN_ID.replace(/\D/g, '').slice(-8)}`;
let conversationId: string;
let contactId: string;
let dealId: string;

export async function runFlow6(): Promise<FlowResult> {
  logFlowHeader(FLOW_NAME);
  const startTime = Date.now();
  const results: TestResult[] = [];

  // ==========================================
  // Test: Create WhatsApp conversation (simulates webhook)
  // ==========================================
  results.push(await runTest('6.1 Create WhatsApp conversation for unknown number', async () => {
    logStep(1, 'Simulating incoming message from unknown number...');

    const { data, error } = await supabaseAdmin
      .from('whatsapp_conversations')
      .insert({
        user_id: getUserId(),
        phone_number: UNKNOWN_PHONE,
        contact_name: `${TEST_RUN_ID}_WhatsApp_Lead`,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        status: 'open',
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!error, `Conversation: ${error?.message}`);
    assertNotNull(data, 'Conversation');
    conversationId = data.id;
    logInfo(`Conversation: ${conversationId} (phone: ${UNKNOWN_PHONE})`);
  }));

  // ==========================================
  // Test: Auto-create CRM contact
  // ==========================================
  results.push(await runTest('6.2 Auto-create CRM contact with whatsapp_auto tag', async () => {
    logStep(2, 'Creating CRM contact from WhatsApp...');

    const { data, error } = await supabaseAdmin
      .from('crm_contacts')
      .insert({
        full_name: `${TEST_RUN_ID}_WhatsApp_Lead`,
        phone: UNKNOWN_PHONE,
        user_id: getUserId(),
        organization_id: getOrganizationId(),
        tags: ['whatsapp_auto', 'qa_test'],
      })
      .select('id')
      .single();

    assert(!error, `Contact: ${error?.message}`);
    assertNotNull(data, 'Contact');
    contactId = data.id;
    logInfo(`Contact created: ${contactId}`);

    // Link contact to conversation
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ contact_id: contactId })
      .eq('id', conversationId);
  }));

  // ==========================================
  // Test: Auto-create CRM deal at lead_novo
  // ==========================================
  results.push(await runTest('6.3 Auto-create CRM deal at stage lead_novo', async () => {
    logStep(3, 'Creating CRM deal for auto-lead...');

    const { data, error } = await supabaseAdmin
      .from('crm_deals')
      .insert({
        user_id: getUserId(),
        contact_id: contactId,
        title: `${TEST_RUN_ID}_WhatsApp_Deal`,
        stage: 'lead_novo',
        value: 0,
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!error, `Deal: ${error?.message}`);
    assertNotNull(data, 'Deal');
    dealId = data.id;
    logInfo(`Deal created: ${dealId} → lead_novo`);
  }));

  // ==========================================
  // Verify: All three records linked correctly
  // ==========================================
  results.push(await runTest('6.4 Verify contact, deal, and conversation linked', async () => {
    logStep(4, 'Verifying cross-table links...');

    // Contact exists with correct phone
    const contact = await assertRowExists('crm_contacts', { id: contactId }, 'Contact');
    assertEqual(contact.phone, UNKNOWN_PHONE, 'Contact phone');
    assert(contact.tags?.includes('whatsapp_auto'), 'Contact has whatsapp_auto tag');

    // Deal linked to contact
    const deal = await assertRowExists('crm_deals', { id: dealId }, 'Deal');
    assertEqual(deal.contact_id, contactId, 'Deal contact_id');
    assertEqual(deal.stage, 'lead_novo', 'Deal stage');

    // Conversation linked to contact
    const conv = await assertRowExists('whatsapp_conversations', { id: conversationId }, 'Conversation');
    assertEqual(conv.contact_id, contactId, 'Conversation contact_id');
    assertEqual(conv.phone_number, UNKNOWN_PHONE, 'Conversation phone');

    logInfo('All cross-table links verified successfully');
  }));

  // ==========================================
  // Test: Simulate first message in conversation
  // ==========================================
  results.push(await runTest('6.5 First message stored in whatsapp_messages', async () => {
    logStep(5, 'Inserting simulated inbound message...');

    const { data, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        content: `${TEST_RUN_ID}_Ola, gostaria de agendar uma consulta`,
        direction: 'inbound',
        message_type: 'text',
        status: 'delivered',
        phone_number: UNKNOWN_PHONE,
        sent_at: new Date().toISOString(),
        user_id: getUserId(),
        organization_id: getOrganizationId(),
      })
      .select('id')
      .single();

    assert(!error, `Message: ${error?.message}`);
    assertNotNull(data, 'Message');
    logInfo(`Message stored: ${data.id}`);

    // Verify message linked to conversation
    const msg = await assertRowExists('whatsapp_messages', { id: data.id }, 'Message');
    assertEqual(msg.conversation_id, conversationId, 'Message conversation_id');
    assertEqual(msg.direction, 'inbound', 'Message direction');
  }));

  return buildFlowResult(FLOW_NAME, results, startTime);
}

// =====================================================
// Standalone execution
// =====================================================

async function main() {
  await authenticate();
  const result = await runFlow6();
  reportResults([result]);
  await cleanup();
  process.exit(result.failed > 0 ? 1 : 0);
}

// Only run standalone when executed directly (not imported by run-all)
if (process.argv[1]?.includes('test-flow-6')) {
  main().catch(err => {
    console.error('[FATAL]', err);
    cleanup().finally(() => process.exit(1));
  });
}
