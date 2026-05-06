-- ============================================
-- MIGRATION: Sistema de Custos (histórico)
-- O timestamp 20250107 executa ANTES de `financial_transactions` /
-- `financial_attachments` (criadas em 20250120000000_complete_database_schema.sql).
-- Num push limpo o CREATE falhava com 42P01.
--
-- Toda a DDL (transaction_costs, triggers, RLS, view) está na migration completa.
-- A RPC `calculate_net_amount` é adicionada em 20250120000002_calculate_net_amount_function.sql.
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.financial_transactions') IS NULL
     OR to_regclass('public.financial_attachments') IS NULL THEN
    RAISE NOTICE '20250107000000_add_transaction_costs: omitido (financial_* ainda inexistentes; coberto por 20250120000000_complete_database_schema.sql).';
  END IF;
END $$;
