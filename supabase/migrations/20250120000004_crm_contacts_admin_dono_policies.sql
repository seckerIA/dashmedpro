-- Intent de 20250113000001_fix_sales_calls_contacts_permissions (corrida após CRM existir).

DROP POLICY IF EXISTS "Users can view their own contacts or all if admin/dono with tog" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can update their contacts or all if admin/dono with toggl" ON public.crm_contacts;

DROP POLICY IF EXISTS "Users can view their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.crm_contacts;

DROP POLICY IF EXISTS "Admin and Dono can view all contacts, others view own" ON public.crm_contacts;
CREATE POLICY "Admin and Dono can view all contacts, others view own"
  ON public.crm_contacts FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin_or_dono(auth.uid())
  );

DROP POLICY IF EXISTS "Admin and Dono can update all contacts, others update own" ON public.crm_contacts;
CREATE POLICY "Admin and Dono can update all contacts, others update own"
  ON public.crm_contacts FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_admin_or_dono(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin_or_dono(auth.uid())
  );

COMMENT ON POLICY "Admin and Dono can view all contacts, others view own" ON public.crm_contacts IS
  'Admin e Dono sempre veem todos os contatos (ex.: criar chamadas/reuniões). Outros apenas os próprios.';

COMMENT ON POLICY "Admin and Dono can update all contacts, others update own" ON public.crm_contacts IS
  'Admin e Dono podem editar qualquer contato. Outros apenas os próprios.';
