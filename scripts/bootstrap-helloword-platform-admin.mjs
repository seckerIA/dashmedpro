/**
 * Cria ou atualiza o utilizador da plataforma (Super Admin) para aceder ao /admin via admin-portal.
 * Credenciais (sobreponíveis por env):
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD
 *   BOOTSTRAP_ADMIN_NAME
 *
 * Uso na raiz (com .env ou scripts/.env com SUPABASE_SERVICE_ROLE_KEY):
 *   node scripts/bootstrap-helloword-platform-admin.mjs
 */
import { supabaseAdmin } from './config.mjs';

const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'helloword.txt@gmail.com';
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || '12345678';
const FULL_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador DashMed';

async function main() {
  try {
    console.log(`\n🔧 Bootstrap Super Admin (${EMAIL})...\n`);

    let userId;

    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    if (listErr) throw listErr;

    const existing = users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

    if (existing) {
      console.log('ℹ️  Utilizador já existe na Auth; atualizando senha e confirmação de email.');
      userId = existing.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), full_name: FULL_NAME },
      });
      if (updErr) throw updErr;
    } else {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
      console.log('✓ Utilizador criado em auth.users:', userId);
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email: EMAIL,
        full_name: FULL_NAME,
        role: 'admin',
        is_super_admin: true,
        organization_id: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (profileError) throw profileError;
    console.log('✓ Perfil atualizado (is_super_admin: true).');
    console.log('\n✅ Concluído. Login no app com esse email/senha; rota Super Admin normalmente protegida no frontend.\n');

  } catch (e) {
    console.error('\n❌ Erro:', e?.message ?? e);
    process.exit(1);
  }
}

main();
