-- Enforce strict data access for Medico and Dono roles across core tables

-- 1. Financial Transactions
ALTER POLICY "Org scoped access" ON "public"."financial_transactions"
USING (
  (organization_id = ANY (get_user_org_ids())) AND (
    (get_user_role(auth.uid()) = 'admin')
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR user_id = auth.uid()
    OR (get_user_role(auth.uid()) = 'secretaria' AND EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl 
      WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = financial_transactions.user_id
    ))
  )
);

-- 2. Commercial Leads
ALTER POLICY "Org scoped access" ON "public"."commercial_leads"
USING (
  (organization_id = ANY (get_user_org_ids())) AND (
    (get_user_role(auth.uid()) = 'admin') 
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR user_id = auth.uid()
  )
);

-- 3. Medical Appointments (Select)
ALTER POLICY "Users can view appointments in their organization" ON "public"."medical_appointments"
USING (
  organization_id = ANY (get_user_org_ids()) AND (
    (get_user_role(auth.uid()) = 'admin')
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR doctor_id = auth.uid() OR user_id = auth.uid()
    OR (get_user_role(auth.uid()) = 'secretaria' AND EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl 
      WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = medical_appointments.doctor_id
    ))
  )
);

-- 4. Medical Appointments (Update)
ALTER POLICY "Users can update appointments in their organization" ON "public"."medical_appointments"
USING (
  organization_id = ANY (get_user_org_ids()) AND (
    (get_user_role(auth.uid()) = 'admin')
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR doctor_id = auth.uid() OR user_id = auth.uid()
    OR (get_user_role(auth.uid()) = 'secretaria' AND EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl 
      WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = medical_appointments.doctor_id
    ))
  )
);

-- 5. CRM Deals (Manage/Select)
ALTER POLICY "Users can manage deals in their organization" ON "public"."crm_deals"
USING (
  organization_id = ANY (get_user_org_ids()) AND (
    (get_user_role(auth.uid()) = 'admin')
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR user_id = auth.uid() OR assigned_to = auth.uid()
    OR (get_user_role(auth.uid()) = 'secretaria' AND EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl 
      WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = crm_deals.user_id
    ))
  )
);

ALTER POLICY "Users can view deals in their organization" ON "public"."crm_deals"
USING (
  organization_id = ANY (get_user_org_ids()) AND (
    (get_user_role(auth.uid()) = 'admin')
    OR (get_user_role(auth.uid()) NOT IN ('medico', 'secretaria', 'dono'))
    OR user_id = auth.uid() OR assigned_to = auth.uid()
    OR (get_user_role(auth.uid()) = 'secretaria' AND EXISTS (
      SELECT 1 FROM secretary_doctor_links sdl 
      WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = crm_deals.user_id
    ))
  )
);
