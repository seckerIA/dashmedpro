-- =====================================================
-- Migration: Add secretaria/medico roles and doctor_id
-- =====================================================

-- 1. Criar o enum app_role se não existir, ou adicionar novos valores
DO $$
BEGIN
    -- Verificar se o tipo app_role existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        -- Criar o tipo com todos os valores
        CREATE TYPE app_role AS ENUM ('admin', 'dono', 'vendedor', 'gestor_trafego', 'secretaria', 'medico');
    ELSE
        -- Adicionar novos valores se não existirem
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'secretaria';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'medico';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END$$;

-- 2. Add doctor_id column to medical_appointments
ALTER TABLE medical_appointments
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create index for doctor_id for performance
CREATE INDEX IF NOT EXISTS idx_medical_appointments_doctor_id
ON medical_appointments(doctor_id);

-- 4. Backfill: Set doctor_id = user_id for existing appointments
UPDATE medical_appointments
SET doctor_id = user_id
WHERE doctor_id IS NULL;

-- 5. Create helper function to check if user can schedule for others
CREATE OR REPLACE FUNCTION can_schedule_for_others(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id
    AND role IN ('admin', 'dono', 'secretaria')
    AND is_active = true
  )
$$;

-- 6. Create helper function to check if user is a doctor
CREATE OR REPLACE FUNCTION is_doctor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id
    AND role IN ('dono', 'medico')
    AND is_active = true
  )
$$;

-- 7. Update RLS policies for medical_appointments to support doctor_id

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can view appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can insert appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON medical_appointments;
DROP POLICY IF EXISTS "Users can delete appointments" ON medical_appointments;

-- New SELECT policy
CREATE POLICY "Users can view appointments"
    ON medical_appointments FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR auth.uid() = doctor_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono', 'secretaria')
            AND is_active = true
        )
    );

-- New INSERT policy
CREATE POLICY "Users can insert appointments"
    ON medical_appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

-- New UPDATE policy
CREATE POLICY "Users can update appointments"
    ON medical_appointments FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR auth.uid() = doctor_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono', 'secretaria')
            AND is_active = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR auth.uid() = doctor_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono', 'secretaria')
            AND is_active = true
        )
    );

-- New DELETE policy
CREATE POLICY "Users can delete appointments"
    ON medical_appointments FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR auth.uid() = doctor_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'dono')
            AND is_active = true
        )
    );

-- 8. Add comment for documentation
COMMENT ON COLUMN medical_appointments.doctor_id IS 'The doctor who will perform the appointment. May differ from user_id when secretary schedules for a doctor.';
