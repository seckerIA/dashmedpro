-- Migration: Add Nutrologia and Endocrinologia specialties
-- Description: Adds procedures for new medical specialties and updates nutricao -> nutrologia

-- ============================================
-- 1. Update existing nutricao to nutrologia
-- ============================================
UPDATE public.specialty_procedures
SET specialty = 'nutrologia'
WHERE specialty = 'nutricao';

-- ============================================
-- 2. Add Nutrologia procedures (if not migrated)
-- ============================================
INSERT INTO public.specialty_procedures (specialty, name, category, default_price, default_duration_minutes, description) VALUES
('nutrologia', 'Consulta Nutrologica', 'consultation', 400.00, 45, 'Consulta de avaliacao nutrologica'),
('nutrologia', 'Avaliacao de Composicao Corporal', 'exam', 200.00, 30, 'Bioimpedancia e analise corporal'),
('nutrologia', 'Prescricao de Suplementacao', 'procedure', 300.00, 30, 'Avaliacao e prescricao de suplementos'),
('nutrologia', 'Acompanhamento Nutrologico', 'consultation', 250.00, 30, 'Retorno e acompanhamento')
ON CONFLICT (specialty, name) DO NOTHING;

-- ============================================
-- 3. Add Endocrinologia procedures
-- ============================================
INSERT INTO public.specialty_procedures (specialty, name, category, default_price, default_duration_minutes, description) VALUES
('endocrinologia', 'Consulta Endocrinologica', 'consultation', 400.00, 40, 'Consulta de avaliacao endocrinologica'),
('endocrinologia', 'Avaliacao Tireoidiana', 'exam', 200.00, 30, 'Avaliacao da funcao tireoidiana'),
('endocrinologia', 'Controle de Diabetes', 'consultation', 300.00, 30, 'Acompanhamento e ajuste de tratamento'),
('endocrinologia', 'Avaliacao Metabolica', 'exam', 350.00, 45, 'Avaliacao do metabolismo e hormonal'),
('endocrinologia', 'Retorno Endocrinologico', 'consultation', 250.00, 20, 'Consulta de acompanhamento')
ON CONFLICT (specialty, name) DO NOTHING;
