-- ============================================
-- Migration: Allow Admin/Dono to Edit All Deals (histórico)
-- Executava antes de public.crm_deals existir → 42P01.
-- Consolidado em 20250120000003_global_crm_rls_view_policies.sql
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.crm_deals') IS NULL THEN
    RAISE NOTICE '20250110000001_allow_admin_dono_edit_deals: omitido (crm_deals inexistente).';
  END IF;
END $$;
