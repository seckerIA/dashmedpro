-- Add organization_id to core tables
-- Initially nullable to support legacy data. 
-- Will be made NOT NULL in a future migration after data backfill.

-- 1. Profiles (Users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 2. CRM & Patients
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.crm_deals 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.commercial_leads 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.commercial_sales 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 3. Medical
ALTER TABLE public.medical_appointments 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 4. Financial
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.financial_categories 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.financial_accounts 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 5. Inventory
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.inventory_transactions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.inventory_batches 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Create indexes for performance (since we'll query by org_id constantly)
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_id ON public.crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_org_id ON public.crm_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_org_id ON public.commercial_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_commercial_sales_org_id ON public.commercial_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_medical_appointments_org_id ON public.medical_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_id ON public.financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_org_id ON public.financial_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_org_id ON public.financial_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_org_id ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_org_id ON public.inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_org_id ON public.inventory_batches(organization_id);
