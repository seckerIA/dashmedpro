-- Migration: Fix Inventory RLS for Admin/Dono
-- Description: Admins and Donos should be able to manage ALL inventory items, batches, movements and suppliers
-- The current policies only allow user_id = auth.uid() which blocks admin access

-- ========================================
-- INVENTORY_ITEMS - Add admin policy
-- ========================================
DROP POLICY IF EXISTS "Admin can manage all inventory items" ON inventory_items;
CREATE POLICY "Admin can manage all inventory items" ON inventory_items
FOR ALL
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

-- ========================================
-- INVENTORY_BATCHES - Add admin policy
-- ========================================
DROP POLICY IF EXISTS "Admin can manage all inventory batches" ON inventory_batches;
CREATE POLICY "Admin can manage all inventory batches" ON inventory_batches
FOR ALL
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

-- ========================================
-- INVENTORY_MOVEMENTS - Add admin policy
-- ========================================
DROP POLICY IF EXISTS "Admin can manage all inventory movements" ON inventory_movements;
CREATE POLICY "Admin can manage all inventory movements" ON inventory_movements
FOR ALL
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

-- ========================================
-- INVENTORY_SUPPLIERS - Add admin policy
-- ========================================
DROP POLICY IF EXISTS "Admin can manage all inventory suppliers" ON inventory_suppliers;
CREATE POLICY "Admin can manage all inventory suppliers" ON inventory_suppliers
FOR ALL
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON POLICY "Admin can manage all inventory items" ON inventory_items IS
'Permite Admin/Dono gerenciar todos os itens de inventário';

COMMENT ON POLICY "Admin can manage all inventory batches" ON inventory_batches IS
'Permite Admin/Dono gerenciar todos os lotes de inventário';

COMMENT ON POLICY "Admin can manage all inventory movements" ON inventory_movements IS
'Permite Admin/Dono gerenciar todas as movimentações de inventário';

COMMENT ON POLICY "Admin can manage all inventory suppliers" ON inventory_suppliers IS
'Permite Admin/Dono gerenciar todos os fornecedores';
