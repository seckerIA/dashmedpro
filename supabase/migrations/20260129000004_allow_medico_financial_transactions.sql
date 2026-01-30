-- Migration: Allow Médicos to manage their own financial transactions
-- Description: Fixes 403 error when doctors try to create transactions for paid appointments
-- The previous policy only allowed admin/dono, blocking doctors from creating transactions

-- ========================================
-- DROP EXISTING POLICIES
-- ========================================
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;

-- ========================================
-- CREATE NEW POLICIES - Allow médicos to manage own transactions
-- ========================================

-- SELECT: Admin/Dono can see all, médicos can see their own
CREATE POLICY "financial_transactions_select_policy" ON financial_transactions
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = financial_transactions.organization_id
  )
);

-- INSERT: Admin/Dono can insert any, médicos can insert their own
CREATE POLICY "financial_transactions_insert_policy" ON financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- UPDATE: Admin/Dono can update any, médicos can update their own
CREATE POLICY "financial_transactions_update_policy" ON financial_transactions
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- DELETE: Admin/Dono can delete any, médicos can delete their own
CREATE POLICY "financial_transactions_delete_policy" ON financial_transactions
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- ========================================
-- SIMILAR FIX FOR FINANCIAL_ACCOUNTS
-- ========================================
DROP POLICY IF EXISTS "financial_accounts_select_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON financial_accounts;

-- SELECT: Admin/Dono or own accounts or same organization
CREATE POLICY "financial_accounts_select_policy" ON financial_accounts
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = financial_accounts.organization_id
  )
);

-- INSERT: Admin/Dono or own accounts
CREATE POLICY "financial_accounts_insert_policy" ON financial_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- UPDATE: Admin/Dono or own accounts
CREATE POLICY "financial_accounts_update_policy" ON financial_accounts
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- DELETE: Admin/Dono or own accounts
CREATE POLICY "financial_accounts_delete_policy" ON financial_accounts
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

-- ========================================
-- ADD COMMENTS
-- ========================================
COMMENT ON POLICY "financial_transactions_select_policy" ON financial_transactions IS
'Permite Admin/Dono ver todas transações, médicos veem suas próprias e da organização';

COMMENT ON POLICY "financial_transactions_insert_policy" ON financial_transactions IS
'Permite Admin/Dono e médicos criarem transações (médicos apenas para si)';
