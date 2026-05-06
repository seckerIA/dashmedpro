-- Corrige "infinite recursion detected in policy for relation secretary_doctor_links".
-- Ciclo típico: políticas em crm_deals/commercial_leads/profiles fazem subselect em
-- secretary_doctor_links enquanto policies em secretary_doctor_links consultam profiles.
-- Helpers SECURITY DEFINER + row_security off leem vínculos sem reentrarem nas policies da tabela.

CREATE OR REPLACE FUNCTION public.secretary_has_active_link_to_doctor(p_secretary uuid, p_doctor uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF p_secretary IS NULL OR p_doctor IS NULL THEN
    RETURN false;
  END IF;
  PERFORM set_config('row_security', 'off', true);
  RETURN EXISTS (
    SELECT 1
    FROM public.secretary_doctor_links s
    WHERE s.secretary_id = p_secretary
      AND s.doctor_id = p_doctor
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.secretary_linked_doctor_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN COALESCE(
    ARRAY(
      SELECT doctor_id
      FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()
    ),
    ARRAY[]::uuid[]
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.secretary_has_active_link_to_doctor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secretary_linked_doctor_ids() TO authenticated;

-- Remove todas as policies da tabela (nom.es antigas / migrações parciais)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'secretary_doctor_links'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.secretary_doctor_links', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.secretary_doctor_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sdl_select_participant_or_org"
ON public.secretary_doctor_links
FOR SELECT
TO authenticated
USING (
  auth.uid() = secretary_id
  OR auth.uid() = doctor_id
  OR public.is_admin_or_dono(auth.uid())
);

CREATE POLICY "sdl_insert_doctor_or_admin"
ON public.secretary_doctor_links
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id
  OR public.get_user_role(auth.uid()) IN ('admin', 'dono')
);

CREATE POLICY "sdl_update_participants_or_admin"
ON public.secretary_doctor_links
FOR UPDATE
TO authenticated
USING (
  auth.uid() = secretary_id
  OR auth.uid() = doctor_id
  OR public.get_user_role(auth.uid()) IN ('admin', 'dono')
)
WITH CHECK (
  auth.uid() = secretary_id
  OR auth.uid() = doctor_id
  OR public.get_user_role(auth.uid()) IN ('admin', 'dono')
);

CREATE POLICY "sdl_delete_participant_or_admin"
ON public.secretary_doctor_links
FOR DELETE
TO authenticated
USING (
  auth.uid() = secretary_id
  OR auth.uid() = doctor_id
  OR public.get_user_role(auth.uid()) IN ('admin', 'dono')
);

-- Legado: EXISTS direto em secretary_doctor_links dentro do RLS de outras tabelas
DROP POLICY IF EXISTS "Secretary can view linked doctor deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Secretary can view linked doctor deals via helper" ON public.crm_deals;

CREATE POLICY "Secretary can view linked doctor deals via helper"
ON public.crm_deals
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'secretaria'
  AND (
    public.secretary_has_active_link_to_doctor(auth.uid(), crm_deals.user_id)
    OR public.secretary_has_active_link_to_doctor(auth.uid(), crm_deals.assigned_to)
  )
);

DROP POLICY IF EXISTS "Secretary can view linked doctor commercial leads" ON public.commercial_leads;
DROP POLICY IF EXISTS "Secretary can view linked doctor commercial leads via helper" ON public.commercial_leads;

CREATE POLICY "Secretary can view linked doctor commercial leads via helper"
ON public.commercial_leads
FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'secretaria'
  AND public.secretary_has_active_link_to_doctor(auth.uid(), commercial_leads.user_id)
);
