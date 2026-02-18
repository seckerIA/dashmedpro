-- Reclassify ad accounts that were auto-created by WhatsApp Business
-- These accounts have "(Read-Only)" in the name and are WABA-associated ad accounts,
-- not regular ad accounts. They should be categorized as 'waba' instead of 'other'.

UPDATE ad_platform_connections
SET account_category = 'waba'
WHERE platform = 'meta_ads'
  AND account_id != 'meta_oauth'
  AND account_name ILIKE '%(Read-Only)%'
  AND (account_category IS NULL OR account_category = 'other');
