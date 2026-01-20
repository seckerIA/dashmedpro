-- Optimize CRM Deals
DROP POLICY IF EXISTS "Admin and Dono can view all crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Secretary can view linked doctor deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can delete their own deals or admin/dono can delete any" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update their own deals or assigned deals" ON public.crm_deals;

CREATE POLICY "Users can view deals in their organization"
ON public.crm_deals FOR SELECT
USING ( organization_id = ANY(public.get_user_org_ids()) );

CREATE POLICY "Users can manage deals in their organization"
ON public.crm_deals FOR ALL
USING ( organization_id = ANY(public.get_user_org_ids()) );


-- Optimize Financial Accounts
DROP POLICY IF EXISTS "financial_accounts_select_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON public.financial_accounts;

CREATE POLICY "Users can view accounts in their organization"
ON public.financial_accounts FOR SELECT
USING ( organization_id = ANY(public.get_user_org_ids()) );

CREATE POLICY "Users can manage accounts in their organization"
ON public.financial_accounts FOR ALL
USING ( organization_id = ANY(public.get_user_org_ids()) );


-- Optimize Secretary Doctor Links (Remove legacy checks)
DROP POLICY IF EXISTS "Admins can manage all links" ON public.secretary_doctor_links;
DROP POLICY IF EXISTS "Doctors can manage links" ON public.secretary_doctor_links;
DROP POLICY IF EXISTS "Doctors can manage own links" ON public.secretary_doctor_links;
DROP POLICY IF EXISTS "Secretaries can view own links" ON public.secretary_doctor_links;
DROP POLICY IF EXISTS "Users can view their own links" ON public.secretary_doctor_links;

CREATE POLICY "Users can view their own links"
ON public.secretary_doctor_links FOR SELECT
USING ( auth.uid() = secretary_id OR auth.uid() = doctor_id );
