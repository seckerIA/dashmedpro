-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA MÓDULO FINANCEIRO
-- =====================================================
-- Este script corrige as políticas RLS para garantir que
-- cada usuário veja apenas seus próprios dados financeiros
-- (exceto admin e dono que veem todos)
-- =====================================================

-- Remover políticas antigas que permitem acesso a todos
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON public.financial_accounts;
DROP POLICY IF EXISTS "Authenticated users can manage accounts" ON public.financial_accounts;

-- =====================================================
-- POLÍTICAS PARA financial_transactions
-- =====================================================

-- SELECT: Usuários veem apenas suas próprias transações, Admin/Dono veem todas
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_select_policy"
    ON public.financial_transactions FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- INSERT: Usuários podem criar apenas suas próprias transações, Admin/Dono podem criar para qualquer usuário
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_insert_policy"
    ON public.financial_transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Admin/Dono podem criar para qualquer usuário, outros usuários apenas para si mesmos
        (is_admin_or_dono(auth.uid()) AND user_id IS NOT NULL) OR user_id = auth.uid()
    );

-- UPDATE: Usuários podem atualizar apenas suas próprias transações, Admin/Dono podem atualizar qualquer transação
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_update_policy"
    ON public.financial_transactions FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- DELETE: Usuários podem deletar apenas suas próprias transações, Admin/Dono podem deletar qualquer transação
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON public.financial_transactions;
CREATE POLICY "financial_transactions_delete_policy"
    ON public.financial_transactions FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA financial_accounts
-- =====================================================

-- SELECT: Usuários veem apenas suas próprias contas, Admin/Dono veem todas
DROP POLICY IF EXISTS "financial_accounts_select_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_select_policy"
    ON public.financial_accounts FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- INSERT: Usuários podem criar apenas suas próprias contas, Admin/Dono podem criar para qualquer usuário
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_insert_policy"
    ON public.financial_accounts FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- UPDATE: Usuários podem atualizar apenas suas próprias contas, Admin/Dono podem atualizar qualquer conta
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_update_policy"
    ON public.financial_accounts FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- DELETE: Usuários podem deletar apenas suas próprias contas, Admin/Dono podem deletar qualquer conta
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_delete_policy"
    ON public.financial_accounts FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA financial_budgets
-- =====================================================

-- SELECT: Usuários veem apenas seus próprios orçamentos, Admin/Dono veem todos
DROP POLICY IF EXISTS "financial_budgets_select_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_select_policy"
    ON public.financial_budgets FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- INSERT: Usuários podem criar apenas seus próprios orçamentos, Admin/Dono podem criar para qualquer usuário
DROP POLICY IF EXISTS "financial_budgets_insert_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_insert_policy"
    ON public.financial_budgets FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- UPDATE: Usuários podem atualizar apenas seus próprios orçamentos, Admin/Dono podem atualizar qualquer orçamento
DROP POLICY IF EXISTS "financial_budgets_update_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_update_policy"
    ON public.financial_budgets FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- DELETE: Usuários podem deletar apenas seus próprios orçamentos, Admin/Dono podem deletar qualquer orçamento
DROP POLICY IF EXISTS "financial_budgets_delete_policy" ON public.financial_budgets;
CREATE POLICY "financial_budgets_delete_policy"
    ON public.financial_budgets FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA financial_recurring_transactions
-- =====================================================

-- SELECT: Usuários veem apenas suas próprias transações recorrentes, Admin/Dono veem todas
DROP POLICY IF EXISTS "financial_recurring_select_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_select_policy"
    ON public.financial_recurring_transactions FOR SELECT
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- INSERT: Usuários podem criar apenas suas próprias transações recorrentes, Admin/Dono podem criar para qualquer usuário
DROP POLICY IF EXISTS "financial_recurring_insert_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_insert_policy"
    ON public.financial_recurring_transactions FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- UPDATE: Usuários podem atualizar apenas suas próprias transações recorrentes, Admin/Dono podem atualizar qualquer transação recorrente
DROP POLICY IF EXISTS "financial_recurring_update_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_update_policy"
    ON public.financial_recurring_transactions FOR UPDATE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- DELETE: Usuários podem deletar apenas suas próprias transações recorrentes, Admin/Dono podem deletar qualquer transação recorrente
DROP POLICY IF EXISTS "financial_recurring_delete_policy" ON public.financial_recurring_transactions;
CREATE POLICY "financial_recurring_delete_policy"
    ON public.financial_recurring_transactions FOR DELETE
    TO authenticated
    USING (is_admin_or_dono(auth.uid()) OR user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA transaction_costs
-- =====================================================

-- SELECT: Usuários veem apenas custos de suas próprias transações
DROP POLICY IF EXISTS "Users can view their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can view their own transaction costs"
    ON public.transaction_costs FOR SELECT
    TO authenticated
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions 
            WHERE is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
        )
    );

-- INSERT: Usuários podem criar custos apenas para suas próprias transações
DROP POLICY IF EXISTS "Users can insert costs to their transactions" ON public.transaction_costs;
CREATE POLICY "Users can insert costs to their transactions"
    ON public.transaction_costs FOR INSERT
    TO authenticated
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM financial_transactions 
            WHERE is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
        )
    );

-- UPDATE: Usuários podem atualizar custos apenas de suas próprias transações
DROP POLICY IF EXISTS "Users can update their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can update their own transaction costs"
    ON public.transaction_costs FOR UPDATE
    TO authenticated
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions 
            WHERE is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
        )
    )
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM financial_transactions 
            WHERE is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
        )
    );

-- DELETE: Usuários podem deletar custos apenas de suas próprias transações
DROP POLICY IF EXISTS "Users can delete their own transaction costs" ON public.transaction_costs;
CREATE POLICY "Users can delete their own transaction costs"
    ON public.transaction_costs FOR DELETE
    TO authenticated
    USING (
        transaction_id IN (
            SELECT id FROM financial_transactions 
            WHERE is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA financial_attachments
-- =====================================================

-- SELECT: Usuários veem apenas anexos de suas próprias transações
DROP POLICY IF EXISTS "financial_attachments_select_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_select_policy"
    ON public.financial_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND (is_admin_or_dono(auth.uid()) OR ft.user_id = auth.uid())
        )
    );

-- INSERT: Usuários podem criar anexos apenas para suas próprias transações
DROP POLICY IF EXISTS "financial_attachments_insert_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_insert_policy"
    ON public.financial_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND (is_admin_or_dono(auth.uid()) OR ft.user_id = auth.uid())
        )
    );

-- DELETE: Usuários podem deletar anexos apenas de suas próprias transações
DROP POLICY IF EXISTS "financial_attachments_delete_policy" ON public.financial_attachments;
CREATE POLICY "financial_attachments_delete_policy"
    ON public.financial_attachments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = financial_attachments.transaction_id
            AND (is_admin_or_dono(auth.uid()) OR ft.user_id = auth.uid())
        )
    );

