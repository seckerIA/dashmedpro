/**
 * Idempotência próxima ao `admin-portal` action:create: cria organização + utilizador Auth
 * ou reutiliza utilizador existente, liga `organization_members` e atualiza `profiles` como dono.
 *
 * Variáveis de ambiente (todas obrigatórias):
 *   CLINIC_NAME       — nome da clínica
 *   CLINIC_SLUG       — único em organizations.slug (será normalizado para minúsculas)
 *   OWNER_EMAIL
 *   OWNER_PASSWORD
 *   OWNER_FULL_NAME   — nome exibido
 *
 * Carrega SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY via scripts/config.mjs (.env na raíz).
 *
 * PowerShell:
 *   $env:CLINIC_NAME="..."; $env:CLINIC_SLUG="..."; $env:OWNER_EMAIL="..."; $env:OWNER_PASSWORD="..."; $env:OWNER_FULL_NAME="..."; node scripts/create-clinic-owner.mjs
 */
import { supabaseAdmin } from './config.mjs';

const clinicName = process.env.CLINIC_NAME?.trim();
const slug = process.env.CLINIC_SLUG?.trim().toLowerCase().replace(/\s+/g, '-');
const ownerEmail = process.env.OWNER_EMAIL?.trim();
const ownerPassword = process.env.OWNER_PASSWORD;
const ownerFullName = process.env.OWNER_FULL_NAME?.trim();

function requireEnv(ok, msg) {
  if (!ok) {
    console.error(`\n❌ ${msg}\n`);
    process.exit(1);
  }
}

requireEnv(!!clinicName, 'CLINIC_NAME obrigatório.');
requireEnv(!!slug, 'CLINIC_SLUG obrigatório.');
requireEnv(!!ownerEmail, 'OWNER_EMAIL obrigatório.');
requireEnv(typeof ownerPassword === 'string' && ownerPassword.length > 0, 'OWNER_PASSWORD obrigatório.');
requireEnv(!!ownerFullName, 'OWNER_FULL_NAME obrigatório.');

async function findAuthUserByEmail(em) {
  const target = em.toLowerCase();
  let page = 1;
  const perPage = 500;
  for (;;) {
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const u = list.users.find((x) => (x.email || '').toLowerCase() === target);
    if (u) return u;
    if (list.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log('\n📦 Organização:', clinicName);
  console.log('   slug:', slug);

  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name: clinicName, slug, status: 'active', plan: 'pro' })
    .select()
    .single();

  if (orgError) {
    if (orgError.code === '23505' || String(orgError.message).includes('duplicate')) {
      console.error('\n❌ Este slug já existe. Use outro CLINIC_SLUG.');
    }
    throw orgError;
  }

  console.log('✓ Organização criada:', org.id);

  let userId;
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { full_name: ownerFullName },
  });

  if (createErr) {
    const existing = await findAuthUserByEmail(ownerEmail);
    if (existing) {
      console.log('ℹ️ Utilizador Auth já existia:', existing.id);
      userId = existing.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: ownerPassword,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), full_name: ownerFullName },
      });
      if (updErr) throw updErr;
      console.log('✓ Senha e metadatos atualizados.');
    } else {
      console.error(createErr.message);
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      throw new Error('createUser falhou e email não existe em Auth — organização nova removida.');
    }
  } else {
    userId = created.user.id;
    console.log('✓ conta Auth nova:', userId);
  }

  const { error: memErr } = await supabaseAdmin.from('organization_members').upsert(
    {
      organization_id: org.id,
      user_id: userId,
      role: 'dono',
    },
    { onConflict: 'organization_id,user_id' },
  );

  if (memErr) throw memErr;
  console.log('✓ organization_members como dono');

  const { error: profErr } = await supabaseAdmin
    .from('profiles')
    .update({
      organization_id: org.id,
      role: 'dono',
      full_name: ownerFullName,
      email: ownerEmail,
      is_super_admin: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profErr) throw profErr;
  console.log('✓ profiles como dono da organização');

  console.log(`
✅ A cliente faz login na mesma URL da plataforma, rota /login
   Email: ${ownerEmail}
`);
}

await main();
