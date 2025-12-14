-- Add missing columns to financial_accounts
ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS current_balance DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15,2) DEFAULT 0;

-- Add missing columns to financial_categories
ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.financial_categories(id);

-- Create user_daily_goals table
CREATE TABLE IF NOT EXISTS public.user_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_goal_calls INTEGER DEFAULT 50,
  default_goal_contacts INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily_goals" ON public.user_daily_goals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own daily_goals" ON public.user_daily_goals
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create crm_follow_ups table (different from follow_ups)
CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'call',
  scheduled_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crm_follow_ups" ON public.crm_follow_ups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage crm_follow_ups" ON public.crm_follow_ups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create financial_attachments table
CREATE TABLE IF NOT EXISTS public.financial_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachments" ON public.financial_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage attachments" ON public.financial_attachments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create financial_budgets table
CREATE TABLE IF NOT EXISTS public.financial_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budgets" ON public.financial_budgets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage budgets" ON public.financial_budgets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);