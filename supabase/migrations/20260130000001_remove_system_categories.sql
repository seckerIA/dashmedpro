-- Remove todas as categorias financeiras pré-definidas/sistema
-- Os clientes devem criar suas próprias categorias conforme necessário

-- 1. Deletar todas as categorias marcadas como sistema
DELETE FROM public.financial_categories WHERE is_system = true;

-- 2. Atualizar a política RLS para permitir que qualquer usuário autenticado
--    veja TODAS as categorias (não apenas as de sistema)
DROP POLICY IF EXISTS "financial_categories_select_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_select_policy" ON public.financial_categories
FOR SELECT
TO authenticated
USING (true); -- Todos os usuários veem todas as categorias

-- 3. Garantir que usuários possam criar categorias (apenas não-sistema)
DROP POLICY IF EXISTS "financial_categories_insert_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_insert_policy" ON public.financial_categories
FOR INSERT
TO authenticated
WITH CHECK (is_system = false OR is_system IS NULL);

-- 4. Garantir que usuários possam editar apenas categorias não-sistema
DROP POLICY IF EXISTS "financial_categories_update_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_update_policy" ON public.financial_categories
FOR UPDATE
TO authenticated
USING (is_system = false OR is_system IS NULL)
WITH CHECK (is_system = false OR is_system IS NULL);

-- 5. Garantir que usuários possam deletar apenas categorias não-sistema
DROP POLICY IF EXISTS "financial_categories_delete_policy" ON public.financial_categories;
CREATE POLICY "financial_categories_delete_policy" ON public.financial_categories
FOR DELETE
TO authenticated
USING (is_system = false OR is_system IS NULL);

-- Comentário de documentação
COMMENT ON COLUMN public.financial_categories.is_system IS
  'DEPRECATED: Categorias de sistema foram removidas. Clientes devem criar suas próprias categorias.';
