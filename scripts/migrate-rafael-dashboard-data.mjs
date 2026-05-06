/**
 * Reatribui dados do dashboard do UUID legado ao utilizador Auth actual (mesmo email).
 * Útil quando foi criada conta nova e a org vazia: CRM/agenda/WhatsApp continuam com user_id antigo.
 *
 * Requer .env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (scripts/config.mjs)
 *
 *   node scripts/migrate-rafael-dashboard-data.mjs --dry-run    (recomendado 1º)
 *   node scripts/migrate-rafael-dashboard-data.mjs --apply
 *
 * Env opcional:
 *   RAFEL_RESTORE_EMAIL            (default rafaelcarvalhomed@gmail.com)
 *   RAFEL_LEGACY_USER_ID         (default 8ce20d10-5c49-4bb1-b086-9c2e1ede286d)
 *   RAFEL_SOURCE_ORGANIZATION_ID — força organization_id no profile + membership (senão usa org do perfil legado)
 *
 * --apply também:
 *   - remove whatsapp_ai_config e doctor_working_hours do user NOVO (para evitar UNIQUE / duplicados) antes de reatribuir do legado
 *   - faz upsert organization_members (dono) na org de origem
 */
import { supabaseAdmin } from './config.mjs';

const EMAIL = process.env.RAFEL_RESTORE_EMAIL || 'rafaelcarvalhomed@gmail.com';
const LEGACY_USER_ID =
  process.env.RAFEL_LEGACY_USER_ID || '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

const DRY = process.argv.includes('--dry-run') || process.argv.includes('-n');
const APPLY = process.argv.includes('--apply');
const DISCOVER = process.argv.includes('--discover');

if (!DRY && !APPLY && !DISCOVER) {
  console.error('Use --dry-run, --apply ou --discover');
  process.exit(1);
}

/** Principais donos de crm_contacts (útil quando o UUID legado não existe neste projeto). */
async function discoverContactOwners(limit = 20) {
  const { data, error } = await supabaseAdmin.from('crm_contacts').select('user_id').limit(8000);
  if (error) {
    console.error('discover:', error.message);
    return;
  }
  const map = new Map();
  for (const row of data || []) {
    const u = row.user_id;
    if (!u) continue;
    map.set(u, (map.get(u) || 0) + 1);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  console.log('\n--- Top user_id em crm_contacts (amostra até 8000 linhas) ---');
  for (const [uid, n] of sorted) {
    const p = await findProfileById(uid);
    const label = p ? `${p.email || '?'} (${p.full_name || 'sem nome'})` : '(sem profile)';
    console.log(`  ${n} contactos → ${uid}  ${label}`);
  }
  if (!sorted.length) console.log('  (nenhum contacto)');
}

/** @param {string} table @param {string} col @param {string} fromId */
async function countWhere(table, col, fromId) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select(col, { count: 'exact', head: true })
    .eq(col, fromId);
  if (error) return { table, col, error: error.message, count: null };
  return { table, col, count: count ?? 0, error: null };
}

/** @param {string} table @param {string} col @param {string} fromId @param {string} toId */
async function updateWhere(table, col, fromId, toId) {
  const { data, error } = await supabaseAdmin.from(table).update({ [col]: toId }).eq(col, fromId).select('id');
  if (error) return { table, col, error: error.message, updated: 0 };
  return { table, col, updated: data?.length ?? 0, error: null };
}

async function findProfileByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, organization_id, full_name')
    .ilike('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findProfileById(id) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, organization_id, full_name')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @typedef {{ table: string, column: string }} Col */

/** @type {Col[]} */
const USER_ID_REASSIGN = [
  { table: 'crm_contacts', column: 'user_id' },
  { table: 'crm_activities', column: 'user_id' },
  { table: 'crm_deals', column: 'user_id' },
  { table: 'commercial_leads', column: 'user_id' },
  { table: 'commercial_sales', column: 'user_id' },
  { table: 'whatsapp_config', column: 'user_id' },
  { table: 'whatsapp_conversations', column: 'user_id' },
  { table: 'whatsapp_messages', column: 'user_id' },
  { table: 'whatsapp_ai_suggestions', column: 'user_id' },
  { table: 'whatsapp_conversation_analysis', column: 'user_id' },
  { table: 'whatsapp_lead_qualifications', column: 'user_id' },
  { table: 'sofia_knowledge_base', column: 'user_id' },
  { table: 'medical_appointments', column: 'user_id' },
  { table: 'financial_accounts', column: 'user_id' },
  { table: 'financial_transactions', column: 'user_id' },
  { table: 'financial_categories', column: 'user_id' },
  { table: 'inventory_items', column: 'user_id' },
  { table: 'inventory_transactions', column: 'user_id' },
  { table: 'inventory_batches', column: 'user_id' },
  { table: 'inventory_suppliers', column: 'user_id' },
  { table: 'ad_platform_connections', column: 'user_id' },
];

/** @type {Col[]} */
const DOCTOR_ID_REASSIGN = [
  { table: 'medical_appointments', column: 'doctor_id' },
  { table: 'medical_records', column: 'doctor_id' },
];

/** @type {Col[]} */
const OTHER_UUID_REASSIGN = [
  { table: 'crm_deals', column: 'assigned_to' },
  { table: 'tasks', column: 'user_id' },
  { table: 'tasks', column: 'assigned_to' },
  { table: 'tasks', column: 'created_by' },
];

/** @param {string} oldUserId */
async function inferOrgFromContacts(oldUserId) {
  const { data, error } = await supabaseAdmin
    .from('crm_contacts')
    .select('organization_id')
    .eq('user_id', oldUserId)
    .not('organization_id', 'is', null)
    .limit(1)
    .maybeSingle();
  if (error || !data?.organization_id) return null;
  return data.organization_id;
}

async function main() {
  if (DISCOVER) {
    console.log('URL:', process.env.SUPABASE_URL?.slice(0, 40), '…');
    await discoverContactOwners(25);
    console.log('\nSe vir o UID certo acima: RAFEL_LEGACY_USER_ID=<uid> node … --dry-run');
    return;
  }

  const current = await findProfileByEmail(EMAIL);
  if (!current?.id) {
    console.error('Não há profile com email', EMAIL, '— corra restore-dr-rafael-full.mjs primeiro.');
    process.exit(1);
  }

  const newUserId = current.id;
  const oldUserId = LEGACY_USER_ID;

  if (newUserId === oldUserId) {
    console.log('O utilizador actual já é o UUID legado; nada a migrar.');
    process.exit(0);
  }

  const legacyProfile = await findProfileById(oldUserId);
  let sourceOrg =
    process.env.RAFEL_SOURCE_ORGANIZATION_ID?.trim() ||
    legacyProfile?.organization_id ||
    null;
  const orgFromContacts = await inferOrgFromContacts(oldUserId);
  if (!sourceOrg) sourceOrg = orgFromContacts;
  if (!sourceOrg) sourceOrg = current.organization_id || null;

  console.log('\n=== Migração dashboard Rafael ===');
  console.log('Modo:', DRY ? 'DRY-RUN (sem escrita)' : 'APPLY');
  console.log('Email:', EMAIL);
  console.log('UUID actual (novo login):', newUserId);
  console.log('UUID legado (origem dos dados):', oldUserId);
  console.log('organization_id alvo (profile + membership):', sourceOrg || '(não resolvido)');
  if (legacyProfile) console.log('Profile legado encontrado:', legacyProfile.email, legacyProfile.full_name);
  else console.log('Profile legado não existe (normal se auth antigo foi removido — dados podem continuar com user_id legado).');

  const jobs = [
    ...USER_ID_REASSIGN,
    ...DOCTOR_ID_REASSIGN,
    ...OTHER_UUID_REASSIGN,
  ];

  console.log('\n--- Contagens onde coluna = legado ---');
  let legacyTotal = 0;
  for (const { table, column } of jobs) {
    const r = await countWhere(table, column, oldUserId);
    if (r.error) console.log(`  ${table}.${column}: (skip) ${r.error}`);
    else if (r.count) {
      console.log(`  ${table}.${column}: ${r.count}`);
      legacyTotal += r.count;
    }
  }

  const { count: memOld } = await supabaseAdmin
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', oldUserId);
  const { count: memNew } = await supabaseAdmin
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', newUserId);
  console.log('  organization_members (legado):', memOld ?? 0);
  console.log('  organization_members (novo):', memNew ?? 0);
  legacyTotal += memOld ?? 0;

  const wcOld = await countWhere('whatsapp_ai_config', 'user_id', oldUserId);
  const wcNew = await countWhere('whatsapp_ai_config', 'user_id', newUserId);
  console.log('  whatsapp_ai_config legado:', wcOld.count ?? wcOld.error);
  console.log('  whatsapp_ai_config novo:', wcNew.count ?? wcNew.error);
  if (typeof wcOld.count === 'number') legacyTotal += wcOld.count;

  const { count: sdlDoctor } = await supabaseAdmin
    .from('secretary_doctor_links')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', oldUserId);
  console.log('  secretary_doctor_links (doctor_id=legado):', sdlDoctor ?? 0);
  legacyTotal += sdlDoctor ?? 0;

  if (legacyTotal === 0) {
    console.log(
      '\n⚠️  Nenhum dado encontrado com user_id / doctor_id = UUID legado neste projeto Supabase.',
    );
    console.log(
      '   Os dados do dashboard podem estar noutro project ref (ex.: produção adzaq…) ou noutro user_id.',
    );
    console.log('   Corra: node scripts/migrate-rafael-dashboard-data.mjs --discover');
  }

  if (DRY) {
    console.log(
      '\nDry-run concluído. Se as contagens fazem sentido, execute: node scripts/migrate-rafael-dashboard-data.mjs --apply',
    );
    return;
  }

  if (!sourceOrg) {
    console.error(
      '\nSem organization_id de origem. Defina RAFEL_SOURCE_ORGANIZATION_ID ou garanta profile legado com organization_id.',
    );
    process.exit(1);
  }

  console.log('\n--- Aplicando ---');

  const { error: d1 } = await supabaseAdmin.from('whatsapp_ai_config').delete().eq('user_id', newUserId);
  if (d1) console.warn('whatsapp_ai_config delete novo:', d1.message);
  else console.log('✓ whatsapp_ai_config duplicada do user novo removida (se existia)');

  const { error: d2 } = await supabaseAdmin.from('doctor_working_hours').delete().eq('user_id', newUserId);
  if (d2) console.warn('doctor_working_hours delete novo:', d2.message);
  else console.log('✓ doctor_working_hours do user novo removidos (serão reatribuídos do legado)');

  for (const { table, column } of jobs) {
    const r = await updateWhere(table, column, oldUserId, newUserId);
    if (r.error) console.warn(`  ${table}.${column}: ${r.error}`);
    else if (r.updated) console.log(`  ${table}.${column}: ${r.updated} linhas`);
  }

  const { data: sdlRows, error: sdlErr } = await supabaseAdmin
    .from('secretary_doctor_links')
    .update({ doctor_id: newUserId })
    .eq('doctor_id', oldUserId)
    .select('id');
  if (sdlErr) console.warn('secretary_doctor_links:', sdlErr.message);
  else if (sdlRows?.length) console.log('  secretary_doctor_links.doctor_id:', sdlRows.length, 'linhas');

  const { data: aiRows, error: aiErr } = await supabaseAdmin
    .from('whatsapp_ai_config')
    .update({ user_id: newUserId, updated_at: new Date().toISOString() })
    .eq('user_id', oldUserId)
    .select('id');
  if (aiErr) console.warn('whatsapp_ai_config:', aiErr.message);
  else if (aiRows?.length) console.log('  whatsapp_ai_config.user_id:', aiRows.length, 'linhas');

  const { error: pErr } = await supabaseAdmin
    .from('profiles')
    .update({
      organization_id: sourceOrg,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newUserId);
  if (pErr) console.warn('profiles organization_id:', pErr.message);
  else console.log('✓ profiles.organization_id →', sourceOrg);

  const { error: omErr } = await supabaseAdmin.from('organization_members').upsert(
    {
      organization_id: sourceOrg,
      user_id: newUserId,
      role: 'dono',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' },
  );
  if (omErr) console.warn('organization_members:', omErr.message);
  else console.log('✓ organization_members (dono) na org de origem');

  const { data: dwh, error: dwhErr } = await supabaseAdmin
    .from('doctor_working_hours')
    .update({ user_id: newUserId })
    .eq('user_id', oldUserId)
    .select('id');
  if (dwhErr) console.warn('doctor_working_hours:', dwhErr.message);
  else if (dwh?.length) console.log('  doctor_working_hours:', dwh.length, 'linhas');

  console.log(
    '\n✅ Migração aplicada. Faça login com', EMAIL, 'e confirme CRM, agenda e WhatsApp.',
  );
  console.log(
    '   Org vazia criada no restore pode ficar órfã — apague manualmente no Dashboard se quiser.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
