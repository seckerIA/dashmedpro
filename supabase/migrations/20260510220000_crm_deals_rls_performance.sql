-- Reduz timeouts em SELECT grandes em crm_deals (PostgREST + embed).
-- get_user_org_ids() para admin faz array_agg(em organizations); em políticas pode custar por linha.
-- Aqui: checagem de admin como subconsulta escalar estável sobre auth.uid() (InitPlan) +
-- memberships via EXISTS correlacionado a organization_members + crm_deals.organization_id.

DROP POLICY IF EXISTS "Users can view deals in their organization" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can manage deals in their organization" ON public.crm_deals;

CREATE POLICY "crm_deals_tenant_access_all"
ON public.crm_deals
FOR ALL
TO authenticated
USING (
  (
    public.is_admin_or_dono(auth.uid())
    AND crm_deals.organization_id IS NOT NULL
  )
  OR EXISTS (
      SELECT 1
      FROM public.organization_members AS om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = crm_deals.organization_id
        AND crm_deals.organization_id IS NOT NULL
  )
)
WITH CHECK (
  (
    public.is_admin_or_dono(auth.uid())
    AND crm_deals.organization_id IS NOT NULL
  )
  OR EXISTS (
      SELECT 1
      FROM public.organization_members AS om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = crm_deals.organization_id
        AND crm_deals.organization_id IS NOT NULL
  )
);
