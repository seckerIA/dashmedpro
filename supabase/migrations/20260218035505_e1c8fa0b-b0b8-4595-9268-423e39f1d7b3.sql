
-- Reclassify existing accounts based on name patterns
-- WABAs: contain 'whats', 'waba', 'disparo' in name, or account_id starts with 'waba_'
UPDATE public.ad_platform_connections 
SET account_category = 'waba' 
WHERE account_category = 'other'
AND (
  account_name ILIKE '%whatsapp%' 
  OR account_name ILIKE '%whats %' 
  OR account_name ILIKE '%waba%' 
  OR account_name ILIKE '%disparo%'
  OR account_name ILIKE '% whats%'
  OR account_id LIKE 'waba_%'
);

-- BMs: contain 'BM' as word or 'business manager', or account_id starts with 'bm_'
UPDATE public.ad_platform_connections 
SET account_category = 'bm' 
WHERE account_category = 'other'
AND (
  account_name ~* '\bBM\b'
  OR account_name ILIKE '%business manager%'
  OR account_id LIKE 'bm_%'
);
