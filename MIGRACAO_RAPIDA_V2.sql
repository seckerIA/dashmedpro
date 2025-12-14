-- ========================================
-- MIGRAÇÃO RÁPIDA - DASHMED PRO (V2 - CORRIGIDA)
-- ========================================
-- Este script aplica TODA a estrutura do banco de uma vez
-- Copie TUDO e cole no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/sql/new
-- ========================================

-- Começar uma transação para garantir atomicidade
BEGIN;

-- ========================================
-- PARTE 1: Limpar estruturas existentes (CORRIGIDO)
-- ========================================

-- Drop policies existentes que podem conflitar (APENAS de tabelas que existem)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tableowner != 'supabase_admin'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', r.tablename, r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', r.tablename, r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', r.tablename, r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', r.tablename, r.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorar erros (tabela pode ter sido dropada)
                NULL;
        END;
    END LOOP;
END $$;

-- ========================================
-- PARTE 2: Criar estrutura completa
-- ========================================

-- Create role enum (usar IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'dono', 'vendedor', 'gestor_trafego');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CRM Contacts table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.crm_contacts;

CREATE POLICY "Authenticated users can view contacts" ON public.crm_contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage contacts" ON public.crm_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  needs_follow_up BOOLEAN DEFAULT false,
  notes TEXT,
  service TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can manage deals" ON public.deals;

CREATE POLICY "Authenticated users can view deals" ON public.deals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage deals" ON public.deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Follow ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Authenticated users can manage follow_ups" ON public.follow_ups;

CREATE POLICY "Authenticated users can view follow_ups" ON public.follow_ups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage follow_ups" ON public.follow_ups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.tasks;

CREATE POLICY "Authenticated users can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage tasks" ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Task assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (task_id, user_id)
);

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view task_assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Authenticated users can manage task_assignments" ON public.task_assignments;

CREATE POLICY "Authenticated users can view task_assignments" ON public.task_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage task_assignments" ON public.task_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial accounts table
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view accounts" ON public.financial_accounts;
DROP POLICY IF EXISTS "Authenticated users can manage accounts" ON public.financial_accounts;

CREATE POLICY "Authenticated users can view accounts" ON public.financial_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage accounts" ON public.financial_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial categories table
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.financial_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.financial_categories;

CREATE POLICY "Authenticated users can view categories" ON public.financial_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage categories" ON public.financial_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.financial_transactions;

CREATE POLICY "Authenticated users can view transactions" ON public.financial_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recurring transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view recurring" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage recurring" ON public.recurring_transactions;

CREATE POLICY "Authenticated users can view recurring" ON public.recurring_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage recurring" ON public.recurring_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales calls table
CREATE TABLE IF NOT EXISTS public.sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view calls" ON public.sales_calls;
DROP POLICY IF EXISTS "Authenticated users can manage calls" ON public.sales_calls;

CREATE POLICY "Authenticated users can view calls" ON public.sales_calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage calls" ON public.sales_calls
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prospecting scripts table
CREATE TABLE IF NOT EXISTS public.prospecting_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prospecting_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view scripts" ON public.prospecting_scripts;
DROP POLICY IF EXISTS "Authenticated users can manage scripts" ON public.prospecting_scripts;

CREATE POLICY "Authenticated users can view scripts" ON public.prospecting_scripts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage scripts" ON public.prospecting_scripts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prospecting sessions table
CREATE TABLE IF NOT EXISTS public.prospecting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  script_id UUID REFERENCES public.prospecting_scripts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  calls_made INTEGER DEFAULT 0,
  contacts_reached INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  notes TEXT
);

ALTER TABLE public.prospecting_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.prospecting_sessions;
DROP POLICY IF EXISTS "Authenticated users can manage sessions" ON public.prospecting_sessions;

CREATE POLICY "Authenticated users can view sessions" ON public.prospecting_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage sessions" ON public.prospecting_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily reports table
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  calls_made INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Authenticated users can manage reports" ON public.daily_reports;

CREATE POLICY "Authenticated users can view reports" ON public.daily_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage reports" ON public.daily_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Default goals table
CREATE TABLE IF NOT EXISTS public.default_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  daily_calls INTEGER DEFAULT 50,
  daily_emails INTEGER DEFAULT 20,
  daily_meetings INTEGER DEFAULT 3,
  monthly_revenue DECIMAL(15,2) DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.default_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view goals" ON public.default_goals;
DROP POLICY IF EXISTS "Authenticated users can manage goals" ON public.default_goals;

CREATE POLICY "Authenticated users can view goals" ON public.default_goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage goals" ON public.default_goals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drop existing first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_default_goals_updated_at ON public.default_goals;
CREATE TRIGGER update_default_goals_updated_at BEFORE UPDATE ON public.default_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PARTE 3: Configurar usuário admin
-- ========================================

-- Update user role to admin and name to Filipe for filipesenna59@gmail.com
-- This script detects the database structure and updates accordingly
DO $$
DECLARE
    user_id_val UUID;
    has_role_column BOOLEAN;
    has_user_roles_table BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO user_id_val
    FROM auth.users
    WHERE email = 'filipesenna59@gmail.com';

    IF user_id_val IS NULL THEN
        RAISE NOTICE 'User with email filipesenna59@gmail.com not found in auth.users - skipping admin setup';
        RETURN;
    END IF;

    -- Check if role column exists in profiles table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) INTO has_role_column;

    -- Check if user_roles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_roles'
    ) INTO has_user_roles_table;

    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id_val
    ) INTO profile_exists;

    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        IF has_role_column THEN
            INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, 'filipesenna59@gmail.com', 'admin', 'Filipe', true, NOW(), NOW());
        ELSE
            INSERT INTO public.profiles (id, email, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, 'filipesenna59@gmail.com', 'Filipe', true, NOW(), NOW());
        END IF;
    ELSE
        -- Update profile name
        UPDATE public.profiles
        SET full_name = 'Filipe',
            updated_at = NOW()
        WHERE id = user_id_val;

        -- Update role based on structure
        IF has_role_column THEN
            UPDATE public.profiles
            SET role = 'admin',
                updated_at = NOW()
            WHERE id = user_id_val;
        END IF;
    END IF;

    -- If user_roles table exists, also update/insert there
    IF has_user_roles_table THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id_val, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO UPDATE
        SET role = 'admin'::app_role;
    END IF;

    RAISE NOTICE 'Profile updated successfully for user: % (role column: %, user_roles table: %)',
        user_id_val, has_role_column, has_user_roles_table;
END $$;

-- ========================================
-- FINALIZAR TRANSAÇÃO
-- ========================================
COMMIT;

-- ✅ Migração concluída com sucesso!
-- Execute a query de validação abaixo:

SELECT
    p.id,
    p.email,
    p.full_name,
    p.is_active,
    u.email as auth_email,
    ur.role as role_from_user_roles
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email = 'filipesenna59@gmail.com' OR u.email = 'filipesenna59@gmail.com';
