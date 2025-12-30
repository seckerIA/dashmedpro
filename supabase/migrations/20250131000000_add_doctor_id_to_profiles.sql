-- =====================================================
-- Migration: Add doctor_id to profiles for secretaria-medico linkage
-- =====================================================
-- Descrição: Adiciona campo doctor_id em profiles para vincular secretária a um médico
-- Data: 2025-01-31

-- 1. Adicionar coluna doctor_id em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_doctor_id ON public.profiles(doctor_id);

-- 3. Adicionar comentário para documentação
COMMENT ON COLUMN public.profiles.doctor_id IS 'ID do médico vinculado à secretária. Apenas para perfis com role = secretaria. Permite que a secretária veja apenas dados do médico vinculado.';

-- 4. Criar função helper para verificar se secretária está vinculada a médico
CREATE OR REPLACE FUNCTION public.is_secretaria_linked_to_doctor(_secretaria_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _secretaria_id
      AND role = 'secretaria'
      AND doctor_id IS NOT NULL
      AND is_active = true
  )
$$;

-- 5. Criar função helper para obter doctor_id de uma secretária
CREATE OR REPLACE FUNCTION public.get_secretaria_doctor_id(_secretaria_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT doctor_id FROM public.profiles
  WHERE id = _secretaria_id
    AND role = 'secretaria'
    AND is_active = true
  LIMIT 1
$$;

-- 6. Adicionar constraint: apenas secretárias podem ter doctor_id
-- (outros roles devem ter doctor_id = NULL)
-- Nota: Secretárias podem ter doctor_id NULL (não vinculadas) ou NOT NULL (vinculadas)
-- Outros roles sempre devem ter doctor_id = NULL
ALTER TABLE public.profiles
ADD CONSTRAINT check_secretaria_doctor_id 
CHECK (
  role = 'secretaria' OR doctor_id IS NULL
);

