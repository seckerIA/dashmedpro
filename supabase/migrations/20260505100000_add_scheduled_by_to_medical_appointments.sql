-- Performance Comercial: rastrear quem agendou cada consulta
-- Permite separar o "dono" do agendamento (médico) de quem efetivamente agendou (secretária)
-- Necessário para metrificar performance individual da equipe de atendimento.

ALTER TABLE public.medical_appointments
  ADD COLUMN IF NOT EXISTS scheduled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.medical_appointments.scheduled_by IS
  'Usuário que efetivamente criou/agendou a consulta (geralmente a secretária). Pode ser diferente de user_id (médico) e doctor_id.';

CREATE INDEX IF NOT EXISTS idx_medical_appointments_scheduled_by
  ON public.medical_appointments (scheduled_by, start_time);

CREATE INDEX IF NOT EXISTS idx_medical_appointments_scheduled_by_payment
  ON public.medical_appointments (scheduled_by, payment_status, status);

-- Backfill conservador: para registros já existentes onde quem inseriu
-- (user_id) tem role 'secretaria', copiamos para scheduled_by.
-- Para os demais (registros criados pelo próprio médico), deixamos NULL
-- para não inflar artificialmente o ranking.
UPDATE public.medical_appointments AS ma
SET scheduled_by = ma.user_id
FROM public.profiles AS p
WHERE ma.scheduled_by IS NULL
  AND p.id = ma.user_id
  AND p.role = 'secretaria';
