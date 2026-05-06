-- ============================================
-- Cleanup Duplicate Policies (histórico)
-- Executava antes de public.crm_deals existir → 42P01.
-- Consolidado em 20250120000003_global_crm_rls_view_policies.sql
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.crm_deals') IS NULL THEN
    RAISE NOTICE '20250110000002_cleanup_duplicate_crm_deals_policies: omitido (crm_deals inexistente).';
  END IF;
END $$;
