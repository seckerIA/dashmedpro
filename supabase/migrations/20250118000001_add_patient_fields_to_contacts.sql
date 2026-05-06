-- Campos paciente em crm_contacts aplicados em 20250120000005.
DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NULL THEN
    RAISE NOTICE '20250118000001_add_patient_fields_to_contacts: omitido.';
  END IF;
END $$;
