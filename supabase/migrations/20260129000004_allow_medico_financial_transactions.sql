-- Permitir médicos gerirem transações próprias. Ramo organização só se colunas/tabelas existirem.

DROP POLICY IF EXISTS "financial_transactions_select_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON public.financial_transactions;

DO $$
DECLARE
  v_org_rls boolean;
BEGIN
  v_org_rls := to_regclass('public.organization_members') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'financial_transactions' AND column_name = 'organization_id'
    );

  IF v_org_rls THEN
    EXECUTE $p$
CREATE POLICY "financial_transactions_select_policy" ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = financial_transactions.organization_id
  )
)$p$;
  ELSE
    EXECUTE $p$
CREATE POLICY "financial_transactions_select_policy" ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)$p$;
  END IF;
END $$;

CREATE POLICY "financial_transactions_insert_policy" ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "financial_transactions_update_policy" ON public.financial_transactions
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "financial_transactions_delete_policy" ON public.financial_transactions
FOR DELETE
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "financial_accounts_select_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_insert_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_update_policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "financial_accounts_delete_policy" ON public.financial_accounts;

DO $$
DECLARE
  v_org_rls boolean;
BEGIN
  v_org_rls := to_regclass('public.organization_members') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'financial_accounts' AND column_name = 'organization_id'
    );

  IF v_org_rls THEN
    EXECUTE $p$
CREATE POLICY "financial_accounts_select_policy" ON public.financial_accounts
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = financial_accounts.organization_id
  )
)$p$;
  ELSE
    EXECUTE $p$
CREATE POLICY "financial_accounts_select_policy" ON public.financial_accounts
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)$p$;
  END IF;
END $$;

CREATE POLICY "financial_accounts_insert_policy" ON public.financial_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "financial_accounts_update_policy" ON public.financial_accounts
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "financial_accounts_delete_policy" ON public.financial_accounts
FOR DELETE
TO authenticated
USING (
  public.is_admin_or_dono(auth.uid())
  OR user_id = auth.uid()
);
