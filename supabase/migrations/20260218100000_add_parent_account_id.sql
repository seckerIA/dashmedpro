-- =====================================================
-- Add parent_account_id to ad_platform_connections
-- Enables BM → child asset hierarchy tracking
-- =====================================================

-- Add parent_account_id column (references account_id of parent BM)
ALTER TABLE public.ad_platform_connections
ADD COLUMN IF NOT EXISTS parent_account_id TEXT;

-- Index for hierarchy queries (find children of a BM)
CREATE INDEX IF NOT EXISTS idx_ad_platform_parent
ON public.ad_platform_connections(user_id, parent_account_id)
WHERE parent_account_id IS NOT NULL;

COMMENT ON COLUMN public.ad_platform_connections.parent_account_id IS 'Account ID of parent Business Manager (e.g., bm_123456). NULL for top-level BMs and orphan accounts.';
