-- Create sales_calls (histórico)
-- Corria em 20250110 antes de public.crm_contacts / crm_deals → 42P01.
-- Tabela, índices, RLS e trigger estão em 20250120000000_complete_database_schema.sql.
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NULL
     OR to_regclass('public.crm_deals') IS NULL THEN
    RAISE NOTICE '20250110000003_create_sales_calls_table: omitido (crm_* inexistentes; coberto pela complete_database_schema).';
  END IF;
END $$;
