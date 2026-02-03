-- Migration: Add supplier_id to inventory_items
-- This allows users to assign a default supplier to each product

-- 1. Add supplier_id column
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES inventory_suppliers(id) ON DELETE SET NULL;

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON inventory_items(supplier_id);

-- 3. Add comment for documentation
COMMENT ON COLUMN inventory_items.supplier_id IS 'Default supplier for this product';
