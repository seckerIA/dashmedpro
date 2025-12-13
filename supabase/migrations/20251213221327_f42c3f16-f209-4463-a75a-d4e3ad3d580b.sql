-- Add missing columns to crm_contacts
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

-- Add description column to crm_deals
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS description TEXT;

-- Add tags column to crm_deals  
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor';