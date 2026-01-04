-- Migration: Add missing indices for improved query performance
-- Fixes "stuck queries" and connection timeouts by optimizing frequent lookups

-- 1. Medical Appointments - Optimize doctor and secretary views
CREATE INDEX IF NOT EXISTS idx_medical_appointments_doctor_id 
ON public.medical_appointments(doctor_id);

-- 2. CRM Follow Ups - Optimize user and lead views
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_user_id 
ON public.crm_follow_ups(user_id);

CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_contact_id 
ON public.crm_follow_ups(contact_id);

CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_scheduled_at 
ON public.crm_follow_ups(scheduled_date);

-- 3. Composite for Medical Calendar when filtering by both
CREATE INDEX IF NOT EXISTS idx_medical_appts_doctor_time
ON public.medical_appointments(doctor_id, start_time);

-- 4. Composite for Follow Ups - Active items
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_pending
ON public.crm_follow_ups(user_id, completed, scheduled_date)
WHERE completed = false;

ANALYZE public.medical_appointments;
ANALYZE public.crm_follow_ups;
