-- ================================================
-- ADICIONAR CAMPO DE COMPLICAÇÕES AOS PRONTUÁRIOS
-- ================================================

-- Adicionar coluna complications para registrar intercorrências e eventos adversos
ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS complications TEXT;

-- Comentário descritivo
COMMENT ON COLUMN public.medical_records.complications IS 'Registro de complicações, intercorrências ou eventos adversos ocorridos durante o atendimento';
