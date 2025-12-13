-- Add missing columns to crm_follow_ups
ALTER TABLE public.crm_follow_ups
  ADD COLUMN IF NOT EXISTS scheduled_time TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS completed_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to prospecting_sessions
ALTER TABLE public.prospecting_sessions
  ADD COLUMN IF NOT EXISTS result JSONB;

-- Add missing columns to sales_calls
ALTER TABLE public.sales_calls
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to prospecting_daily_reports
ALTER TABLE public.prospecting_daily_reports
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to crm_deals
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS contact_name TEXT;