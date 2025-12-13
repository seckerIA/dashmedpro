-- Add missing columns to prospecting_daily_reports
ALTER TABLE public.prospecting_daily_reports
  ADD COLUMN IF NOT EXISTS final_calls INTEGER,
  ADD COLUMN IF NOT EXISTS final_contacts INTEGER,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_paused_time INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- Add recurrence_id and total_costs to financial_transactions
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS recurrence_id UUID,
  ADD COLUMN IF NOT EXISTS total_costs DECIMAL(15,2) DEFAULT 0;