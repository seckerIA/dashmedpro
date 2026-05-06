-- Sistema de lembrete automático 2h antes da consulta
-- Objetivo: enviar WhatsApp para pacientes agendados com 2 horas de antecedência
-- sem duplicar envios em reprocessamentos do cron.

CREATE TABLE IF NOT EXISTS public.medical_appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.medical_appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT '2h_before',
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz NULL,
  message text NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_medical_appointment_reminders_unique
  ON public.medical_appointment_reminders (appointment_id, reminder_type);

CREATE INDEX IF NOT EXISTS idx_medical_appointment_reminders_status_schedule
  ON public.medical_appointment_reminders (status, scheduled_for);

ALTER TABLE public.medical_appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas alinhadas ao padrão do sistema (dono do registro, secretária vinculada, admin/dono)
DROP POLICY IF EXISTS "Users can view their own appointment reminders" ON public.medical_appointment_reminders;
CREATE POLICY "Users can view their own appointment reminders"
  ON public.medical_appointment_reminders
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = medical_appointment_reminders.user_id
    )
    OR public.is_admin_or_dono(auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage their own appointment reminders" ON public.medical_appointment_reminders;
CREATE POLICY "Users can manage their own appointment reminders"
  ON public.medical_appointment_reminders
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin_or_dono(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin_or_dono(auth.uid()));

-- Agendamento do cron (a cada 5 minutos)
-- Janela de envio no runtime: consultas entre 1h55 e 2h05 a partir de agora.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  -- Evita criar job duplicado se migration rodar novamente
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'appointment-reminder-2h'
  ) THEN
    PERFORM cron.schedule(
      'appointment-reminder-2h',
      '*/5 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/appointment-reminder-cron',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{"source":"pg_cron"}'::jsonb
      );
      $job$
    );
  END IF;
END
$$;
