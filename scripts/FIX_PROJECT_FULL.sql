-- ==============================================================================
-- SCRIPT DE CORREÇÃO TOTAL E LIMPEZA - DASHMED PRO
-- Data: 2026-01-05
-- ==============================================================================

-- 1. CORREÇÕES DE SEGURANÇA E FUNÇÕES
-- ==============================================================================

-- Fix: Vulnerabilidade de search_path na função de update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- 2. GERENCIAMENTO DE ROLES (Unificação)
-- ==============================================================================

-- Criar tabela user_roles se não existir
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role public.user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uniq_user_role UNIQUE(user_id) -- Garante um role por usuário por enquanto
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies para user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles 
    FOR ALL USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'dono')
        )
    );

-- Sincronizar dados existentes de profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles 
WHERE role IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Trigger para manter sincronia (Profiles -> UserRoles)
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
        -- Upsert no user_roles
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (NEW.id, NEW.role)
        ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_user_roles();

-- 3. LIMPEZA DE DADOS (RESET DE TRANSAÇÕES E CRM)
-- ==============================================================================
-- Apaga todos os dados de operação, mantendo usuários e configurações básicas.

-- Desabilitar triggers temporariamente para evitar overhead
SET session_replication_role = 'replica';

-- Limpeza em ordem de dependência (filhos primeiro ou via CASCADE)
TRUNCATE TABLE 
    public.crm_activities,
    public.crm_follow_ups,
    public.commercial_lead_interactions,
    public.transaction_costs,
    public.financial_attachments,
    public.financial_recurring_transactions,
    public.financial_budgets,
    public.commercial_sales,
    public.commercial_leads,
    public.medical_appointments,
    public.sales_calls,
    public.voip_call_sessions,
    public.tasks,
    public.crm_deals,
    public.financial_transactions,
    public.crm_contacts
RESTART IDENTITY CASCADE;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- 4. PERFORMANCE (ÍNDICES)
-- ==============================================================================
-- Adiciona índices em todas as Foreign Keys para performance do Dashboard

-- Financial
CREATE INDEX IF NOT EXISTS idx_financial_trans_user ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_trans_account ON public.financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_trans_category ON public.financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_trans_contact ON public.financial_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_financial_trans_deal ON public.financial_transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_financial_trans_date ON public.financial_transactions(date);

-- CRM
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON public.crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON public.crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON public.crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON public.crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON public.crm_activities(contact_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON public.tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Medical
CREATE INDEX IF NOT EXISTS idx_medical_app_user ON public.medical_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_app_contact ON public.medical_appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_medical_app_trans ON public.medical_appointments(financial_transaction_id);
CREATE INDEX IF NOT EXISTS idx_medical_app_start_time ON public.medical_appointments(start_time);

-- Sales Calls
CREATE INDEX IF NOT EXISTS idx_sales_calls_contact ON public.sales_calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_deal ON public.sales_calls(deal_id);

-- 5. LIMPEZA DE TABELAS OBSOLETAS
-- ==============================================================================
DROP TABLE IF EXISTS public.contacts CASCADE; -- Tabela antiga, substituída por crm_contacts
DROP TABLE IF EXISTS public.messages CASCADE; -- Tabela não utilizada

-- 6. REVISÃO DE RLS (Otimização Básica)
-- ==============================================================================
-- Exemplo: Melhorar performance do Profiles RLS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles viewable by users" ON public.profiles 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);
