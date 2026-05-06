-- Add missing columns to financial_transactions
ALTER TABLE public.financial_transactions 
  ADD COLUMN IF NOT EXISTS transaction_date DATE,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS has_costs BOOLEAN DEFAULT false;

-- Update date column with transaction_date if null
UPDATE public.financial_transactions SET transaction_date = date WHERE transaction_date IS NULL;

DO $$
BEGIN
  IF to_regclass('public.recurring_transactions') IS NOT NULL
     AND to_regclass('public.financial_recurring_transactions') IS NULL THEN
    ALTER TABLE public.recurring_transactions RENAME TO financial_recurring_transactions;
  END IF;
END $$;

ALTER TABLE public.financial_recurring_transactions
  ADD COLUMN IF NOT EXISTS template_transaction_id UUID REFERENCES public.financial_transactions(id),
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS end_date DATE;

DROP POLICY IF EXISTS "Authenticated users can view recurring" ON public.financial_recurring_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage recurring" ON public.financial_recurring_transactions;

CREATE POLICY "Authenticated users can view recurring" ON public.financial_recurring_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage recurring" ON public.financial_recurring_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.financial_recurring_transactions
  ADD COLUMN IF NOT EXISTS next_execution_date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_recurring_transactions' AND column_name = 'next_date'
  ) THEN
    EXECUTE 'UPDATE public.financial_recurring_transactions SET next_execution_date = next_date WHERE next_execution_date IS NULL';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_recurring_transactions' AND column_name = 'next_occurrence'
  ) THEN
    EXECUTE 'UPDATE public.financial_recurring_transactions SET next_execution_date = next_occurrence WHERE next_execution_date IS NULL';
  END IF;
END $$;

-- Add missing columns to prospecting_sessions  
ALTER TABLE public.prospecting_sessions
  ADD COLUMN IF NOT EXISTS goal_calls INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS goal_contacts INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_pause_time INTEGER DEFAULT 0;

-- Create transaction_costs table
CREATE TABLE IF NOT EXISTS public.transaction_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  attachment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transaction_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view transaction_costs" ON public.transaction_costs;
CREATE POLICY "Authenticated users can view transaction_costs" ON public.transaction_costs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage transaction_costs" ON public.transaction_costs;
CREATE POLICY "Authenticated users can manage transaction_costs" ON public.transaction_costs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);