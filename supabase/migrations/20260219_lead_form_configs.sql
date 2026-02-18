-- =====================================================
-- Meta Lead Forms — Formulários descobertos via Graph API
-- Armazena formulários de captação por página Facebook
-- =====================================================

CREATE TABLE IF NOT EXISTS meta_lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identificadores Meta
  meta_form_id TEXT NOT NULL,
  form_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,

  -- Status
  status TEXT DEFAULT 'active',
  leads_count INTEGER DEFAULT 0,

  -- Configuração dos campos (perguntas do formulário)
  questions JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_meta_lead_form UNIQUE (user_id, meta_form_id)
);

-- RLS
ALTER TABLE meta_lead_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead forms"
  ON meta_lead_forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to lead forms"
  ON meta_lead_forms FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_user ON meta_lead_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_page ON meta_lead_forms(page_id);

-- Trigger updated_at
CREATE TRIGGER update_meta_lead_forms_updated_at
  BEFORE UPDATE ON meta_lead_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
