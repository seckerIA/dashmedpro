-- Drop legacy complex policies to fix performance
DROP POLICY IF EXISTS "Admin access" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view linked secretaries" ON public.profiles;
DROP POLICY IF EXISTS "Medico can view invited users" ON public.profiles;
DROP POLICY IF EXISTS "Secretaria can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secretaria can view all profiles_v2" ON public.profiles;
DROP POLICY IF EXISTS "Secretaria can view linked doctors and admins" ON public.profiles;

-- Ensure users can always see themselves (critical fallback)
-- (Existing policy might cover this, but ensuring it exists)
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles; 
-- CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ( id = auth.uid() );

-- Create new, fast Organization-scoped policy
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
USING (
  organization_id = ANY(public.get_user_org_ids())
);
