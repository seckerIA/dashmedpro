-- ============================================
-- Migration: Update CRM RLS Policies (histórico)
-- Executava antes de crm_* existir → 42P01 em DB novo.
-- Efeito desejado aplicado em 20250120000003_global_crm_rls_view_policies.sql
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.crm_deals') IS NULL OR to_regclass('public.crm_activities') IS NULL THEN
    RAISE NOTICE '20250107000001_update_crm_rls_policies: omitido (crm_* inexistentes; aplicar após complete_database_schema).';
  END IF;
END $$;
