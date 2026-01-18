-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own commercial leads" ON commercial_leads;

-- Create a comprehensive INSERT policy
CREATE POLICY "Users can insert commercial leads based on role" ON commercial_leads
FOR INSERT
WITH CHECK (
  -- 1. User inserting for themselves
  auth.uid() = user_id
  OR
  -- 2. Admin or Dono inserting for anyone
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['admin'::user_role, 'dono'::user_role])
  ))
  OR
  -- 3. Secretary inserting for linked doctor
  (
    get_user_role(auth.uid()) = 'secretaria'
    AND
    EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_doctor_links.secretary_id = auth.uid()
      AND secretary_doctor_links.doctor_id = user_id
    )
  )
);
