
-- Add account_category column to classify ad accounts
ALTER TABLE public.ad_platform_connections
ADD COLUMN account_category TEXT NOT NULL DEFAULT 'other';

-- Add comment for documentation
COMMENT ON COLUMN public.ad_platform_connections.account_category IS 'Category: bm (Business Manager), waba (WhatsApp Business Account), other';
