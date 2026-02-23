// =====================================================
// QA Test Config — Doctor Strange
// Supabase clients, test user auth, cleanup utilities
// =====================================================

import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

// =====================================================
// Environment Variables
// =====================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('[FATAL] Missing environment variables. Check .env file.');
  process.exit(1);
}

// =====================================================
// Test Run ID — tags all QA data for cleanup
// =====================================================

export const TEST_RUN_ID = `QA_${Date.now()}`;

// Test user credentials
const TEST_USER_EMAIL = 'testemedpro@gmail.com';
const TEST_USER_PASSWORD = 'teste123456';

// =====================================================
// Supabase Clients
// =====================================================

// Admin client (service_role) — bypasses RLS, used for verification and cleanup
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// User client (anon key + auth) — respects RLS, simulates real user
export const supabaseUser: SupabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =====================================================
// Auth — Sign in as test user
// =====================================================

let _userId: string | null = null;
let _organizationId: string | null = null;

export async function authenticate(): Promise<{ userId: string; organizationId: string | null }> {
  const { data, error } = await supabaseUser.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error || !data.user) {
    console.error('[FATAL] Failed to authenticate test user:', error?.message);
    console.error('Make sure testemedpro@gmail.com exists with password teste123456');
    process.exit(1);
  }

  _userId = data.user.id;

  // Fetch organization_id from profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id')
    .eq('id', _userId)
    .single();

  _organizationId = profile?.organization_id ?? null;

  console.log(`[AUTH] Logged in as ${TEST_USER_EMAIL} (${_userId})`);
  console.log(`[AUTH] Organization: ${_organizationId ?? 'none'}`);
  console.log(`[AUTH] Test Run ID: ${TEST_RUN_ID}`);
  console.log('');

  return { userId: _userId, organizationId: _organizationId };
}

export function getUserId(): string {
  if (!_userId) throw new Error('Not authenticated. Call authenticate() first.');
  return _userId;
}

export function getOrganizationId(): string | null {
  return _organizationId;
}

// =====================================================
// Cleanup — Delete all QA test data by RUN_ID prefix
// =====================================================

export async function cleanup(): Promise<void> {
  console.log(`\n[CLEANUP] Removing test data for ${TEST_RUN_ID}...`);

  // Order matters — delete children before parents (FK constraints)
  const tables = [
    { name: 'inventory_movements', column: 'description', pattern: `%${TEST_RUN_ID}%` },
    { name: 'appointment_stock_usage', column: 'appointment_id', subquery: true },
    { name: 'financial_transactions', column: 'description', pattern: `%${TEST_RUN_ID}%` },
    { name: 'prescriptions', column: 'notes', pattern: `%${TEST_RUN_ID}%` },
    { name: 'medical_records', column: 'chief_complaint', pattern: `%${TEST_RUN_ID}%` },
    { name: 'medical_appointments', column: 'title', pattern: `%${TEST_RUN_ID}%` },
    { name: 'whatsapp_messages', column: 'content', pattern: `%${TEST_RUN_ID}%` },
    { name: 'whatsapp_conversations', column: 'contact_name', pattern: `%${TEST_RUN_ID}%` },
    { name: 'crm_deals', column: 'title', pattern: `%${TEST_RUN_ID}%` },
    { name: 'inventory_batches', column: 'batch_number', pattern: `%${TEST_RUN_ID}%` },
    { name: 'inventory_items', column: 'name', pattern: `%${TEST_RUN_ID}%` },
    { name: 'crm_contacts', column: 'full_name', pattern: `%${TEST_RUN_ID}%` },
  ];

  for (const table of tables) {
    if (table.subquery) {
      // appointment_stock_usage — delete by appointment_id that matches our test appointments
      const { data: appointments } = await supabaseAdmin
        .from('medical_appointments')
        .select('id')
        .like('title', `%${TEST_RUN_ID}%`);

      if (appointments && appointments.length > 0) {
        const ids = appointments.map((a: any) => a.id);
        const { error } = await supabaseAdmin
          .from(table.name)
          .delete()
          .in('appointment_id', ids);
        if (error) console.warn(`  [WARN] ${table.name}: ${error.message}`);
        else console.log(`  [OK] ${table.name}: cleaned`);
      }
    } else {
      const { error } = await supabaseAdmin
        .from(table.name)
        .delete()
        .like(table.column!, table.pattern!);

      if (error) console.warn(`  [WARN] ${table.name}: ${error.message}`);
      else console.log(`  [OK] ${table.name}: cleaned`);
    }
  }

  console.log('[CLEANUP] Done.\n');
}

// =====================================================
// Financial Account — Get first active account for test user
// =====================================================

export async function getFirstFinancialAccount(): Promise<{ id: string; current_balance: number } | null> {
  const { data } = await supabaseAdmin
    .from('financial_accounts')
    .select('id, current_balance')
    .eq('user_id', getUserId())
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .limit(1)
    .single();

  return data;
}

// =====================================================
// Financial Category — Get first 'entrada' category
// =====================================================

export async function getFirstEntradaCategory(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('financial_categories')
    .select('id')
    .eq('organization_id', getOrganizationId())
    .eq('type', 'entrada')
    .limit(1)
    .single();

  return data?.id ?? null;
}
