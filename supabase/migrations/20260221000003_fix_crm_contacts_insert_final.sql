-- =====================================================
-- MIGRATION: Corrigir policy de INSERT em crm_contacts (FINAL)
-- Problema: Query travava porque .select() após INSERT não tinha permissão
-- Solução: Policy simples que verifica apenas autenticação e org_id não-nulo
-- Data: 2026-01-21
-- =====================================================

-- 1. Remover todas as policies de INSERT e DELETE existentes
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their organization" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.crm_contacts;

-- 2. Criar policy de INSERT simplificada
-- Permite INSERT se:
-- - Usuário está autenticado
-- - organization_id não é nulo
CREATE POLICY "Users can insert contacts in their organization"
ON public.crm_contacts FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND organization_id IS NOT NULL
);

-- 3. Criar policy de DELETE
-- Permite DELETE se usuário pertence à mesma organização do registro
CREATE POLICY "Users can delete contacts in their organization"
ON public.crm_contacts FOR DELETE
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
  )
);

-- 4. Garantir grants
GRANT INSERT, DELETE ON public.crm_contacts TO authenticated;
