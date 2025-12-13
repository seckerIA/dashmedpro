-- Drop ALL existing policies for these tables first
DROP POLICY IF EXISTS "BDR_PROSPECÇÃO authenticated access" ON public."BDR_PROSPECÇÃO";
DROP POLICY IF EXISTS "Users can only access their own BDR_PROSPECÇÃO" ON public."BDR_PROSPECÇÃO";
DROP POLICY IF EXISTS "LEADS authenticated access" ON public."LEADS";
DROP POLICY IF EXISTS "Users can only access their own LEADS" ON public."LEADS";
DROP POLICY IF EXISTS "sdr_leads_status authenticated access" ON public.sdr_leads_status;
DROP POLICY IF EXISTS "Users can only access their own sdr_leads_status" ON public.sdr_leads_status;

-- Check and add user_id column only to LEADS table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'LEADS' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public."LEADS" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and add user_id column only to sdr_leads_status table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sdr_leads_status' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.sdr_leads_status ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

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

CREATE POLICY "Users can only access their own sdr_leads_status" 
ON public.sdr_leads_status 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger functions to ensure user_id is set correctly on insert
CREATE OR REPLACE FUNCTION set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_set_user_id_bdr_prospeccao ON public."BDR_PROSPECÇÃO";
DROP TRIGGER IF EXISTS trigger_set_user_id_leads ON public."LEADS";
DROP TRIGGER IF EXISTS trigger_set_user_id_sdr_leads_status ON public.sdr_leads_status;

-- Create triggers to automatically set user_id on insert
CREATE TRIGGER trigger_set_user_id_bdr_prospeccao
  BEFORE INSERT ON public."BDR_PROSPECÇÃO"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_insert();

CREATE TRIGGER trigger_set_user_id_leads
  BEFORE INSERT ON public."LEADS"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_insert();

CREATE TRIGGER trigger_set_user_id_sdr_leads_status
  BEFORE INSERT ON public.sdr_leads_status
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_insert();