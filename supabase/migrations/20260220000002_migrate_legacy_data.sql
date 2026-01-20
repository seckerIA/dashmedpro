-- Migration to move legacy data to default organization

DO $$
DECLARE
    default_org_id uuid;
BEGIN
    -- 1. Create Default Organization if not exists
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'clinica-padrao') THEN
        INSERT INTO public.organizations (name, slug, plan, status)
        VALUES ('Clínica Padrão', 'clinica-padrao', 'pro', 'active')
        RETURNING id INTO default_org_id;
    ELSE
        SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'clinica-padrao';
    END IF;

    -- 2. Migrate Users to Members (Idempotent insert)
    INSERT INTO public.organization_members (organization_id, user_id, role)
    SELECT default_org_id, id, role
    FROM public.profiles
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 3. Update all tables with default_org_id
    
    -- API & Users
    UPDATE public.profiles SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- CRM & Contacts
    UPDATE public.crm_contacts SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.crm_deals SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.commercial_leads SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.commercial_sales SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Medical
    UPDATE public.medical_appointments SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Financial
    UPDATE public.financial_transactions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.financial_categories SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.financial_accounts SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Inventory
    UPDATE public.inventory_items SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.inventory_transactions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.inventory_batches SET organization_id = default_org_id WHERE organization_id IS NULL;

    -- 4. Set Constraint NOT NULL (Optional, but good for enforcement)
    -- We will do this in a separate step or leave as nullable for now to avoid locking issues if tables are huge.
    -- Decision: Leave NULLABLE for now in this script.
    
END $$;
