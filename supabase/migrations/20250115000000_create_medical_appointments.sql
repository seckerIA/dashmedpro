-- medical_appointments + enums já em 20250120000000_complete_database_schema.sql.
DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NULL THEN
    RAISE NOTICE '20250115000000_create_medical_appointments: omitido (pré-complete_database_schema).';
  END IF;
END $$;
