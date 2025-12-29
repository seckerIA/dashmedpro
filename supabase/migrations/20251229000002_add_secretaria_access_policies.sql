-- =====================================================
-- Migration: Adicionar acesso de secretária a procedimentos e permitir joins
-- =====================================================

-- 1. Política para secretária ver TODOS os procedimentos comerciais
DROP POLICY IF EXISTS "Secretaria can view all procedures" ON public.commercial_procedures;
CREATE POLICY "Secretaria can view all procedures"
  ON public.commercial_procedures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaria', 'admin', 'dono')
      AND is_active = true
    )
  );

-- 2. Política para secretária inserir procedimentos para qualquer médico
DROP POLICY IF EXISTS "Secretaria can insert procedures for doctors" ON public.commercial_procedures;
CREATE POLICY "Secretaria can insert procedures for doctors"
  ON public.commercial_procedures FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Pode inserir se for o próprio usuário OU se for secretária/admin/dono
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaria', 'admin', 'dono')
      AND is_active = true
    )
  );

-- 3. Política para secretária atualizar procedimentos
DROP POLICY IF EXISTS "Secretaria can update all procedures" ON public.commercial_procedures;
CREATE POLICY "Secretaria can update all procedures"
  ON public.commercial_procedures FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaria', 'admin', 'dono')
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaria', 'admin', 'dono')
      AND is_active = true
    )
  );

-- 4. Política para secretária deletar procedimentos
DROP POLICY IF EXISTS "Secretaria can delete procedures" ON public.commercial_procedures;
CREATE POLICY "Secretaria can delete procedures"
  ON public.commercial_procedures FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
      AND is_active = true
    )
  );
