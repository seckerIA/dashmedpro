-- ============================================
-- Migration: Fix Sales Calls and Contacts Permissions
-- Description: Corrige políticas RLS de crm_contacts para que
--              admin e dono sempre vejam TODOS os contatos,
--              independente do toggle show_all_contacts.
--              Isso permite criar reuniões com qualquer contato.
-- Date: 2025-01-13
-- ============================================

-- ============================================
-- CRM CONTACTS - Corrigir políticas
-- ============================================

-- Remover políticas antigas que dependem do toggle
DROP POLICY IF EXISTS "Users can view their own contacts or all if admin/dono with tog" ON crm_contacts;
DROP POLICY IF EXISTS "Users can update their contacts or all if admin/dono with toggl" ON crm_contacts;

-- Criar nova política de SELECT
-- Admin e Dono veem TODOS os contatos
-- Outros usuários veem apenas os próprios
CREATE POLICY "Admin and Dono can view all contacts, others view own"
  ON crm_contacts
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
  );

-- Criar nova política de UPDATE
-- Admin e Dono podem editar TODOS os contatos
-- Outros usuários podem editar apenas os próprios
CREATE POLICY "Admin and Dono can update all contacts, others update own"
  ON crm_contacts
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin_or_dono(auth.uid())
  );

-- ============================================
-- Comentários explicativos
-- ============================================

COMMENT ON POLICY "Admin and Dono can view all contacts, others view own" ON crm_contacts IS 
'Admin e Dono sempre veem todos os contatos (necessário para criar reuniões). Outros usuários veem apenas os próprios.';

COMMENT ON POLICY "Admin and Dono can update all contacts, others update own" ON crm_contacts IS 
'Admin e Dono podem editar qualquer contato. Outros usuários podem editar apenas os próprios.';

-- ============================================
-- Nota sobre show_all_contacts
-- ============================================
-- O campo show_all_contacts em profiles agora serve apenas como
-- preferência de UI no frontend, não como restrição de segurança.
-- Admin e Dono sempre têm acesso a todos os contatos no banco,
-- mas o frontend pode usar o toggle para filtrar a exibição.
