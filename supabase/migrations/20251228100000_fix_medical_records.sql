-- Migration: Corrigir e completar tabelas de prontuários médicos
-- Data: 2024-12-28

-- =====================================================
-- ADICIONAR COLUNAS FALTANTES em medical_records
-- =====================================================

-- Diagnóstico
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS cid_codes TEXT[];
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS secondary_diagnoses TEXT[];

-- Anamnese
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS history_current_illness TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS past_medical_history TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS family_history TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS social_history TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS allergies_noted TEXT[];

-- Exame Físico
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS vital_signs JSONB;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS general_condition TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS physical_exam_notes TEXT;

-- Diagnóstico
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS diagnostic_hypothesis TEXT;

-- Conduta
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS patient_instructions TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS next_appointment_date DATE;

-- Prescrições e Exames
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS prescriptions JSONB;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS exams_requested JSONB;

-- Metadados
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS record_type VARCHAR(50) DEFAULT 'consultation';
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- =====================================================
-- ÍNDICES (com IF NOT EXISTS)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_medical_records_contact ON medical_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_cid ON medical_records USING GIN(cid_codes);

-- =====================================================
-- TRIGGER: Atualizar updated_at (CREATE OR REPLACE)
-- =====================================================

CREATE OR REPLACE FUNCTION update_medical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop e recria trigger para evitar duplicação
DROP TRIGGER IF EXISTS trigger_medical_records_updated_at ON medical_records;
CREATE TRIGGER trigger_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_records_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Drop e recria policies
-- =====================================================

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;

-- Recria policies
CREATE POLICY "medical_records_select_policy" ON medical_records
  FOR SELECT USING (
    doctor_id = auth.uid()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

CREATE POLICY "medical_records_insert_policy" ON medical_records
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      doctor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'dono', 'medico')
      )
    )
  );

CREATE POLICY "medical_records_update_policy" ON medical_records
  FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

CREATE POLICY "medical_records_delete_policy" ON medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

-- =====================================================
-- TABELA: prescriptions (Receitas separadas para impressão)
-- =====================================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),

  -- Dados da receita
  medications JSONB NOT NULL,

  notes TEXT,
  prescription_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,

  -- Tipo de receita
  prescription_type VARCHAR(30) DEFAULT 'simple',

  -- Status
  is_printed BOOLEAN DEFAULT FALSE,
  printed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_record ON prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_contact ON prescriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date DESC);

-- RLS para prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescriptions_select_policy" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert_policy" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_update_policy" ON prescriptions;

CREATE POLICY "prescriptions_select_policy" ON prescriptions
  FOR SELECT USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

CREATE POLICY "prescriptions_insert_policy" ON prescriptions
  FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "prescriptions_update_policy" ON prescriptions
  FOR UPDATE USING (doctor_id = auth.uid());

-- =====================================================
-- CAMPOS ADICIONAIS EM crm_contacts (ficha do paciente)
-- =====================================================

ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS current_medications TEXT[];
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE medical_records IS 'Prontuários médicos dos pacientes';
COMMENT ON TABLE prescriptions IS 'Receitas médicas para impressão';
COMMENT ON COLUMN medical_records.vital_signs IS 'JSON: { bp_systolic, bp_diastolic, heart_rate, respiratory_rate, temperature, spo2, weight, height, bmi }';
COMMENT ON COLUMN medical_records.prescriptions IS 'JSON array: [{ medication, dosage, frequency, duration, instructions }]';
COMMENT ON COLUMN prescriptions.medications IS 'JSON array: [{ name, dosage, frequency, duration, quantity, instructions }]';
