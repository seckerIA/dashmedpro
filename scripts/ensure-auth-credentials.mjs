/**
 * Atualiza senha e email_confirm para um utilizador já existente no Supabase Auth.
 * NÃO grava secrets no código — use apenas variáveis de ambiente.
 *
 * Da raíz do projeto (com SUPABASE_* no `.env`):
 *   cross-env TARGET_EMAIL="email@example.com" TARGET_PASSWORD="*****" node scripts/ensure-auth-credentials.mjs
 *
 * PowerShell:
 *   $env:TARGET_EMAIL="..."; $env:TARGET_PASSWORD="..."; node scripts/ensure-auth-credentials.mjs
 */
import { supabaseAdmin } from './config.mjs';

const email = process.env.TARGET_EMAIL?.trim();
const password = process.env.TARGET_PASSWORD;

if (!email || typeof password !== 'string' || !password.length) {
  console.error('\n❌ Defina TARGET_EMAIL e TARGET_PASSWORD (string não vazia).\n');
  process.exit(1);
}

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
  console.log('\n🔧 Procurar utilizador em Auth…');

  let user = await findAuthUserByEmail(email);

  if (!user) {
    console.log(`\nℹ️  Não há conta em Auth para ${email}.`);
    console.log(
      '    Crie a clínica no app: Super Admin (/admin) → Nova Clínica — use esse email na “Senha inicial”.',
    );
    console.log('    Depois volte a correr este script se precisar de forçar a senha/email_confirm.\n');
    process.exit(2);
  }

  console.log(`✓ Utilizador encontrado: ${user.id}`);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });

  if (error) throw error;

  console.log(`\n✅ Senha e confirmação de email atualizados para ${email}\n`);
}

main().catch((e) => {
  console.error('\n❌ Erro:', e?.message ?? e);
  process.exit(1);
});
