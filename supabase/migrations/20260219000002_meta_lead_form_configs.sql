-- Meta Lead Forms (versão ordenada — substitui o prefixo ambíguo 20260219.)

CREATE TABLE IF NOT EXISTS public.meta_lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  meta_form_id TEXT NOT NULL,
  form_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,

  status TEXT DEFAULT 'active',
  leads_count INTEGER DEFAULT 0,

  questions JSONB DEFAULT '[]'::jsonb,

  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_meta_lead_form UNIQUE (user_id, meta_form_id)
);

ALTER TABLE public.meta_lead_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lead forms" ON public.meta_lead_forms;
CREATE POLICY "Users can view own lead forms"
  ON public.meta_lead_forms FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to lead forms" ON public.meta_lead_forms;
CREATE POLICY "Service role full access to lead forms"
  ON public.meta_lead_forms FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_user ON public.meta_lead_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_page ON public.meta_lead_forms(page_id);

DROP TRIGGER IF EXISTS update_meta_lead_forms_updated_at ON public.meta_lead_forms;
CREATE TRIGGER update_meta_lead_forms_updated_at
  BEFORE UPDATE ON public.meta_lead_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
