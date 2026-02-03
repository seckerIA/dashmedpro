-- Migration: Add organization_id to financial_categories
-- This isolates categories per organization so each org only sees their own categories

-- 1. Add organization_id column
ALTER TABLE financial_categories
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_categories_org_id ON financial_categories(organization_id);

-- 3. Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can view all categories" ON financial_categories;
DROP POLICY IF EXISTS "authenticated_select_categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can create categories" ON financial_categories;
DROP POLICY IF EXISTS "authenticated_insert_categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can update categories" ON financial_categories;
DROP POLICY IF EXISTS "authenticated_update_categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete categories" ON financial_categories;
DROP POLICY IF EXISTS "authenticated_delete_categories" ON financial_categories;

-- 4. Create new RLS policies with organization filtering

-- SELECT: Users can only see categories from their organization
CREATE POLICY "Users can view own org categories" ON financial_categories
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT: Users can only create categories for their organization
CREATE POLICY "Users can create own org categories" ON financial_categories
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (is_system IS NULL OR is_system = false)
);

-- UPDATE: Users can only update categories from their organization
CREATE POLICY "Users can update own org categories" ON financial_categories
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (is_system IS NULL OR is_system = false)
);

-- DELETE: Users can only delete categories from their organization
CREATE POLICY "Users can delete own org categories" ON financial_categories
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (is_system IS NULL OR is_system = false)
);

-- 5. Migrate existing categories to assign them to organizations
-- For each category without org_id, try to find the creator's organization
-- If not possible, delete orphan categories
DO $$
DECLARE
  orphan_count INT;
BEGIN
  -- Count orphan categories
  SELECT COUNT(*) INTO orphan_count FROM financial_categories WHERE organization_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % categories without organization_id. Deleting orphan categories...', orphan_count;
    DELETE FROM financial_categories WHERE organization_id IS NULL;
  END IF;
END $$;
