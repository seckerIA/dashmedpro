-- Migration: Add consultation_value to profiles
-- Description: Adds missing consultation_value column that was being used in complete-onboarding edge function

-- Add consultation_value column (optional field for doctor's default consultation price)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consultation_value numeric(10,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.consultation_value IS 'Default consultation value for doctors (set during onboarding)';
