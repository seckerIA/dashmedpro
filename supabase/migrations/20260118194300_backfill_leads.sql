-- Backfill commercial_leads from crm_contacts
-- Insert contacts that don't satisfy the condition of already having a corresponding lead
INSERT INTO commercial_leads (
  id,
  user_id,
  name,
  email,
  phone,
  origin,
  status,
  contact_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(), -- Generate new ID for the lead
  c.user_id,
  c.full_name,
  c.email,
  c.phone,
  COALESCE((c.custom_fields->>'origin')::commercial_lead_origin, 'other'), -- Extract origin or default
  'new', -- Default status
  c.id,
  c.created_at,
  c.updated_at
FROM crm_contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM commercial_leads l 
  WHERE l.contact_id = c.id 
  OR (l.email = c.email AND c.email IS NOT NULL AND c.email != '')
  OR (l.phone = c.phone AND c.phone IS NOT NULL AND c.phone != '')
);
