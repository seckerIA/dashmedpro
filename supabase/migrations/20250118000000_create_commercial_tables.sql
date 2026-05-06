-- Módulo commercial já criado na complete_database_schema.
DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NULL THEN
    RAISE NOTICE '20250118000000_create_commercial_tables: omitido (pré-complete_database_schema).';
  END IF;
END $$;
