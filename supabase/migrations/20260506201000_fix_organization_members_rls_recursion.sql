-- A política anterior fazia sub-SELECT em organization_members dentro do RLS da própria tabela,
-- gerando recursão infinita → PostgREST 500 em profiles, organization_members, organizations, etc.

DROP POLICY IF EXISTS "Org members can select organization_members" ON public.organization_members;

CREATE POLICY "Org members can select organization_members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  organization_id = ANY(COALESCE(public.get_user_org_ids(), ARRAY[]::uuid[]))
);
