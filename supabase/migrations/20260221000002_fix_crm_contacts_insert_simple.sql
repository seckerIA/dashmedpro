-- =====================================================
-- MIGRATION: Simplificar policy de INSERT em crm_contacts
-- Problema: Policy anterior usava get_user_org_ids() que pode falhar
-- Solução: Verificar diretamente na tabela organization_members
-- Data: 2026-01-21
-- =====================================================

-- 1. Remover policies existentes de INSERT e DELETE
DROP POLICY IF EXISTS "Users can insert contacts in their organization" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.crm_contacts;

-- 2. Criar policy de INSERT simplificada (verifica diretamente em organization_members)
CREATE POLICY "Users can insert contacts in their organization"
ON public.crm_contacts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = crm_contacts.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- 3. Criar policy de DELETE simplificada
CREATE POLICY "Users can delete contacts in their organization"
ON public.crm_contacts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = crm_contacts.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- 4. Garantir que organization_members tem RLS permissivo para SELECT
-- Isso é necessário para que a subquery acima funcione
DROP POLICY IF EXISTS "Users can view all organization_members" ON public.organization_members;
CREATE POLICY "Users can view all organization_members"
ON public.organization_members FOR SELECT
USING (true);

-- 5. Garantir grants
GRANT INSERT, DELETE ON public.crm_contacts TO authenticated;
GRANT SELECT ON public.organization_members TO authenticated;
