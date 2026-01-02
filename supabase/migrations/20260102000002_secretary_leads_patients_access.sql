-- =====================================================
-- Migration: Secretary Access to Leads, Patients and Clinical Data
-- Description: Permite acesso bidirecional entre médicos e secretárias vinculadas.
--              Cobre Leads, Contatos, Deals, Conversas, Agendamentos e Transações.
-- =====================================================

-- 1. COMMERCIAL_LEADS
-- =====================================================
DROP POLICY IF EXISTS "Leads access policy" ON public.commercial_leads;
CREATE POLICY "Leads access policy"
  ON public.commercial_leads FOR ALL 
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND doctor_id = public.commercial_leads.user_id)
      OR (doctor_id = auth.uid() AND secretary_id = public.commercial_leads.user_id)
    )
  );

-- 2. CRM_CONTACTS (Pacientes)
-- =====================================================
DROP POLICY IF EXISTS "Contacts access policy" ON public.crm_contacts;
DROP POLICY IF EXISTS "Contacts update policy" ON public.crm_contacts;
CREATE POLICY "Contacts access policy"
  ON public.crm_contacts FOR ALL
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND doctor_id = public.crm_contacts.user_id)
      OR (doctor_id = auth.uid() AND secretary_id = public.crm_contacts.user_id)
    )
  );

-- 3. CRM_DEALS (Negócios)
-- =====================================================
DROP POLICY IF EXISTS "Deals access policy" ON public.crm_deals;
DROP POLICY IF EXISTS "Deals update policy" ON public.crm_deals;
CREATE POLICY "Deals access policy"
  ON public.crm_deals FOR ALL
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND (doctor_id = public.crm_deals.user_id OR doctor_id = public.crm_deals.assigned_to))
      OR (doctor_id = auth.uid() AND (secretary_id = public.crm_deals.user_id OR secretary_id = public.crm_deals.assigned_to))
    )
  );

-- 4. MEDICAL_APPOINTMENTS (Agenda)
-- =====================================================
DROP POLICY IF EXISTS "Appointments access policy" ON public.medical_appointments;
CREATE POLICY "Appointments access policy"
  ON public.medical_appointments FOR ALL
  USING (
    auth.uid() = user_id 
    OR doctor_id = auth.uid()
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND (doctor_id = public.medical_appointments.user_id OR doctor_id = public.medical_appointments.doctor_id))
      OR (doctor_id = auth.uid() AND (secretary_id = public.medical_appointments.user_id OR secretary_id = public.medical_appointments.doctor_id))
    )
  );

-- 5. FINANCIAL_TRANSACTIONS (Métricas Financeiras)
-- =====================================================
DROP POLICY IF EXISTS "Transactions access policy" ON public.financial_transactions;
CREATE POLICY "Transactions access policy"
  ON public.financial_transactions FOR ALL
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND doctor_id = public.financial_transactions.user_id)
      OR (doctor_id = auth.uid() AND secretary_id = public.financial_transactions.user_id)
    )
  );

-- 6. WHATSAPP_CONVERSATIONS
-- =====================================================
DROP POLICY IF EXISTS "Conversations access policy" ON public.whatsapp_conversations;
CREATE POLICY "Conversations access policy"
  ON public.whatsapp_conversations FOR ALL
  USING (
    auth.uid() = user_id
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE (secretary_id = auth.uid() AND doctor_id = public.whatsapp_conversations.user_id)
      OR (doctor_id = auth.uid() AND secretary_id = public.whatsapp_conversations.user_id)
    )
  );
