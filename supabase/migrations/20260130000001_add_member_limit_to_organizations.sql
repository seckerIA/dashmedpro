-- Repete/ajusta limites de membros (idempotente quando colunas já existem de 20260220)
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 1 NOT NULL;

  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS additional_member_price NUMERIC(10,2) DEFAULT 89.90 NOT NULL;

  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL OR to_regclass('public.organization_members') IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.organizations o
  SET owner_id = (
    SELECT om.user_id
    FROM public.organization_members om
    WHERE om.organization_id = o.id
    ORDER BY om.joined_at ASC
    LIMIT 1
  )
  WHERE owner_id IS NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN RETURN; END IF;
  CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN RETURN; END IF;
  COMMENT ON COLUMN public.organizations.member_limit IS 'Additional members allowed beyond owner';
  COMMENT ON COLUMN public.organizations.additional_member_price IS 'BRL per extra member';
  COMMENT ON COLUMN public.organizations.owner_id IS 'Owner user id';
END $$;
