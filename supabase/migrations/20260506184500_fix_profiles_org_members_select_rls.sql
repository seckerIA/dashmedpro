-- Corrige loop pós-onboarding: sem estas políticas o app pode não conseguir ler `profiles`
-- (organization_id NULL falha em organization_id = ANY(...)) e `organization_members`
-- ficou sem SELECT após remover "view all".

-- 1) Sempre permitir ler o próprio registro em profiles (OR com política por organização)
DROP POLICY IF EXISTS "Users can view own profile by id" ON public.profiles;
CREATE POLICY "Users can view own profile by id"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2) SELECT em organization_members sem subconsulta na própria tabela (evita recursão RLS).
--    get_user_org_ids() é SECURITY DEFINER e não dispara a política de novo.
DROP POLICY IF EXISTS "Org members can select organization_members" ON public.organization_members;
CREATE POLICY "Org members can select organization_members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  organization_id = ANY(COALESCE(public.get_user_org_ids(), ARRAY[]::uuid[]))
);
