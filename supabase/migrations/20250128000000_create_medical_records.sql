-- ================================================
-- MEDICAL RECORDS SYSTEM (PRONTUÁRIO MÉDICO)
-- CFM Compliant - Resolução n° 1638/2002 e CFM 2218/2018
-- ================================================

-- Create ENUMs for medical record types and status
CREATE TYPE public.medical_record_type AS ENUM (
  'consultation',
  'procedure',
  'exam_result',
  'prescription',
  'certificate',
  'referral',
  'evolution'
);

CREATE TYPE public.medical_record_status AS ENUM (
  'draft',
  'completed',
  'reviewed',
  'archived'
);

-- ================================================
-- MAIN TABLE: medical_records
-- ================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,

  -- Record metadata
  record_type public.medical_record_type NOT NULL DEFAULT 'consultation',
  status public.medical_record_status NOT NULL DEFAULT 'draft',

  -- CFM Required Fields - Anamnese
  chief_complaint TEXT,
  history_present_illness TEXT,
  past_medical_history TEXT,
  family_history TEXT,
  medications TEXT[],
  allergies TEXT[],

  -- Vital Signs (JSONB for flexibility)
  vital_signs JSONB DEFAULT '{}'::jsonb,

  -- Physical Examination
  physical_examination TEXT,

  -- Assessment and Diagnosis
  assessment TEXT,
  diagnosis TEXT[],

  -- Treatment Plan
  treatment_plan TEXT,
  prescriptions JSONB DEFAULT '[]'::jsonb,
  exams_requested JSONB DEFAULT '[]'::jsonb,

  -- Follow-up
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Clinical Notes
  clinical_notes TEXT, -- Private (doctor only)
  patient_notes TEXT,  -- Visible to patient

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ================================================
-- AUDIT TABLE: medical_record_revisions
-- ================================================
CREATE TABLE IF NOT EXISTS public.medical_record_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  changes JSONB NOT NULL,
  reason TEXT,
  ip_address INET,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX idx_medical_records_contact_id ON public.medical_records(contact_id);
CREATE INDEX idx_medical_records_appointment_id ON public.medical_records(appointment_id);
CREATE INDEX idx_medical_records_contact_created ON public.medical_records(contact_id, created_at DESC);
CREATE INDEX idx_medical_records_diagnosis_gin ON public.medical_records USING GIN(diagnosis);
CREATE INDEX idx_medical_records_status ON public.medical_records(status);

CREATE INDEX idx_medical_record_revisions_record_id ON public.medical_record_revisions(medical_record_id);

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_records_updated_at();

-- Trigger to audit changes when record is completed
CREATE OR REPLACE FUNCTION audit_medical_record_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit when status changes to completed or when completed record is edited
  IF (NEW.status = 'completed' AND OLD.status != 'completed') OR
     (NEW.status = 'completed' AND OLD.status = 'completed') THEN
    INSERT INTO public.medical_record_revisions (
      medical_record_id,
      edited_by,
      changes,
      reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      ),
      'Record completed or modified after completion'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_medical_record_changes
  AFTER UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION audit_medical_record_changes();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT medical_records
-- Only doctors can view their own records, or admins/owners can view all
CREATE POLICY "medical_records_select_policy" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'dono')
    )
  );

-- Policy: INSERT medical_records
-- Only doctors (role = 'medico' or 'dono') can create records
CREATE POLICY "medical_records_insert_policy" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('medico', 'dono')
    ) AND
    auth.uid() = doctor_id
  );

-- Policy: UPDATE medical_records
-- Only the doctor who created the record can update it
CREATE POLICY "medical_records_update_policy" ON public.medical_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Policy: DELETE medical_records
-- No direct deletes allowed - use status = 'archived' instead
CREATE POLICY "medical_records_delete_policy" ON public.medical_records
  FOR DELETE TO authenticated
  USING (false);

-- Policy: SELECT medical_record_revisions
-- Same as medical_records select policy
CREATE POLICY "medical_record_revisions_select_policy" ON public.medical_record_revisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_records
      WHERE id = medical_record_revisions.medical_record_id
      AND (
        auth.uid() = doctor_id OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('admin', 'dono')
        )
      )
    )
  );

-- Policy: INSERT medical_record_revisions
-- Automatically created by trigger, no manual inserts
CREATE POLICY "medical_record_revisions_insert_policy" ON public.medical_record_revisions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = edited_by);

-- Policy: UPDATE/DELETE medical_record_revisions
-- No updates or deletes allowed on audit trail
CREATE POLICY "medical_record_revisions_update_policy" ON public.medical_record_revisions
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "medical_record_revisions_delete_policy" ON public.medical_record_revisions
  FOR DELETE TO authenticated
  USING (false);

-- ================================================
-- COMMENTS
-- ================================================
COMMENT ON TABLE public.medical_records IS 'Medical records (Prontuários) compliant with CFM regulations';
COMMENT ON TABLE public.medical_record_revisions IS 'Audit trail for medical record changes';

COMMENT ON COLUMN public.medical_records.vital_signs IS 'JSON: { temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, bmi }';
COMMENT ON COLUMN public.medical_records.prescriptions IS 'JSON Array: [{ medication, dosage, frequency, duration, instructions }]';
COMMENT ON COLUMN public.medical_records.exams_requested IS 'JSON Array: [{ exam_name, urgency, notes }]';
COMMENT ON COLUMN public.medical_records.clinical_notes IS 'Private notes - visible only to doctor';
COMMENT ON COLUMN public.medical_records.patient_notes IS 'Notes visible to patient';
