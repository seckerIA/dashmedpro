-- ==============================================================================
-- FIX: Garantir permissões de leitura para secretárias em procedimentos e vínculos
-- Data: 02/02/2025
-- ==============================================================================

-- 1. Garantir RLS na tabela de procedimentos para secretárias
DROP POLICY IF EXISTS "Secretaria can view all procedures" ON public.commercial_procedures;

CREATE POLICY "Secretaria can view all procedures"
  ON public.commercial_procedures FOR SELECT
  TO authenticated
  USING (
    -- Permite visualização se o usuário for secretaria, admin ou dono
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaria', 'admin', 'dono')
    )
  );

-- 2. Garantir RLS na tabela de vínculos (caso não exista ou esteja quebrada)
DROP POLICY IF EXISTS "Secretaries can view linked doctors data" ON public.secretary_doctor_links;

CREATE POLICY "Secretaries can view linked doctors data"
  ON public.secretary_doctor_links FOR SELECT
  TO authenticated
  USING (
    -- Secretaria pode ver seus próprios vínculos
    secretary_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'secretaria'
    )
  );

-- 3. Garantir que a tabela profiles seja legível (geralmente 'Public profiles are viewable by everyone' já existe)
-- Se não, criar uma política básica de leitura para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can view profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
