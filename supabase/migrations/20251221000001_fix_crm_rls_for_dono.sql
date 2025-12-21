-- =====================================================
-- CORRIGIR RLS POLICIES PARA PERMITIR DONO VER TODOS OS DADOS
-- =====================================================
-- O problema: As políticas RLS de crm_contacts, crm_deals e commercial_leads
-- verificavam apenas user_roles com role = 'admin', mas o role está em profiles
-- e precisa incluir tanto 'admin' quanto 'dono'
-- =====================================================

-- =====================================================
-- CORRIGIR POLÍTICA DE crm_contacts
-- =====================================================

DROP POLICY IF EXISTS "Clinic-based contacts view" ON public.crm_contacts;

CREATE POLICY "Clinic-based contacts view" ON public.crm_contacts
  FOR SELECT TO authenticated
  USING (
    -- Admin OU Dono pode ver tudo (usando função is_admin_or_dono que verifica profiles)
    public.is_admin_or_dono(auth.uid()) OR
    -- Próprio contato
    user_id = auth.uid() OR
    user_id IS NULL OR
    -- É membro da mesma clínica do dono do contato
    EXISTS (
      SELECT 1 
      FROM public.clinic_members cm1
      INNER JOIN public.clinic_members cm2 ON cm2.clinic_id = cm1.clinic_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = crm_contacts.user_id
        AND cm1.is_active = true
        AND cm2.is_active = true
        AND (
          cm1.role = 'secretaria' OR 
          cm1.role = 'dono' OR
          EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = cm1.clinic_id AND c.owner_id = auth.uid())
        )
    )
  );

-- =====================================================
-- CORRIGIR POLÍTICA DE crm_deals
-- =====================================================

-- Verificar se existe política que permite tudo (pode estar sobrescrevendo)
DROP POLICY IF EXISTS "Authenticated users can view crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view their own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view their own deals or admin/dono can view all" ON public.crm_deals;

-- Criar política que permite admin/dono ver tudo, outros apenas seus próprios
CREATE POLICY "Users can view their own deals or admin/dono can view all" ON public.crm_deals
  FOR SELECT TO authenticated
  USING (
    -- Admin OU Dono pode ver tudo
    public.is_admin_or_dono(auth.uid()) OR
    -- Próprio deal (user_id ou assigned_to)
    auth.uid() = user_id OR auth.uid() = assigned_to
  );

-- =====================================================
-- CORRIGIR POLÍTICA DE commercial_leads
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own leads" ON public.commercial_leads;

CREATE POLICY "Users can view their own leads or admin/dono can view all" ON public.commercial_leads
  FOR SELECT TO authenticated
  USING (
    -- Admin OU Dono pode ver tudo
    public.is_admin_or_dono(auth.uid()) OR
    -- Próprio lead
    auth.uid() = user_id
  );

-- =====================================================
-- CORRIGIR POLÍTICA DE commercial_sales
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own sales" ON public.commercial_sales;

CREATE POLICY "Users can view their own sales or admin/dono can view all" ON public.commercial_sales
  FOR SELECT TO authenticated
  USING (
    -- Admin OU Dono pode ver tudo
    public.is_admin_or_dono(auth.uid()) OR
    -- Própria venda
    auth.uid() = user_id
  );

