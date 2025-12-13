-- Bloquear completamente acesso de vendedores às tabelas financeiras
-- Apenas Admin e Dono podem acessar dados financeiros

-- ========================================
-- FINANCIAL_TRANSACTIONS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;

-- SELECT: Apenas Admin/Dono podem visualizar transações
CREATE POLICY "financial_transactions_select_policy" ON financial_transactions
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid())
);

-- INSERT/UPDATE/DELETE: Apenas Admin/Dono
CREATE POLICY "financial_transactions_insert_policy" ON financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_dono(auth.uid())
);

CREATE POLICY "financial_transactions_update_policy" ON financial_transactions
FOR UPDATE
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_transactions_delete_policy" ON financial_transactions
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- ========================================
-- FINANCIAL_ACCOUNTS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "financial_accounts_select_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON financial_accounts;

CREATE POLICY "financial_accounts_select_policy" ON financial_accounts
FOR SELECT
TO authenticated
USING (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_accounts_insert_policy" ON financial_accounts
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_accounts_update_policy" ON financial_accounts
FOR UPDATE
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_accounts_delete_policy" ON financial_accounts
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- ========================================
-- FINANCIAL_BUDGETS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "financial_budgets_select_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_insert_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_update_policy" ON financial_budgets;
DROP POLICY IF EXISTS "financial_budgets_delete_policy" ON financial_budgets;

CREATE POLICY "financial_budgets_select_policy" ON financial_budgets
FOR SELECT
TO authenticated
USING (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_budgets_insert_policy" ON financial_budgets
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_budgets_update_policy" ON financial_budgets
FOR UPDATE
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_budgets_delete_policy" ON financial_budgets
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- ========================================
-- FINANCIAL_RECURRING_TRANSACTIONS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "financial_recurring_select_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_insert_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_update_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_delete_policy" ON financial_recurring_transactions;

CREATE POLICY "financial_recurring_select_policy" ON financial_recurring_transactions
FOR SELECT
TO authenticated
USING (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_recurring_insert_policy" ON financial_recurring_transactions
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_recurring_update_policy" ON financial_recurring_transactions
FOR UPDATE
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_recurring_delete_policy" ON financial_recurring_transactions
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- ========================================
-- FINANCIAL_ATTACHMENTS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "financial_attachments_select_policy" ON financial_attachments;
DROP POLICY IF EXISTS "financial_attachments_insert_policy" ON financial_attachments;
DROP POLICY IF EXISTS "financial_attachments_delete_policy" ON financial_attachments;

CREATE POLICY "financial_attachments_select_policy" ON financial_attachments
FOR SELECT
TO authenticated
USING (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_attachments_insert_policy" ON financial_attachments
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "financial_attachments_delete_policy" ON financial_attachments
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- ========================================
-- TRANSACTION_COSTS POLICIES - VENDEDORES BLOQUEADOS
-- ========================================

DROP POLICY IF EXISTS "transaction_costs_select_policy" ON transaction_costs;
DROP POLICY IF EXISTS "transaction_costs_insert_policy" ON transaction_costs;
DROP POLICY IF EXISTS "transaction_costs_update_policy" ON transaction_costs;
DROP POLICY IF EXISTS "transaction_costs_delete_policy" ON transaction_costs;

CREATE POLICY "transaction_costs_select_policy" ON transaction_costs
FOR SELECT
TO authenticated
USING (is_admin_or_dono(auth.uid()));

CREATE POLICY "transaction_costs_insert_policy" ON transaction_costs
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "transaction_costs_update_policy" ON transaction_costs
FOR UPDATE
TO authenticated
USING (is_admin_or_dono(auth.uid()))
WITH CHECK (is_admin_or_dono(auth.uid()));

CREATE POLICY "transaction_costs_delete_policy" ON transaction_costs
FOR DELETE
TO authenticated
USING (is_admin_or_dono(auth.uid()));

-- Comentário explicativo
COMMENT ON POLICY "financial_transactions_select_policy" ON financial_transactions IS 
'Bloqueia vendedores e gestores de tráfego de acessar transações financeiras. Apenas Admin e Dono têm acesso.';

COMMENT ON POLICY "financial_accounts_select_policy" ON financial_accounts IS 
'Bloqueia vendedores e gestores de tráfego de acessar contas bancárias. Apenas Admin e Dono têm acesso.';

