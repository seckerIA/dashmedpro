-- complete-onboarding espera phone, city e member_limit em public.organizations.

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone text;
  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS city text;
  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS member_limit integer DEFAULT 1;
END $$;

COMMENT ON COLUMN public.organizations.phone IS 'Telefone da clínica (onboarding)';
COMMENT ON COLUMN public.organizations.city IS 'Cidade da clínica (onboarding)';
COMMENT ON COLUMN public.organizations.member_limit IS 'Limite de membros (onboarding / plano)';
