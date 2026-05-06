-- Automatização (Auth + profile + org + IA + horários):
--   node scripts/restore-dr-rafael-full.mjs
-- Reatribuir dados do dashboard do UUID legado ao login actual:
--   node scripts/migrate-rafael-dashboard-data.mjs --dry-run
--   node scripts/migrate-rafael-dashboard-data.mjs --apply
-- (precisa SUPABASE_SERVICE_ROLE_KEY no .env)

-- =============================================================================
-- Referência rápida: conta Dr. Rafael (dados canon do repositório)
-- Email:     rafaelcarvalhomed@gmail.com
-- Senha:     você define no Dashboard Auth ou via API admin (ex.: 12345678)
-- User UUID legado nos seeds/fixes: 8ce20d10-5c49-4bb1-b086-9c2e1ede286d
-- Org UUID referenciada num fix antigo (projeto antigo): ad9c3b64-ebd7-4409-b42f-e2b3d0e355aa
--
-- Nada disso foi apagado do Git — só existe na base se migrações + signup rodaram lá.
-- Use no SQL Editor do MESMO projeto Supabase onde a app aponta (ex.: brrhn… ou adzaq…).
-- =============================================================================

-- 0) Ver se o utilizador Auth existe e qual o id real
SELECT id, email, created_at FROM auth.users
WHERE lower(email) = lower('rafaelcarvalhomed@gmail.com');

-- 1) Se o id for o legado ou outro — ajuste :rafael_id nos blocos seguintes.

-- Profile mínimo (ajuste organization_id ao uuid da CLÍNICA correta, ou NULL e complete onboarding depois)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  onboarding_completed,
  onboarding_completed_at,
  updated_at
)
SELECT u.id,
  u.email::text,
  'Dr. Rafael Carvalho',
  'medico',
  true,
  true,
  now(),
  now()
FROM auth.users u
WHERE lower(u.email) = lower('rafaelcarvalhomed@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  email                   = excluded.email,
  full_name               = COALESCE(public.profiles.full_name, excluded.full_name),
  role                    = COALESCE(public.profiles.role::text, excluded.role)::user_role,
  is_active               = true,
  onboarding_completed    = COALESCE(public.profiles.onboarding_completed, true),
  onboarding_completed_at = COALESCE(public.profiles.onboarding_completed_at, excluded.onboarding_completed_at),
  updated_at              = now();

-- Vincular à organização (opcional — substitua o UUID por id real da sua tabela organizations)
-- INSERT INTO public.organization_members (organization_id, user_id, role)
-- SELECT '00000000-0000-0000-0000-000000000000'::uuid, id, 'dono'::user_role
-- FROM auth.users WHERE lower(email)=lower('rafaelcarvalhomed@gmail.com')
-- ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Senha: Auth → Users → usuário → Set password OU via CLI/service role admin API.
-- Migracoes relacionadas no repo:
--   20260430140000_seed_jessica_knowledge_base.sql (kb Jessica / clínica)
--   20260430160000_dr_rafael_working_hours_and_kb.sql (horários WhatsApp IA)
--   scripts/fix-rafael-profile.sql (FIX antigo com ids fixos de outro projeto)
