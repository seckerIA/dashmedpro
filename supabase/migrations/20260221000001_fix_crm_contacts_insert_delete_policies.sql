-- =====================================================
-- MIGRATION: Adicionar policies de INSERT e DELETE em crm_contacts
-- Problema: INSERT/DELETE travavam porque não havia policies
-- Data: 2026-01-21
-- =====================================================

-- 1. Garantir limpeza de policies antigas
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their organization" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.crm_contacts;

-- 2. Criar policy de INSERT (consistente com SELECT/UPDATE existentes)
CREATE POLICY "Users can insert contacts in their organization"
ON public.crm_contacts FOR INSERT
WITH CHECK ( organization_id = ANY(public.get_user_org_ids()) );

-- 3. Criar policy de DELETE
CREATE POLICY "Users can delete contacts in their organization"
ON public.crm_contacts FOR DELETE
USING ( organization_id = ANY(public.get_user_org_ids()) );

-- 4. Verificar grants
GRANT INSERT, DELETE ON public.crm_contacts TO authenticated;
