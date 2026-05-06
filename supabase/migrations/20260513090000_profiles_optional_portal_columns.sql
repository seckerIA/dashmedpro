-- Colunas usadas pelo app (useAuth, useUserProfile, admin-portal) em projetos só com baseline antigo/Lovable.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.is_super_admin IS 'Plataforma / super-admin (edge admin-portal, bootstrap)';
COMMENT ON COLUMN public.profiles.doctor_id IS 'Para secretarias: médico principal vinculado (legado TeamManagement)';
