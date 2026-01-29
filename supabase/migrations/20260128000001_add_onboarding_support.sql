-- Migration: Add Onboarding Support
-- Description: Adds onboarding fields to profiles, creates onboarding_state table,
--              specialty_procedures table with seed data, and related indexes.

-- ============================================
-- 1. Add onboarding fields to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS specialty text;

-- ============================================
-- 2. Add fields to organizations table
-- ============================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS city text;

-- ============================================
-- 3. Create onboarding_state table (wizard progress persistence)
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_state (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step integer DEFAULT 1,
    clinic_data jsonb DEFAULT '{}'::jsonb,
    doctor_data jsonb DEFAULT '{}'::jsonb,
    procedures_data jsonb DEFAULT '[]'::jsonb,
    team_data jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT onboarding_state_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own onboarding state
CREATE POLICY "Users manage own onboarding state"
ON public.onboarding_state
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Create specialty_procedures table (procedure suggestions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.specialty_procedures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    specialty text NOT NULL,
    name text NOT NULL,
    category text NOT NULL DEFAULT 'procedure',
    default_price numeric(10,2) NOT NULL,
    default_duration_minutes integer DEFAULT 30,
    description text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT specialty_procedures_specialty_name_key UNIQUE (specialty, name)
);

-- Enable RLS
ALTER TABLE public.specialty_procedures ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read specialty procedures (public reference data)
CREATE POLICY "Anyone can read specialty procedures"
ON public.specialty_procedures
FOR SELECT
USING (true);

-- ============================================
-- 5. Seed specialty procedures
-- ============================================
INSERT INTO public.specialty_procedures (specialty, name, category, default_price, default_duration_minutes, description) VALUES
-- Dermatologia
('dermatologia', 'Consulta Dermatologica', 'consultation', 350.00, 30, 'Consulta de avaliacao dermatologica'),
('dermatologia', 'Botox', 'procedure', 1500.00, 45, 'Aplicacao de toxina botulinica'),
('dermatologia', 'Preenchimento Facial', 'procedure', 2000.00, 60, 'Preenchimento com acido hialuronico'),
('dermatologia', 'Peeling Quimico', 'procedure', 450.00, 30, 'Peeling para rejuvenescimento'),
('dermatologia', 'Limpeza de Pele', 'procedure', 180.00, 45, 'Limpeza facial profunda'),
('dermatologia', 'Microagulhamento', 'procedure', 600.00, 45, 'Tratamento para cicatrizes e rugas'),

-- Cardiologia
('cardiologia', 'Consulta Cardiologica', 'consultation', 400.00, 30, 'Consulta de avaliacao cardiologica'),
('cardiologia', 'Eletrocardiograma', 'exam', 150.00, 15, 'ECG de repouso'),
('cardiologia', 'Ecocardiograma', 'exam', 450.00, 45, 'Ultrassom do coracao'),
('cardiologia', 'Teste Ergometrico', 'exam', 350.00, 60, 'Teste de esforco'),
('cardiologia', 'Holter 24h', 'exam', 300.00, 30, 'Monitoramento cardiaco 24 horas'),

-- Ortopedia
('ortopedia', 'Consulta Ortopedica', 'consultation', 350.00, 30, 'Consulta de avaliacao ortopedica'),
('ortopedia', 'Infiltracao Articular', 'procedure', 500.00, 30, 'Infiltracao com corticoide'),
('ortopedia', 'Avaliacao Postural', 'exam', 200.00, 45, 'Avaliacao da postura'),

-- Ginecologia
('ginecologia', 'Consulta Ginecologica', 'consultation', 350.00, 30, 'Consulta de avaliacao ginecologica'),
('ginecologia', 'Papanicolaou', 'exam', 150.00, 20, 'Exame preventivo'),
('ginecologia', 'Ultrassom Transvaginal', 'exam', 250.00, 30, 'Ultrassonografia pelvica'),
('ginecologia', 'Colposcopia', 'exam', 300.00, 30, 'Exame do colo do utero'),

-- Pediatria
('pediatria', 'Consulta Pediatrica', 'consultation', 300.00, 30, 'Consulta de avaliacao pediatrica'),
('pediatria', 'Puericultura', 'consultation', 250.00, 45, 'Acompanhamento do desenvolvimento'),
('pediatria', 'Teste do Pezinho', 'exam', 100.00, 15, 'Triagem neonatal'),

-- Clinica Geral
('clinica_geral', 'Consulta Clinica', 'consultation', 250.00, 30, 'Consulta medica geral'),
('clinica_geral', 'Check-up Basico', 'exam', 400.00, 60, 'Avaliacao geral de saude'),
('clinica_geral', 'Retorno', 'consultation', 150.00, 20, 'Consulta de retorno'),

-- Estetica
('estetica', 'Avaliacao Estetica', 'consultation', 200.00, 30, 'Avaliacao para procedimentos esteticos'),
('estetica', 'Harmonizacao Facial', 'procedure', 3500.00, 90, 'Harmonizacao facial completa'),
('estetica', 'Bioestimulador', 'procedure', 2000.00, 45, 'Aplicacao de bioestimulador de colageno'),
('estetica', 'Skinbooster', 'procedure', 1200.00, 30, 'Hidratacao profunda da pele'),
('estetica', 'Fios de PDO', 'procedure', 1500.00, 60, 'Lifting com fios de sustentacao'),

-- Psiquiatria
('psiquiatria', 'Consulta Psiquiatrica', 'consultation', 500.00, 50, 'Consulta de avaliacao psiquiatrica'),
('psiquiatria', 'Retorno Psiquiatrico', 'consultation', 350.00, 30, 'Consulta de acompanhamento'),

-- Nutricao
('nutricao', 'Consulta Nutricional', 'consultation', 250.00, 45, 'Avaliacao nutricional completa'),
('nutricao', 'Bioimpedancia', 'exam', 100.00, 15, 'Analise de composicao corporal'),
('nutricao', 'Retorno Nutricional', 'consultation', 150.00, 30, 'Acompanhamento nutricional'),

-- Fisioterapia
('fisioterapia', 'Avaliacao Fisioterapeutica', 'consultation', 200.00, 45, 'Avaliacao funcional'),
('fisioterapia', 'Sessao de Fisioterapia', 'procedure', 120.00, 50, 'Sessao de tratamento'),
('fisioterapia', 'RPG', 'procedure', 180.00, 60, 'Reeducacao Postural Global'),

-- Oftalmologia
('oftalmologia', 'Consulta Oftalmologica', 'consultation', 300.00, 30, 'Consulta de avaliacao oftalmologica'),
('oftalmologia', 'Exame de Fundo de Olho', 'exam', 150.00, 20, 'Mapeamento de retina'),
('oftalmologia', 'Tonometria', 'exam', 80.00, 10, 'Medicao da pressao ocular'),

-- Odontologia
('odontologia', 'Consulta Odontologica', 'consultation', 200.00, 30, 'Consulta e avaliacao dentaria'),
('odontologia', 'Limpeza Dental', 'procedure', 150.00, 45, 'Profilaxia dental'),
('odontologia', 'Clareamento Dental', 'procedure', 800.00, 60, 'Clareamento a laser'),

-- Cirurgia Plastica
('cirurgia_plastica', 'Consulta Cirurgia Plastica', 'consultation', 400.00, 30, 'Consulta de avaliacao para cirurgia'),
('cirurgia_plastica', 'Avaliacao Pre-Operatoria', 'consultation', 300.00, 45, 'Avaliacao completa pre-cirurgica'),

-- Neurologia
('neurologia', 'Consulta Neurologica', 'consultation', 400.00, 30, 'Consulta de avaliacao neurologica'),
('neurologia', 'Eletroencefalograma', 'exam', 350.00, 45, 'EEG para avaliacao cerebral'),

-- Outras (generico)
('outras', 'Consulta', 'consultation', 300.00, 30, 'Consulta medica'),
('outras', 'Retorno', 'consultation', 150.00, 20, 'Consulta de retorno')
ON CONFLICT (specialty, name) DO NOTHING;

-- ============================================
-- 6. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_pending
ON public.profiles(onboarding_completed)
WHERE onboarding_completed = false;

CREATE INDEX IF NOT EXISTS idx_onboarding_state_user_id
ON public.onboarding_state(user_id);

CREATE INDEX IF NOT EXISTS idx_specialty_procedures_specialty
ON public.specialty_procedures(specialty);

-- ============================================
-- 7. Update existing profiles to have onboarding_completed = true
--    (So existing users don't get stuck in onboarding)
-- ============================================
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Set the default back to false for new users
ALTER TABLE public.profiles
ALTER COLUMN onboarding_completed SET DEFAULT false;

-- ============================================
-- 8. Grant permissions
-- ============================================
GRANT SELECT ON public.specialty_procedures TO authenticated;
GRANT ALL ON public.onboarding_state TO authenticated;
