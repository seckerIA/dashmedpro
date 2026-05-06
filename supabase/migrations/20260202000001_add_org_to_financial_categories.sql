-- Coluna organization_id (sem FK até existir public.organizations em 20260220000000/0001).
-- Políticas por organização dependem de profiles.organization_id; ficam em migrações posteriores.

ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_financial_categories_org_id
  ON public.financial_categories(organization_id);
