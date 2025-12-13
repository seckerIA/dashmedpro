-- Add missing columns to financial_transactions
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add missing columns to financial_recurring_transactions
ALTER TABLE public.financial_recurring_transactions
  ADD COLUMN IF NOT EXISTS last_execution_date DATE,
  ADD COLUMN IF NOT EXISTS auto_create BOOLEAN DEFAULT true;

-- Add missing columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create prospecting_daily_reports table
CREATE TABLE IF NOT EXISTS public.prospecting_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.prospecting_sessions(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  calls_made INTEGER DEFAULT 0,
  contacts_reached INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  goal_calls INTEGER DEFAULT 50,
  goal_contacts INTEGER DEFAULT 20,
  notes TEXT,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prospecting_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view daily_reports_prosp" ON public.prospecting_daily_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage daily_reports_prosp" ON public.prospecting_daily_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);