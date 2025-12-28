-- Migration: Criar tabela de prontuários médicos
-- Data: 2024-12-28

-- =====================================================
-- TABELA: medical_records (Prontuários Médicos)
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES medical_appointments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- Quem criou o registro

  -- Anamnese
  chief_complaint TEXT,                    -- Queixa principal
  history_current_illness TEXT,            -- História da doença atual (HDA)
  past_medical_history TEXT,               -- História patológica pregressa
  family_history TEXT,                     -- História familiar
  social_history TEXT,                     -- Hábitos de vida (tabagismo, etilismo, etc.)
  allergies_noted TEXT[],                  -- Alergias identificadas nesta consulta

  -- Exame Físico
  vital_signs JSONB,                       -- Sinais vitais (PA, FC, FR, Temp, SpO2, Peso, Altura)
  general_condition TEXT,                  -- Estado geral
  physical_exam_notes TEXT,                -- Exame físico detalhado por sistemas

  -- Diagnóstico
  diagnostic_hypothesis TEXT,              -- Hipótese diagnóstica
  cid_codes TEXT[],                        -- Códigos CID-10 (array)
  secondary_diagnoses TEXT[],              -- Diagnósticos secundários

  -- Conduta
  treatment_plan TEXT,                     -- Plano terapêutico
  patient_instructions TEXT,               -- Orientações ao paciente
  follow_up_notes TEXT,                    -- Notas de retorno/acompanhamento
  next_appointment_date DATE,              -- Data do próximo retorno

  -- Prescrições
  prescriptions JSONB,                     -- Array de medicamentos prescritos
  -- Estrutura esperada: [{ medication, dosage, frequency, duration, instructions }]

  -- Exames
  exams_requested JSONB,                   -- Exames solicitados
  -- Estrutura esperada: [{ exam_name, urgency, notes }]

  -- Metadados
  record_type VARCHAR(50) DEFAULT 'consultation',  -- consultation, return, procedure, exam, emergency
  record_status VARCHAR(20) DEFAULT 'completed',   -- draft, completed, signed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_medical_records_contact ON medical_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_cid ON medical_records USING GIN(cid_codes);

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_medical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_records_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Médico vê seus prontuários OU admin/dono vê tudo
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

-- Política INSERT: Qualquer médico autenticado pode criar
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

-- Política UPDATE: Médico pode editar seus próprios prontuários
CREATE POLICY "medical_records_update_policy" ON medical_records
  FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'dono')
    )
  );

-- Política DELETE: Apenas admin/dono podem deletar
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
  medications JSONB NOT NULL,              -- Array de medicamentos
  -- Estrutura: [{ name, dosage, frequency, duration, quantity, instructions }]

  notes TEXT,                              -- Observações gerais
  prescription_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,                        -- Validade da receita

  -- Tipo de receita
  prescription_type VARCHAR(30) DEFAULT 'simple', -- simple, controlled, special

  -- Status
  is_printed BOOLEAN DEFAULT FALSE,
  printed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para prescriptions
CREATE INDEX idx_prescriptions_record ON prescriptions(medical_record_id);
CREATE INDEX idx_prescriptions_contact ON prescriptions(contact_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date DESC);

-- RLS para prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

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
-- Estrutura emergency_contact: { name, phone, relationship }

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE medical_records IS 'Prontuários médicos dos pacientes';
COMMENT ON TABLE prescriptions IS 'Receitas médicas para impressão';
COMMENT ON COLUMN medical_records.vital_signs IS 'JSON: { bp_systolic, bp_diastolic, heart_rate, respiratory_rate, temperature, spo2, weight, height, bmi }';
COMMENT ON COLUMN medical_records.prescriptions IS 'JSON array: [{ medication, dosage, frequency, duration, instructions }]';
COMMENT ON COLUMN prescriptions.medications IS 'JSON array: [{ name, dosage, frequency, duration, quantity, instructions }]';
