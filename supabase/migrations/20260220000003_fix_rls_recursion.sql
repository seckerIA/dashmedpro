-- Fix RLS Recursion on organization_members
-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;

-- Create a non-recursive policy for viewing own membership
CREATE POLICY "Users can view own membership"
    ON public.organization_members
    FOR SELECT
    USING ( user_id = auth.uid() );

-- Create a policy to view other members using the SECURITY DEFINER function
-- This avoids querying the table directly within the policy check
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members
    FOR SELECT
    USING (
         organization_id = ANY(public.get_user_org_ids())
    );

-- Fix Organizations policy as well just in case
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;

CREATE POLICY "Users can view their own organizations"
    ON public.organizations
    FOR SELECT
    USING (
        id = ANY(public.get_user_org_ids())
    );
