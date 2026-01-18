
-- Fix constraints to allow user deletion by setting references to NULL

-- 1. Inventory Items (user_id)
ALTER TABLE IF EXISTS inventory_items 
  ALTER COLUMN user_id DROP NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_user_id_fkey') THEN
    ALTER TABLE inventory_items DROP CONSTRAINT inventory_items_user_id_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS inventory_items
  ADD CONSTRAINT inventory_items_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 2. Inventory Suppliers (user_id)
ALTER TABLE IF EXISTS inventory_suppliers
  ALTER COLUMN user_id DROP NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_suppliers_user_id_fkey') THEN
    ALTER TABLE inventory_suppliers DROP CONSTRAINT inventory_suppliers_user_id_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS inventory_suppliers
  ADD CONSTRAINT inventory_suppliers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 3. Inventory Transactions (user_id and created_by)
ALTER TABLE IF EXISTS inventory_transactions
  ALTER COLUMN user_id DROP NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_transactions_user_id_fkey') THEN
    ALTER TABLE inventory_transactions DROP CONSTRAINT inventory_transactions_user_id_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS inventory_transactions
  ADD CONSTRAINT inventory_transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
  
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_transactions_created_by_fkey') THEN
    ALTER TABLE inventory_transactions DROP CONSTRAINT inventory_transactions_created_by_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS inventory_transactions
  ADD CONSTRAINT inventory_transactions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 4. Inventory Movements (created_by)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_created_by_fkey') THEN
    ALTER TABLE inventory_movements DROP CONSTRAINT inventory_movements_created_by_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS inventory_movements
  ADD CONSTRAINT inventory_movements_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 5. Financial Accounts (user_id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_accounts_user_id_fkey_profiles') THEN
    ALTER TABLE financial_accounts DROP CONSTRAINT financial_accounts_user_id_fkey_profiles;
  END IF;
END $$;

ALTER TABLE IF EXISTS financial_accounts
  ADD CONSTRAINT financial_accounts_user_id_fkey_profiles
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
