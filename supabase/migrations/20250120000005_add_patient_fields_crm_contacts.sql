-- Intent de 20250118000001_add_patient_fields_to_contacts.sql (corrida após crm_contacts existir).

DO $$ BEGIN
  CREATE TYPE health_insurance_type AS ENUM ('convenio', 'particular');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE patient_gender AS ENUM ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS insurance_type health_insurance_type DEFAULT 'particular',
  ADD COLUMN IF NOT EXISTS insurance_name TEXT,
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS gender patient_gender;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_cpf ON public.crm_contacts(cpf) WHERE cpf IS NOT NULL;

COMMENT ON COLUMN public.crm_contacts.insurance_type IS 'Type of health insurance: convenio (health plan) or particular (private pay)';
COMMENT ON COLUMN public.crm_contacts.insurance_name IS 'Name of the health insurance company (only when insurance_type is convenio)';
COMMENT ON COLUMN public.crm_contacts.cpf IS 'Brazilian taxpayer ID (CPF)';
COMMENT ON COLUMN public.crm_contacts.gender IS 'Patient gender identification';
