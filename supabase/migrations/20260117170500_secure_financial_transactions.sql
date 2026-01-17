-- Remover policies de SELECT redundantes ou inseguras
DROP POLICY IF EXISTS "Admin and Dono can view all financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Secretary can view linked doctor financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can view transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON financial_transactions;

-- Criar policy unificada e segura para SELECT usando get_user_role
CREATE POLICY "financial_transactions_select_secure" ON financial_transactions
    FOR SELECT USING (
        -- 1. Admin/Dono: Tudo
        get_user_role(auth.uid()) IN ('admin', 'dono')
        OR
        -- 2. Dono da transação: Suas
        user_id = auth.uid()
        OR
        -- 3. Secretária: De seus médicos vinculados
        (
            get_user_role(auth.uid()) = 'secretaria'
            AND
            user_id IN (
                -- A tabela de links já está protegida por get_user_role, sem risco de ciclo
                SELECT doctor_id FROM secretary_doctor_links WHERE secretary_id = auth.uid()
            )
        )
    );
