-- Add start_date column to financial_recurring_transactions
ALTER TABLE public.financial_recurring_transactions
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add missing columns to prospecting_scripts
ALTER TABLE public.prospecting_scripts
  ADD COLUMN IF NOT EXISTS cards JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_copy BOOLEAN DEFAULT false;

-- Add missing columns to default_goals
ALTER TABLE public.default_goals
  ADD COLUMN IF NOT EXISTS goal_calls INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS goal_contacts INTEGER DEFAULT 20;

-- Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- Add missing columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.crm_contacts(id),
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.crm_deals(id);

-- Add missing columns to sales_calls
ALTER TABLE public.sales_calls
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'outgoing';

-- Add missing columns to daily_reports
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS prospecting_session_id UUID REFERENCES public.prospecting_sessions(id);

-- Add contact_id column to financial_transactions for linking to contacts
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.crm_contacts(id);