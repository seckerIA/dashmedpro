-- Estoque isolado por organização (tenant).
-- Remove políticas "Admin/Dono pode tudo globalmente"; substitui por acesso apenas às organizações em organization_members.

-- ============================
-- inventory_items
-- ============================
DROP POLICY IF EXISTS "Admin can manage all inventory items" ON public.inventory_items;

CREATE POLICY "Org members manage inventory_items in tenant"
ON public.inventory_items
FOR ALL
TO authenticated
USING (
  inventory_items.organization_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = inventory_items.organization_id
  )
)
WITH CHECK (
  inventory_items.organization_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = inventory_items.organization_id
  )
);

COMMENT ON POLICY "Org members manage inventory_items in tenant" ON public.inventory_items IS
'Substitui acesso global por dono/admin: apenas organization_id da(s) memberships do utilizador.';

-- ============================
-- inventory_batches (via produto pai)
-- ============================
DROP POLICY IF EXISTS "Admin can manage all inventory batches" ON public.inventory_batches;

CREATE POLICY "Org members manage batches via inventory_items"
ON public.inventory_batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items i
    INNER JOIN public.organization_members om
      ON om.organization_id = i.organization_id AND om.user_id = auth.uid()
    WHERE i.id = inventory_batches.item_id
      AND i.organization_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items i
    INNER JOIN public.organization_members om
      ON om.organization_id = i.organization_id AND om.user_id = auth.uid()
    WHERE i.id = inventory_batches.item_id
      AND i.organization_id IS NOT NULL
  )
);

COMMENT ON POLICY "Org members manage batches via inventory_items" ON public.inventory_batches IS
'Mesmo âmbito de tenant que inventory_items; remove visão cross-plataforma de donos.';

-- ============================
-- inventory_movements (via lote/produto)
-- ============================
DROP POLICY IF EXISTS "Admin can manage all inventory movements" ON public.inventory_movements;

CREATE POLICY "Org members manage movements via batches"
ON public.inventory_movements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_batches b
    INNER JOIN public.inventory_items i ON i.id = b.item_id
    INNER JOIN public.organization_members om
      ON om.organization_id = i.organization_id AND om.user_id = auth.uid()
    WHERE b.id = inventory_movements.batch_id
      AND i.organization_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_batches b
    INNER JOIN public.inventory_items i ON i.id = b.item_id
    INNER JOIN public.organization_members om
      ON om.organization_id = i.organization_id AND om.user_id = auth.uid()
    WHERE b.id = inventory_movements.batch_id
      AND i.organization_id IS NOT NULL
  )
);

COMMENT ON POLICY "Org members manage movements via batches" ON public.inventory_movements IS
'MOVEMENTS escopadas ao tenant através de batch→item.organization_id';

-- ============================
-- inventory_suppliers (creator profile.organization_id × membership)
-- ============================
DROP POLICY IF EXISTS "Admin can manage all inventory suppliers" ON public.inventory_suppliers;

CREATE POLICY "Org members share suppliers via creator org"
ON public.inventory_suppliers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles ps
    INNER JOIN public.organization_members om
      ON om.organization_id = ps.organization_id AND om.user_id = auth.uid()
    WHERE ps.id = inventory_suppliers.user_id
      AND ps.organization_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles ps
    INNER JOIN public.organization_members om
      ON om.organization_id = ps.organization_id AND om.user_id = auth.uid()
    WHERE ps.id = inventory_suppliers.user_id
      AND ps.organization_id IS NOT NULL
  )
);

COMMENT ON POLICY "Org members share suppliers via creator org" ON public.inventory_suppliers IS
'Fornecedores partilham-se só dentro da mesma organization_id do médico criador';
