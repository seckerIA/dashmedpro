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

-- Follow-up (coluna organization_id já existe em 20260201000002; FK só após public.organizations)
DO $$
BEGIN
  IF to_regclass('public.followup_templates') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'followup_templates' AND c.conname = 'followup_templates_organization_id_fkey'
     ) THEN
    ALTER TABLE public.followup_templates
      ADD CONSTRAINT followup_templates_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.followup_scheduled') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'followup_scheduled' AND c.conname = 'followup_scheduled_organization_id_fkey'
     ) THEN
    ALTER TABLE public.followup_scheduled
      ADD CONSTRAINT followup_scheduled_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.followup_metrics') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'followup_metrics' AND c.conname = 'followup_metrics_organization_id_fkey'
     ) THEN
    ALTER TABLE public.followup_metrics
      ADD CONSTRAINT followup_metrics_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.financial_categories') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'financial_categories' AND c.conname = 'financial_categories_organization_id_fkey'
     ) THEN
    ALTER TABLE public.financial_categories
      ADD CONSTRAINT financial_categories_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.inventory_transaction_items') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'inventory_transaction_items' AND c.conname = 'inventory_transaction_items_organization_id_fkey'
     ) THEN
    ALTER TABLE public.inventory_transaction_items
      ADD CONSTRAINT inventory_transaction_items_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;

  IF to_regclass('public.instagram_config') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'instagram_config' AND c.conname = 'instagram_config_organization_id_fkey'
     ) THEN
    ALTER TABLE public.instagram_config
      ADD CONSTRAINT instagram_config_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;

  IF to_regclass('public.messenger_config') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'messenger_config' AND c.conname = 'messenger_config_organization_id_fkey'
     ) THEN
    ALTER TABLE public.messenger_config
      ADD CONSTRAINT messenger_config_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;

  IF to_regclass('public.instagram_conversations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'instagram_conversations' AND c.conname = 'instagram_conversations_organization_id_fkey'
     ) THEN
    ALTER TABLE public.instagram_conversations
      ADD CONSTRAINT instagram_conversations_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;

  IF to_regclass('public.messenger_conversations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'messenger_conversations' AND c.conname = 'messenger_conversations_organization_id_fkey'
     ) THEN
    ALTER TABLE public.messenger_conversations
      ADD CONSTRAINT messenger_conversations_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;

  IF to_regclass('public.lead_form_submissions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'lead_form_submissions' AND c.conname = 'lead_form_submissions_organization_id_fkey'
     ) THEN
    ALTER TABLE public.lead_form_submissions
      ADD CONSTRAINT lead_form_submissions_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;
