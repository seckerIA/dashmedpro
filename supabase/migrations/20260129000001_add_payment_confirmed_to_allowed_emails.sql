-- Migration: Add payment_confirmed field to allowed_emails
-- Description: Blocks Google login for users who haven't paid yet

-- ============================================
-- 1. Add payment_confirmed column
-- ============================================
ALTER TABLE public.allowed_emails
ADD COLUMN IF NOT EXISTS payment_confirmed boolean DEFAULT false;

-- ============================================
-- 2. Add payment_confirmed_at timestamp
-- ============================================
ALTER TABLE public.allowed_emails
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON COLUMN public.allowed_emails.payment_confirmed IS 'Whether the customer has paid. Only paid customers can login via Google OAuth.';
COMMENT ON COLUMN public.allowed_emails.payment_confirmed_at IS 'When the payment was confirmed by admin.';

-- ============================================
-- 4. Update existing records to have payment_confirmed = true
--    (assuming all existing records are from paying customers)
-- ============================================
UPDATE public.allowed_emails
SET payment_confirmed = true,
    payment_confirmed_at = COALESCE(created_at, now())
WHERE payment_confirmed IS NULL OR payment_confirmed = false;
