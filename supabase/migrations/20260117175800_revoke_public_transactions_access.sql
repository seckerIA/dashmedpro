-- Garante a remoção da política insegura citada no relatório de segurança, caso ela exista (vacina)
-- A política correta "financial_transactions_select_secure" JÁ EXISTE e não será afetada.

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON financial_transactions;
