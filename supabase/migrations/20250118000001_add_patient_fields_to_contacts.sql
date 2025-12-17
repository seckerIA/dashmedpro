-- Migration: Add patient-specific fields to crm_contacts table
-- Date: 2025-01-18
-- Description: Adds health insurance, CPF, and gender fields to support medical practice patient management

-- Create enum for health insurance type
DO $$ BEGIN
  CREATE TYPE health_insurance_type AS ENUM ('convenio', 'particular');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for gender
DO $$ BEGIN
  CREATE TYPE patient_gender AS ENUM ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to crm_contacts table
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS insurance_type health_insurance_type DEFAULT 'particular',
  ADD COLUMN IF NOT EXISTS insurance_name TEXT,
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14), -- Format: XXX.XXX.XXX-XX
  ADD COLUMN IF NOT EXISTS gender patient_gender;

-- Add index on CPF for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_contacts_cpf ON public.crm_contacts(cpf) WHERE cpf IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN public.crm_contacts.insurance_type IS 'Type of health insurance: convenio (health plan) or particular (private pay)';
COMMENT ON COLUMN public.crm_contacts.insurance_name IS 'Name of the health insurance company (only when insurance_type is convenio)';
COMMENT ON COLUMN public.crm_contacts.cpf IS 'Brazilian taxpayer ID (CPF)';
COMMENT ON COLUMN public.crm_contacts.gender IS 'Patient gender identification';
