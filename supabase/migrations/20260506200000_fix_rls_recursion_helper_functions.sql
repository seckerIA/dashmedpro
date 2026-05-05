-- Evita recursão infinita em RLS (secretary_doctor_links ↔ profiles via get_user_org_ids / get_user_role)
-- Helpers rodam com row_security off apenas dentro do corpo da função (local à transação).

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_ids uuid[];
  v_role text;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();

  IF v_role = 'admin' THEN
    SELECT array_agg(id) INTO v_org_ids FROM public.organizations;
    IF v_org_ids IS NULL THEN
      RETURN ARRAY[]::uuid[];
    END IF;
    RETURN v_org_ids;
  END IF;

  SELECT array_agg(organization_id)
  INTO v_org_ids
  FROM public.organization_members
  WHERE user_id = auth.uid();

  IF v_org_ids IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;

  RETURN v_org_ids;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN (
    SELECT role::text FROM public.profiles WHERE id = target_user_id LIMIT 1
  );
END;
$function$;
