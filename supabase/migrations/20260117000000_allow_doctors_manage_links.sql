
-- Enable RLS (already enabled)
-- ALTER TABLE public.secretary_doctor_links ENABLE ROW LEVEL SECURITY;

-- Policy to allow Doctors to manage (ALL) entries in secretary_doctor_links
-- This is necessary because the frontend 'updateSecretaryLinks' clears all links for a secretary before re-inserting.
CREATE POLICY "Doctors can manage links"
ON public.secretary_doctor_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'medico')
  )
);
