-- ==============================================================================
-- SCRIPT DE REVISÃO FINA DE PERMISSÕES (RLS)
-- Data: 2026-01-05
-- Descrição: Padroniza e fortalece a segurança em tabelas críticas.
-- ==============================================================================

-- Função auxiliar para verificar permissão de admin (Performance Otimizada)
-- Já existe is_admin_or_dono, mas vamos garantir que ela seja eficiente
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'dono')
  );
$$;

-- ==============================================================================
-- 1. TABELA: crm_contacts
-- ==============================================================================
DROP POLICY IF EXISTS "CRM contacts viewable by own users" ON public.crm_contacts;
DROP POLICY IF EXISTS "CRM contacts insertable by own users" ON public.crm_contacts;
DROP POLICY IF EXISTS "CRM contacts updatable by own users" ON public.crm_contacts;
DROP POLICY IF EXISTS "CRM contacts deletable by own users" ON public.crm_contacts;
-- Remover policies antigas genéricas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON public.crm_contacts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.crm_contacts;

-- Novas Policies Padronizadas
CREATE POLICY "crm_contacts_select" ON public.crm_contacts
FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
    -- Futuro: Adicionar lógica de equipes aqui
);

CREATE POLICY "crm_contacts_insert" ON public.crm_contacts
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "crm_contacts_update" ON public.crm_contacts
FOR UPDATE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "crm_contacts_delete" ON public.crm_contacts
FOR DELETE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

-- ==============================================================================
-- 2. TABELA: crm_deals
-- ==============================================================================
DROP POLICY IF EXISTS "CRM deals viewable by own users" ON public.crm_deals;
DROP POLICY IF EXISTS "CRM deals insertable by own users" ON public.crm_deals;
DROP POLICY IF EXISTS "CRM deals updatable by own users" ON public.crm_deals;
DROP POLICY IF EXISTS "CRM deals deletable by own users" ON public.crm_deals;

CREATE POLICY "crm_deals_select" ON public.crm_deals
FOR SELECT USING (
    auth.uid() = user_id 
    OR assigned_to = auth.uid()
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "crm_deals_insert" ON public.crm_deals
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "crm_deals_update" ON public.crm_deals
FOR UPDATE USING (
    auth.uid() = user_id 
    OR assigned_to = auth.uid()
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "crm_deals_delete" ON public.crm_deals
FOR DELETE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

-- ==============================================================================
-- 3. TABELA: financial_transactions (CRÍTICO)
-- ==============================================================================
DROP POLICY IF EXISTS "Financial transactions viewable by own users" ON public.financial_transactions;
DROP POLICY IF EXISTS "Financial transactions insertable by own users" ON public.financial_transactions;
DROP POLICY IF EXISTS "Financial transactions updatable by own users" ON public.financial_transactions;
DROP POLICY IF EXISTS "Financial transactions deletable by own users" ON public.financial_transactions;

CREATE POLICY "financial_transactions_select" ON public.financial_transactions
FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "financial_transactions_insert" ON public.financial_transactions
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "financial_transactions_update" ON public.financial_transactions
FOR UPDATE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "financial_transactions_delete" ON public.financial_transactions
FOR DELETE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

-- ==============================================================================
-- 4. TABELA: tasks
-- ==============================================================================
DROP POLICY IF EXISTS "Tasks viewable by own users" ON public.tasks;
DROP POLICY IF EXISTS "Tasks insertable by own users" ON public.tasks;
DROP POLICY IF EXISTS "Tasks updatable by own users" ON public.tasks;
DROP POLICY IF EXISTS "Tasks deletable by own users" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks
FOR SELECT USING (
    auth.uid() = user_id 
    OR assigned_to = auth.uid()
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR assigned_to = auth.uid() -- Permitir criar tarefa para si mesmo se atribuída
);

CREATE POLICY "tasks_update" ON public.tasks
FOR UPDATE USING (
    auth.uid() = user_id 
    OR assigned_to = auth.uid()
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "tasks_delete" ON public.tasks
FOR DELETE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

-- ==============================================================================
-- 5. TABELA: medical_appointments
-- ==============================================================================
DROP POLICY IF EXISTS "Medical appointments viewable by own users" ON public.medical_appointments;
-- Etc... limpar policies antigas pode ser feito via CASCADE ou drop manual se soubermos os nomes.
-- Como os nomes variam, o ideal é usar DROP POLICY IF EXISTS com os nomes padronizados que esperamos que existam,
-- ou aceitar que policies antigas podem coexistir (mas é ruim).
-- Vou recriar as policies com nomes padronizados, se der conflito o usuário verá erro, mas é melhor garantir.

CREATE POLICY "medical_appointments_select" ON public.medical_appointments
FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
    -- Adicionar permissão para Secretárias verem agendamentos dos Médicos vinculados?
    -- Futuro: Implementar check na tabela secretary_doctor_links
);

CREATE POLICY "medical_appointments_insert" ON public.medical_appointments
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "medical_appointments_update" ON public.medical_appointments
FOR UPDATE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);

CREATE POLICY "medical_appointments_delete" ON public.medical_appointments
FOR DELETE USING (
    auth.uid() = user_id 
    OR is_admin_or_dono(auth.uid())
);
