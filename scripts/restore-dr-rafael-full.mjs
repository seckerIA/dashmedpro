/**
 * Restaura conta Dr. Rafael: Auth (email/senha), profiles, organização + organization_members,
 * whatsapp_ai_config mínimo, bloco de horários na KB, doctor_working_hours.
 *
 * Requer no .env (raiz ou scripts/.env):
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso na raiz:
 *   node scripts/restore-dr-rafael-full.mjs
 *
 * Variáveis opcionais (env):
 *   RAFEL_RESTORE_EMAIL          (default: rafaelcarvalhomed@gmail.com)
 *   RAFEL_RESTORE_PASSWORD       (default: 12345678)
 *   RAFEL_RESTORE_NAME           (default: Dr. Rafael Carvalho)
 *   RAFEL_ORGANIZATION_ID        — se souber o UUID da clínica, usa este (não cria org nova)
 *   RAFEL_ORG_SLUG               (default: clinica-dr-rafael-carvalho) quando cria organização
 *   RAFEL_ORG_DISPLAY_NAME       (default: Clínica Dr. Rafael Carvalho)
 *   RAFEL_ORG_MEMBER_ROLE        (default: dono) em organization_members
 *
 * KB seed grande (Jessica/sofiaknowledge_base) continua ligada ao user UUID antigo nos SQL de migração;
 * se o id Auth for novo, migre registos em `sofia_knowledge_base` no SQL Editor (UPDATE ... WHERE user_id = 'antigo').
 */
import { supabaseAdmin } from './config.mjs';

const EMAIL = process.env.RAFEL_RESTORE_EMAIL || 'rafaelcarvalhomed@gmail.com';
const PASSWORD = process.env.RAFEL_RESTORE_PASSWORD || '12345678';
const FULL_NAME = process.env.RAFEL_RESTORE_NAME || 'Dr. Rafael Carvalho';
const FORCE_ORG_ID = process.env.RAFEL_ORGANIZATION_ID?.trim() || null;
const ORG_SLUG =
  process.env.RAFEL_ORG_SLUG?.trim().replace(/^\/+|\/+$/g, '') || 'clinica-dr-rafael-carvalho';
const ORG_NAME = process.env.RAFEL_ORG_DISPLAY_NAME || 'Clínica Dr. Rafael Carvalho';
const MEMBER_ROLE = process.env.RAFEL_ORG_MEMBER_ROLE || 'dono';

const KB_MARKER = 'HORÁRIO DE ATENDIMENTO DO DR. RAFAEL';
const KB_SNIPPET = `

${KB_MARKER}
• Segunda, terça, quinta e sexta: consultas das 9h às 17h.
• Quarta-feira: somente manhã, das 8h às 12h (não atende à tarde).
• Vagas para marcar: use sempre os horários que o sistema mostrar na agenda em tempo real; não invente horários fora dessa lista.`;

const WORKING_HOURS = [
  { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
  { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' },
  { day_of_week: 3, start_time: '08:00:00', end_time: '12:00:00' },
  { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00' },
  { day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00' },
];

/** @param {string} email */
async function findAuthUserIdByEmail(email) {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });
  if (error) throw error;
  const u = users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  return u?.id ?? null;
}

/** @param {string} userId */
async function resolveOrganizationId(userId) {
  if (FORCE_ORG_ID) {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', FORCE_ORG_ID)
      .maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error(`RAFEL_ORGANIZATION_ID inválido: ${FORCE_ORG_ID}`);
    return data.id;
  }

  const { data: memberships, error: mErr } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (mErr) throw mErr;
  if (memberships?.organization_id) return memberships.organization_id;

  const { data: bySlug, error: sErr } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle();
  if (sErr) throw sErr;
  if (bySlug?.id) return bySlug.id;

  const { data: inserted, error: iErr } = await supabaseAdmin
    .from('organizations')
    .insert({ name: ORG_NAME, slug: ORG_SLUG, plan: 'basic', status: 'active' })
    .select('id')
    .single();
  if (iErr) throw iErr;
  console.log(`✓ Organização criada: ${ORG_NAME} (${inserted.id}) slug=${ORG_SLUG}`);
  return inserted.id;
}

/** @param {string} organizationId @param {string} userId */
async function ensureMembership(organizationId, userId) {
  const payload = {
    organization_id: organizationId,
    user_id: userId,
    role: MEMBER_ROLE,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .from('organization_members')
    .upsert(payload, { onConflict: 'organization_id,user_id' });
  if (error) throw error;
  console.log(`✓ organization_members (${MEMBER_ROLE}) → org=${organizationId}`);
}

/** @param {string} userId @param {string} organizationId */
async function upsertProfile(userId, organizationId) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: EMAIL,
      full_name: FULL_NAME,
      role: 'medico',
      organization_id: organizationId,
      is_active: true,
      onboarding_completed: true,
      onboarding_completed_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
  console.log('✓ profiles (medico, onboarding ok, organization_id definido)');
}

/** @param {string} userId */
async function ensureWhatsAppAiAndHours(userId) {
  const { data: row, error: selErr } = await supabaseAdmin
    .from('whatsapp_ai_config')
    .select('id, knowledge_base')
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr) throw selErr;

  const basePatch = {
    agent_name: 'Sofia',
    clinic_name: ORG_NAME,
    specialist_name: FULL_NAME,
    auto_reply_enabled: true,
    updated_at: new Date().toISOString(),
  };

  if (!row) {
    const ins = {
      user_id: userId,
      ...basePatch,
      knowledge_base: KB_SNIPPET.trimStart(),
    };
    const { error: insErr } = await supabaseAdmin.from('whatsapp_ai_config').insert(ins);
    if (insErr) throw insErr;
    console.log('✓ whatsapp_ai_config criada (KB com horários Dr. Rafael)');
  } else {
    const kb = row.knowledge_base ?? '';
    const nextKb = kb.includes(KB_MARKER) ? kb : kb + KB_SNIPPET;
    const { error: upErr } = await supabaseAdmin
      .from('whatsapp_ai_config')
      .update({ ...basePatch, knowledge_base: nextKb })
      .eq('user_id', userId);
    if (upErr) throw upErr;
    console.log('✓ whatsapp_ai_config atualizada (horários na KB se faltavam)');
  }

  const { error: delErr } = await supabaseAdmin
    .from('doctor_working_hours')
    .delete()
    .eq('user_id', userId);
  if (delErr) throw delErr;

  const rows = WORKING_HOURS.map((w) => ({
    user_id: userId,
    day_of_week: w.day_of_week,
    start_time: w.start_time,
    end_time: w.end_time,
  }));
  const { error: whErr } = await supabaseAdmin.from('doctor_working_hours').insert(rows);
  if (whErr) throw whErr;
  console.log('✓ doctor_working_hours (Seg–Sex conforme migração Dr. Rafael)');
}

async function main() {
  try {
    console.log(`\n🔧 Restaurar conta Rafael → ${EMAIL}\n`);

    let userId = await findAuthUserIdByEmail(EMAIL);

    if (userId) {
      console.log('ℹ️  Utilizador já existe na Auth; a atualizar senha e metadata.');
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      });
      if (error) throw error;
    } else {
      console.log('ℹ️  Criando utilizador na Auth.');
      const { data: nu, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      });
      if (cErr) throw cErr;
      userId = nu.user.id;
      console.log('✓ Auth user criado:', userId);
    }

    const organizationId = await resolveOrganizationId(userId);
    await ensureMembership(organizationId, userId);
    await upsertProfile(userId, organizationId);
    await ensureWhatsAppAiAndHours(userId);

    console.log('\n✅ Concluído. Login:', EMAIL, '/', '(senha definida por RAFEL_RESTORE_PASSWORD)');
    console.log('   UUID Auth:', userId);
    console.log('   Organization:', organizationId);
    console.log(
      '\n   Se migrações KB (sofia_knowledge_base) estiverem ligadas ao UUID legado 8ce20d10-…,\n',
      '  execute UPDATE no SQL Editor para apontarem user_id =', userId,
    );
  } catch (e) {
    console.error('\n❌', e?.message ?? e);
    process.exit(1);
  }
}

main();
