-- Corrigir políticas RLS para permitir que Admin/Dono vejam todos os registros
-- e usuários regulares vejam apenas seus próprios registros

-- ========================================
-- FINANCIAL_ACCOUNTS POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_accounts_select_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON financial_accounts;

CREATE POLICY "financial_accounts_select_policy" ON financial_accounts
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

CREATE POLICY "financial_accounts_insert_policy" ON financial_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_accounts_update_policy" ON financial_accounts
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_accounts_delete_policy" ON financial_accounts
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

-- ========================================
-- FINANCIAL_CATEGORIES POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_categories_select_policy" ON financial_categories;
DROP POLICY IF EXISTS "financial_categories_insert_policy" ON financial_categories;
DROP POLICY IF EXISTS "financial_categories_update_policy" ON financial_categories;
DROP POLICY IF EXISTS "financial_categories_delete_policy" ON financial_categories;

CREATE POLICY "financial_categories_select_policy" ON financial_categories
FOR SELECT
TO authenticated
USING (
  is_system = true OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "financial_categories_insert_policy" ON financial_categories
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND is_system = false
);

CREATE POLICY "financial_categories_update_policy" ON financial_categories
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND is_system = false
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND is_system = false
);

CREATE POLICY "financial_categories_delete_policy" ON financial_categories
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND is_system = false
);

-- ========================================
-- FINANCIAL_TRANSACTIONS POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;

CREATE POLICY "financial_transactions_select_policy" ON financial_transactions
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

CREATE POLICY "financial_transactions_insert_policy" ON financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_transactions_update_policy" ON financial_transactions
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_transactions_delete_policy" ON financial_transactions
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

-- ========================================
-- FINANCIAL_BUDGETS POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_budgets_select_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_insert_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_update_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_delete_policy" ON financial_budgets;

CREATE POLICY "financial_budgets_select_policy" ON financial_budgets
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

CREATE POLICY "financial_budgets_insert_policy" ON financial_budgets
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_budgets_update_policy" ON financial_budgets
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_budgets_delete_policy" ON financial_budgets
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

-- ========================================
-- FINANCIAL_RECURRING_TRANSACTIONS POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_recurring_select_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_insert_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_update_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_delete_policy" ON financial_recurring_transactions;

CREATE POLICY "financial_recurring_select_policy" ON financial_recurring_transactions
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

CREATE POLICY "financial_recurring_insert_policy" ON financial_recurring_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_recurring_update_policy" ON financial_recurring_transactions
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "financial_recurring_delete_policy" ON financial_recurring_transactions
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) AND user_id = auth.uid()
);

-- ========================================
-- FINANCIAL_ATTACHMENTS POLICIES
-- ========================================

DROP POLICY IF EXISTS "financial_attachments_select_policy" ON financial_attachments;
DROP POLICY IF EXISTS "financial_attachments_insert_policy" ON financial_attachments;
DROP POLICY IF EXISTS "financial_attachments_delete_policy" ON financial_attachments;

CREATE POLICY "financial_attachments_select_policy" ON financial_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.id = financial_attachments.transaction_id
    AND (is_admin_or_dono(auth.uid()) OR ft.user_id = auth.uid())
  )
);

CREATE POLICY "financial_attachments_insert_policy" ON financial_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.id = financial_attachments.transaction_id
    AND is_admin_or_dono(auth.uid())
    AND ft.user_id = auth.uid()
  )
);

CREATE POLICY "financial_attachments_delete_policy" ON financial_attachments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.id = financial_attachments.transaction_id
    AND is_admin_or_dono(auth.uid())
    AND ft.user_id = auth.uid()
  )
);