-- Corrigir políticas RLS para financial_recurring_transactions
-- Permitir que TODOS os usuários autenticados possam criar/gerenciar suas próprias transações recorrentes

-- Remover políticas antigas
DROP POLICY IF EXISTS "financial_recurring_select_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_insert_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_update_policy" ON financial_recurring_transactions;
DROP POLICY IF EXISTS "financial_recurring_delete_policy" ON financial_recurring_transactions;

-- SELECT: Admin e Dono veem tudo, outros usuários veem apenas suas próprias
CREATE POLICY "financial_recurring_select_policy"
ON financial_recurring_transactions
FOR SELECT
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

-- INSERT: Todos usuários autenticados podem inserir suas próprias transações
CREATE POLICY "financial_recurring_insert_policy"
ON financial_recurring_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: Admin e Dono podem atualizar tudo, outros apenas suas próprias
CREATE POLICY "financial_recurring_update_policy"
ON financial_recurring_transactions
FOR UPDATE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
)
WITH CHECK (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);

-- DELETE: Admin e Dono podem deletar tudo, outros apenas suas próprias
CREATE POLICY "financial_recurring_delete_policy"
ON financial_recurring_transactions
FOR DELETE
TO authenticated
USING (
  is_admin_or_dono(auth.uid()) OR user_id = auth.uid()
);