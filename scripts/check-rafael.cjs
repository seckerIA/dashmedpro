/**
 * Diagnostica conta Dr. Rafael na base atual.
 *
 * Env (raiz ou .env):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...   (recomendado; anon pode bloquear RLS)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const RAFAEL_EMAIL = 'rafaelcarvalhomed@gmail.com';
/** UUID usado nos seeds whatsapp_kb / migrações (pode diferir na tua auth.users). */
const RAFAEL_LEGACY_USER_ID = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou anon) no .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log('URL:', url);
  console.log('Email:', RAFAEL_EMAIL);
  console.log('Legacy seed user_id:', RAFAEL_LEGACY_USER_ID);
  console.log('');

  const { data: byEmail, error: e1 } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, onboarding_completed')
    .ilike('email', RAFAEL_EMAIL);

  console.log('profiles por email:', e1?.message || '', byEmail ?? []);

  const { data: legacy, error: e2 } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, onboarding_completed')
    .eq('id', RAFAEL_LEGACY_USER_ID);

  console.log('profiles legacy id:', e2?.message || '', legacy ?? []);

  const uid = byEmail?.[0]?.id || legacy?.[0]?.id;
  if (uid) {
    const { data: mem } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', uid);
    console.log('organization_members:', mem ?? []);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
