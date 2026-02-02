-- ============================================
-- FIX: Criar profile faltante para Dr. Rafael
-- ============================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Projeto: adzaqkduxnpckbcuqpmg (produção)

-- 1. Primeiro, verificar os dados atuais
SELECT 'auth.users' as tabela, id, email, raw_user_meta_data
FROM auth.users
WHERE id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

SELECT 'profiles' as tabela, *
FROM profiles
WHERE id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

SELECT 'organization_members' as tabela, *
FROM organization_members
WHERE user_id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

SELECT 'organizations' as tabela, *
FROM organizations
WHERE id = 'ad9c3b64-ebd7-4409-b42f-e2b3d0e355aa';

-- 2. Criar o profile (ajuste o full_name se necessário)
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  organization_id,
  onboarding_completed,
  onboarding_completed_at,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '8ce20d10-5c49-4bb1-b086-9c2e1ede286d',
  'rafaelcarvalhomed@gmail.com',
  'Dr. Rafael Carvalho',  -- Ajuste o nome se necessário
  'medico',
  'ad9c3b64-ebd7-4409-b42f-e2b3d0e355aa',
  true,
  NOW(),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  onboarding_completed = EXCLUDED.onboarding_completed,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. Verificar se o profile foi criado
SELECT 'VERIFICAÇÃO' as status, id, email, full_name, role, organization_id, onboarding_completed
FROM profiles
WHERE id = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';
