
-- =========================================================
-- 1) profiles: block self role / is_super_admin escalation
-- =========================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND COALESCE(is_super_admin, false) = COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()), false)
);

-- =========================================================
-- 2) debug_logs: enable RLS, super-admin only
-- =========================================================
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view debug logs" ON public.debug_logs;
CREATE POLICY "Super admins can view debug logs"
ON public.debug_logs
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- (no INSERT/UPDATE/DELETE policies = denied for clients; service_role bypasses RLS)

-- =========================================================
-- 3) organization_members: drop "view all" policy
-- =========================================================
DROP POLICY IF EXISTS "Users can view all organization_members" ON public.organization_members;

-- =========================================================
-- 4) reactivation_messages: scope to service_role
-- =========================================================
DROP POLICY IF EXISTS "Service role can manage reactivation messages" ON public.reactivation_messages;
CREATE POLICY "Service role can manage reactivation messages"
ON public.reactivation_messages
FOR ALL
TO public
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- =========================================================
-- 5) whatsapp_lead_qualifications: scope to service_role
-- =========================================================
DROP POLICY IF EXISTS "Service role full access lead quals" ON public.whatsapp_lead_qualifications;
CREATE POLICY "Service role full access lead quals"
ON public.whatsapp_lead_qualifications
FOR ALL
TO public
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- =========================================================
-- 6) allowed_emails: restrict to authenticated
-- =========================================================
DROP POLICY IF EXISTS "Allow checking emails during auth" ON public.allowed_emails;
CREATE POLICY "Authenticated can check allowed emails"
ON public.allowed_emails
FOR SELECT
TO authenticated
USING (true);

-- =========================================================
-- 7) crm_follow_ups: drop overly permissive policies
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can manage crm_follow_ups" ON public.crm_follow_ups;
DROP POLICY IF EXISTS "Authenticated users can view crm_follow_ups" ON public.crm_follow_ups;

-- =========================================================
-- 8) appointment_stock_usage: org-scoped
-- =========================================================
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.appointment_stock_usage;

CREATE POLICY "Org members can manage appointment stock usage"
ON public.appointment_stock_usage
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.medical_appointments a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = appointment_stock_usage.appointment_id
      AND a.organization_id = p.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medical_appointments a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = appointment_stock_usage.appointment_id
      AND a.organization_id = p.organization_id
  )
);

-- =========================================================
-- 9) Storage: make buckets private and remove broad policies
-- =========================================================
UPDATE storage.buckets SET public = false WHERE id IN ('sinal-receipts', 'task-attachments');

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
