-- RLS admin/dono em crm_contacts; precursores em 20250120000004.
DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NULL THEN
    RAISE NOTICE '20250113000001_fix_sales_calls_contacts_permissions: omitido (crm_contacts inexistente).';
  END IF;
END $$;
