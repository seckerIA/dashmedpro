-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dono', 'vendedor', 'gestor_trafego');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
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

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles RLS policies
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
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CRM Contacts table
CREATE TABLE public.crm_contacts (
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

CREATE POLICY "Authenticated users can view contacts" ON public.crm_contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage contacts" ON public.crm_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Deals table
CREATE TABLE public.deals (
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

CREATE POLICY "Authenticated users can view deals" ON public.deals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage deals" ON public.deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Follow ups table
CREATE TABLE public.follow_ups (
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

CREATE POLICY "Authenticated users can view follow_ups" ON public.follow_ups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage follow_ups" ON public.follow_ups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks table
CREATE TABLE public.tasks (
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

CREATE POLICY "Authenticated users can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage tasks" ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Task assignments table
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (task_id, user_id)
);

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task_assignments" ON public.task_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage task_assignments" ON public.task_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial accounts table
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view accounts" ON public.financial_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage accounts" ON public.financial_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial categories table
CREATE TABLE public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories" ON public.financial_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage categories" ON public.financial_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial transactions table
CREATE TABLE public.financial_transactions (
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

CREATE POLICY "Authenticated users can view transactions" ON public.financial_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recurring transactions table
CREATE TABLE public.recurring_transactions (
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

CREATE POLICY "Authenticated users can view recurring" ON public.recurring_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage recurring" ON public.recurring_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales calls table
CREATE TABLE public.sales_calls (
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

CREATE POLICY "Authenticated users can view calls" ON public.sales_calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage calls" ON public.sales_calls
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prospecting scripts table
CREATE TABLE public.prospecting_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prospecting_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scripts" ON public.prospecting_scripts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage scripts" ON public.prospecting_scripts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prospecting sessions table
CREATE TABLE public.prospecting_sessions (
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

CREATE POLICY "Authenticated users can view sessions" ON public.prospecting_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage sessions" ON public.prospecting_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily reports table
CREATE TABLE public.daily_reports (
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

CREATE POLICY "Authenticated users can view reports" ON public.daily_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage reports" ON public.daily_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Default goals table
CREATE TABLE public.default_goals (
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

CREATE POLICY "Authenticated users can view goals" ON public.default_goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage goals" ON public.default_goals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_default_goals_updated_at BEFORE UPDATE ON public.default_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();