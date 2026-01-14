-- Habilitar RLS na tabela (garantia)
ALTER TABLE IF EXISTS public.financial_categories ENABLE ROW LEVEL SECURITY;

-- 1. Política de Leitura (SELECT): Permitir que usuários autenticados vejam todas as categorias
DROP POLICY IF EXISTS "Authenticated users can select categories" ON public.financial_categories;
CREATE POLICY "Authenticated users can select categories"
ON public.financial_categories FOR SELECT
TO authenticated
USING (true);

-- 2. Política de Criação (INSERT): Permitir que usuários autenticados criem novas categorias
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.financial_categories;
CREATE POLICY "Authenticated users can insert categories"
ON public.financial_categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Política de Edição (UPDATE): Permitir que usuários autenticados editem categorias
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.financial_categories;
CREATE POLICY "Authenticated users can update categories"
ON public.financial_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Política de Exclusão (DELETE): Permitir excluir apenas categorias que NÃO são do sistema
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.financial_categories;
CREATE POLICY "Authenticated users can delete categories"
ON public.financial_categories FOR DELETE
TO authenticated
USING (is_system = false);
