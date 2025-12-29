-- Adicionar foreign key de medical_appointments.doctor_id para profiles.id
-- Isso permite fazer joins com a tabela profiles para obter dados do médico

-- Adicionar FK para doctor_id -> profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'medical_appointments_doctor_id_profiles_fk'
  ) THEN
    ALTER TABLE public.medical_appointments
      ADD CONSTRAINT medical_appointments_doctor_id_profiles_fk
      FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar FK para user_id -> profiles (para permitir join também)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'medical_appointments_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.medical_appointments
      ADD CONSTRAINT medical_appointments_user_id_profiles_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
