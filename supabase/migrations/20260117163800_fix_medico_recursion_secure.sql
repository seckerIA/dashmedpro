DROP POLICY IF EXISTS "Medico can view invited users" ON profiles;
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Função segura para retornar role do usuário ignorando RLS
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated, service_role;

-- Recriar política usando a função segura
CREATE POLICY "Medico can view invited users" ON profiles
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'medico' AND invited_by = auth.uid()
    );
