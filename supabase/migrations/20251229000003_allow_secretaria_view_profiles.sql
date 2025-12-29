-- =====================================================
-- Migration: Permitir secretária ver todos os perfis
-- =====================================================
--
-- Problema: A secretária só consegue ver seu próprio perfil devido às políticas RLS.
-- Isso impede que ela:
--   1. Veja a lista de médicos no dropdown de nova consulta
--   2. Veja a lista de médicos no dropdown de novo procedimento
--   3. Veja o nome do médico nos cards de consultas
--   4. Veja o nome do médico nos cards de procedimentos
--
-- Solução: Criar função SECURITY DEFINER para verificar se é secretária
--          e usar essa função na política RLS (evita recursão infinita)

-- 1. Criar função para verificar se é secretária (com SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.is_secretaria(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = _user_id
        AND role = 'secretaria'
        AND is_active = true
    );
$$;

-- 2. Política para secretária ver todos os perfis
DROP POLICY IF EXISTS "Secretaria can view all profiles" ON public.profiles;
CREATE POLICY "Secretaria can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_secretaria(auth.uid()));
