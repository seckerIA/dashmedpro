-- =====================================================
-- MIGRATION: Corrigir permissões de UPDATE em contatos
-- Objetivo: Permitir que médicos e secretárias vinculadas editem contatos compartilhados
-- Data: 2026-01-16
-- =====================================================

-- 1. Dropar políticas antigas/restritivas de UPDATE e SELECT se existirem
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Contacts update policy" ON public.crm_contacts;
DROP POLICY IF EXISTS "Contacts access policy" ON public.crm_contacts; -- Caso tenha sido criada como ALL

-- 2. Criar política unificada de SELECT (Leitura)
-- Abrange: Admin/Dono, Próprio Usuário, e Vínculo Médico-Secretária (Bidirecional)
CREATE POLICY "Contacts select policy"
  ON public.crm_contacts FOR SELECT
  USING (
    -- Admin/Dono (via função helper ou verificação direta se a função não existir para profiles)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'dono')
    OR
    -- Próprio contato (criador)
    auth.uid() = user_id 
    OR
    -- Vínculo Médico <-> Secretária (Bidirecional)
    EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE 
        -- Se eu sou secretária, vejo contatos dos meus médicos
        (secretary_id = auth.uid() AND doctor_id = public.crm_contacts.user_id)
        -- Se eu sou médico, vejo contatos das minhas secretárias
        OR (doctor_id = auth.uid() AND secretary_id = public.crm_contacts.user_id)
    )
  );

-- 3. Criar política unificada de UPDATE (Edição)
-- Abrange as mesmas regras do SELECT
CREATE POLICY "Contacts update policy"
  ON public.crm_contacts FOR UPDATE
  USING (
    -- Admin/Dono
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'dono')
    OR
    -- Próprio contato
    auth.uid() = user_id 
    OR
    -- Vínculo Médico <-> Secretária (Bidirecional)
    EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE 
        -- Se eu sou secretária, edito contatos dos meus médicos
        (secretary_id = auth.uid() AND doctor_id = public.crm_contacts.user_id)
        -- Se eu sou médico, edito contatos das minhas secretárias
        OR (doctor_id = auth.uid() AND secretary_id = public.crm_contacts.user_id)
    )
  );

-- Comentários
COMMENT ON POLICY "Contacts update policy" ON public.crm_contacts IS 
  'Permite edição de contatos para admin, dono, criador e colaboradores vinculados (médico/secretária)';
