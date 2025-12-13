-- Add user_id columns to tables that don't have proper ownership
ALTER TABLE public."BDR_PROSPECÇÃO" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."LEADS" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set default values for user_id on inserts
ALTER TABLE public."BDR_PROSPECÇÃO" ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public."LEADS" ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop existing permissive RLS policies
DROP POLICY IF EXISTS "BDR_PROSPECÇÃO authenticated access" ON public."BDR_PROSPECÇÃO";
DROP POLICY IF EXISTS "LEADS authenticated access" ON public."LEADS";
DROP POLICY IF EXISTS "sdr_leads_status authenticated access" ON public.sdr_leads_status;

-- Create secure RLS policies that restrict access to user's own data
CREATE POLICY "Users can only access their own BDR_PROSPECÇÃO" 
ON public."BDR_PROSPECÇÃO" 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own LEADS" 
ON public."LEADS" 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For sdr_leads_status, we'll use a more complex policy since it doesn't have user_id
-- We'll need to add user_id column here too for consistency
ALTER TABLE public.sdr_leads_status ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sdr_leads_status ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE POLICY "Users can only access their own sdr_leads_status" 
ON public.sdr_leads_status 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger functions to ensure user_id is set correctly on insert
CREATE OR REPLACE FUNCTION set_user_id_on_bdr_prospeccao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_id_on_leads()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_id_on_sdr_leads_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id on insert
CREATE TRIGGER trigger_set_user_id_bdr_prospeccao
  BEFORE INSERT ON public."BDR_PROSPECÇÃO"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_bdr_prospeccao();

CREATE TRIGGER trigger_set_user_id_leads
  BEFORE INSERT ON public."LEADS"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_leads();

CREATE TRIGGER trigger_set_user_id_sdr_leads_status
  BEFORE INSERT ON public.sdr_leads_status
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_sdr_leads_status();