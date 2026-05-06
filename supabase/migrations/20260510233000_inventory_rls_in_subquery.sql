-- Estoque tenant: mesmo padrão que crm_deals — IN uncorrelated (InitPlan/semi-join) em vez de EXISTS por linha.

DROP POLICY IF EXISTS "Org members manage inventory_items in tenant" ON public.inventory_items;
CREATE POLICY "Org members manage inventory_items in tenant"
ON public.inventory_items
FOR ALL
TO authenticated
USING (
  inventory_items.organization_id IS NOT NULL
  AND inventory_items.organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members AS om
    WHERE om.user_id = auth.uid()
  )
)
WITH CHECK (
  inventory_items.organization_id IS NOT NULL
  AND inventory_items.organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members AS om
    WHERE om.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Org members manage inventory_items in tenant" ON public.inventory_items IS
  'Tenant via IN (memberships): melhor custo planner que EXISTS correlacionado.';

DROP POLICY IF EXISTS "Org members manage batches via inventory_items" ON public.inventory_batches;
CREATE POLICY "Org members manage batches via inventory_items"
ON public.inventory_batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items AS i
    WHERE i.id = inventory_batches.item_id
      AND i.organization_id IS NOT NULL
      AND i.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members AS om
        WHERE om.user_id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items AS i
    WHERE i.id = inventory_batches.item_id
      AND i.organization_id IS NOT NULL
      AND i.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members AS om
        WHERE om.user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Org members manage movements via batches" ON public.inventory_movements;
CREATE POLICY "Org members manage movements via batches"
ON public.inventory_movements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_batches AS b
    INNER JOIN public.inventory_items AS i ON i.id = b.item_id
    WHERE b.id = inventory_movements.batch_id
      AND i.organization_id IS NOT NULL
      AND i.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members AS om
        WHERE om.user_id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_batches AS b
    INNER JOIN public.inventory_items AS i ON i.id = b.item_id
    WHERE b.id = inventory_movements.batch_id
      AND i.organization_id IS NOT NULL
      AND i.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members AS om
        WHERE om.user_id = auth.uid()
      )
  )
);
