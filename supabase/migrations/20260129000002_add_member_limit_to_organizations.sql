-- Migration: Add member_limit to organizations (tabela só existe após 20260220000000_create_organizations em bases novas)
-- Limits number of members per organization.

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS member_limit integer DEFAULT 1;

  ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS additional_member_price decimal(10,2) DEFAULT 89.90;

  COMMENT ON COLUMN public.organizations.member_limit IS 'Maximum members in org. Default 1 (owner only).';
  COMMENT ON COLUMN public.organizations.additional_member_price IS 'Price to add one additional member (BRL).';
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL OR to_regclass('public.organization_members') IS NULL THEN
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.get_organization_member_count(org_id uuid)
  RETURNS integer
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
    SELECT COUNT(*)::integer
    FROM public.organization_members
    WHERE organization_id = org_id;
  $func$;

  CREATE OR REPLACE FUNCTION public.can_add_member(org_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
    SELECT (
        SELECT COUNT(*)::integer
        FROM public.organization_members
        WHERE organization_id = org_id
    ) < (
        SELECT COALESCE(member_limit, 1)
        FROM public.organizations
        WHERE id = org_id
    );
  $func$;

  UPDATE public.organizations
  SET member_limit = 999
  WHERE member_limit IS NULL OR member_limit = 1;
END $$;
