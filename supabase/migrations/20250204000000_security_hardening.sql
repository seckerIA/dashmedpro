-- Security Hardening: Enable RLS on all critical tables
-- This ensures that no table is left exposed without Row Level Security

-- 1. Profiles (User Data)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CRM Data
ALTER TABLE IF EXISTS public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commercial_leads ENABLE ROW LEVEL SECURITY;

-- 3. Financial Data
ALTER TABLE IF EXISTS public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Tasks & Operations
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_appointments ENABLE ROW LEVEL SECURITY;

-- 5. Communication
ALTER TABLE IF EXISTS public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_chats ENABLE ROW LEVEL SECURITY;

-- 6. Ensure no function is running with SECURITY DEFINER unless necessary and carefully auditing
-- (Manual review required for functions, this script focuses on tables)
