-- Habilitar RLS só em objetos herdados da stack Lovable (podem estar ausentes no DashMed schema-only)
DO $$
BEGIN
  IF to_regclass('public."BDR_PROSPECÇÃO"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."BDR_PROSPECÇÃO" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view BDR" ON public."BDR_PROSPECÇÃO"';
    EXECUTE 'CREATE POLICY "Authenticated users can view BDR" ON public."BDR_PROSPECÇÃO" FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage BDR" ON public."BDR_PROSPECÇÃO"';
    EXECUTE 'CREATE POLICY "Authenticated users can manage BDR" ON public."BDR_PROSPECÇÃO" FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  IF to_regclass('public.contacts') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view contacts_old" ON public.contacts';
    EXECUTE 'CREATE POLICY "Authenticated users can view contacts_old" ON public.contacts FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage contacts_old" ON public.contacts';
    EXECUTE 'CREATE POLICY "Authenticated users can manage contacts_old" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages';
    EXECUTE 'CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage messages" ON public.messages';
    EXECUTE 'CREATE POLICY "Authenticated users can manage messages" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

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
