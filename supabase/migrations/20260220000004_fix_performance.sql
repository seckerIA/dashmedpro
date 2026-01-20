-- Optimize RLS helper function for performance
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT array_agg(organization_id)
    FROM public.organization_members
    WHERE user_id = auth.uid();
$$;

-- Ensure index exists for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
