-- RLS tenant: substitui EXISTS correlacionado por IN (+ subconsulta só em auth.uid()) → planner costuma fazer semi-join / InitPlan.
-- Índice (organization_id, position) alinha ORDER BY ... LIMIT no pipeline/dashboard.

CREATE INDEX IF NOT EXISTS idx_crm_deals_organization_id_position
  ON public.crm_deals (organization_id, "position");

DROP POLICY IF EXISTS "crm_deals_tenant_access_all" ON public.crm_deals;

CREATE POLICY "crm_deals_tenant_access_all"
ON public.crm_deals
FOR ALL
TO authenticated
USING (
  (
    public.is_admin_or_dono(auth.uid())
    AND crm_deals.organization_id IS NOT NULL
  )
  OR (
    crm_deals.organization_id IS NOT NULL
    AND crm_deals.organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members AS om
      WHERE om.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  (
    public.is_admin_or_dono(auth.uid())
    AND crm_deals.organization_id IS NOT NULL
  )
  OR (
    crm_deals.organization_id IS NOT NULL
    AND crm_deals.organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members AS om
      WHERE om.user_id = auth.uid()
    )
  )
);
