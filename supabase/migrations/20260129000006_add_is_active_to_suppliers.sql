-- Migration: Add is_active to inventory_suppliers
-- Description: Allows suppliers to be deactivated instead of deleted to preserve transaction history

-- Add is_active column with default true
ALTER TABLE inventory_suppliers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add index for filtering active suppliers
CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_is_active
ON inventory_suppliers(is_active)
WHERE is_active = true;

-- Comment
COMMENT ON COLUMN inventory_suppliers.is_active IS
'Indica se o fornecedor está ativo. Fornecedores inativos são ocultados mas preservam histórico de transações.';
