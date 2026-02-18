
-- Auto-classify existing accounts by name patterns
UPDATE public.ad_platform_connections 
SET account_category = 'waba' 
WHERE (account_name ILIKE '%whats%' OR account_name ILIKE '%waba%' OR account_name ILIKE '%disparo%')
AND account_category = 'other';

UPDATE public.ad_platform_connections 
SET account_category = 'bm' 
WHERE (account_name ILIKE '%bm %' OR account_name ILIKE '%bm-%' OR account_name ILIKE 'bm %' OR account_name ILIKE '%business manager%')
AND account_category = 'other';
