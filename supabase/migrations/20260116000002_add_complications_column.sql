-- =====================================================
-- MIGRATION: Adicionar coluna 'complications' em medical_records
-- Objetivo: Corrigir erro ao salvar prontuário onde o código espera esta coluna
-- Data: 2026-01-16
-- =====================================================

ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS complications TEXT;

COMMENT ON COLUMN public.medical_records.complications IS 'Registro de complicações durante o procedimento ou consulta';
