-- =====================================================
-- Migration: Preencher doctor_id nas consultas existentes
-- =====================================================
--
-- Problema: Consultas antigas podem não ter doctor_id preenchido,
-- apenas user_id. Isso faz com que o join não retorne dados do médico.
--
-- Solução: Copiar user_id para doctor_id onde doctor_id é NULL

-- Atualizar doctor_id com user_id onde doctor_id está NULL
UPDATE public.medical_appointments
SET doctor_id = user_id
WHERE doctor_id IS NULL AND user_id IS NOT NULL;
