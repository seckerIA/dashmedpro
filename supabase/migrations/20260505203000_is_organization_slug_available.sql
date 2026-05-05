-- Slug availability for onboarding: anon/authenticated clients cannot SELECT other orgs (RLS),
-- so the UI falsely showed slugs as "available". This RPC checks global uniqueness safely.

CREATE OR REPLACE FUNCTION public.is_organization_slug_available(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE lower(btrim(o.slug::text)) = lower(btrim(p_slug))
  );
$$;

REVOKE ALL ON FUNCTION public.is_organization_slug_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_organization_slug_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_organization_slug_available(TEXT) TO authenticated;
