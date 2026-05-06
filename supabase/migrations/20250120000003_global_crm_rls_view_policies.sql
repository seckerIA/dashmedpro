-- Consolida o intent de:
--   20250107000001_update_crm_rls_policies.sql (deals/actividades globais ao ler)
--   20250110000001_allow_admin_dono_edit_deals.sql (UPDATE com is_admin_or_dono)
--   20250110000002_cleanup_duplicate_crm_deals_policies.sql (drops legados / comentários)
-- Corre APÓS 20250120000000_complete_database_schema.sql onde crm_* passa a existir.

-- ---------- crm_deals ----------
DROP POLICY IF EXISTS "Users can update their deals or all if admin/dono with toggle" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view their deals or all if admin/dono with toggle" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view their own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update their own deals or assigned deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view all deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can delete their deals" ON public.crm_deals;

CREATE POLICY "Users can view all deals"
  ON public.crm_deals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert deals"
  ON public.crm_deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update deals"
  ON public.crm_deals FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
    OR public.is_admin_or_dono(auth.uid())
  );

CREATE POLICY "Users can delete their deals"
  ON public.crm_deals FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert deals" ON public.crm_deals IS
  'Permite que usuários criem novos deals. O user_id é automaticamente definido como o criador.';

COMMENT ON POLICY "Users can delete their deals" ON public.crm_deals IS
  'Permite que usuários deletem apenas seus próprios deals (não pode deletar deals de outros, mesmo Admin/Dono).';

COMMENT ON POLICY "Users can view all deals" ON public.crm_deals IS
  'Permite que todos os usuários visualizem todos os deals (pipeline global).';

COMMENT ON POLICY "Users can update deals" ON public.crm_deals IS
  'Permite que usuários editem seus próprios deals, deals atribuídos a eles, ou se forem Admin/Dono, qualquer deal. O owner original permanece inalterado.';

-- ---------- crm_activities (SELECT global) ----------
DROP POLICY IF EXISTS "Users can view their own activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can view all activities" ON public.crm_activities;

CREATE POLICY "Users can view all activities"
  ON public.crm_activities FOR SELECT
  USING (true);

COMMENT ON POLICY "Users can view all activities" ON public.crm_activities IS
  'Permite que todos os usuários visualizem todas as atividades do CRM';

-- tasks: SELECT global já definido na complete_database_schema (“Authenticated users can view tasks”) — sem alteração.
