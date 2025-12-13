-- Enable RLS on existing tables that don't have it
ALTER TABLE public."BDR_PROSPECÇÃO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for existing tables
CREATE POLICY "Authenticated users can view BDR" ON public."BDR_PROSPECÇÃO"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage BDR" ON public."BDR_PROSPECÇÃO"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view contacts_old" ON public.contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage contacts_old" ON public.contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage messages" ON public.messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix handle_new_user function search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;