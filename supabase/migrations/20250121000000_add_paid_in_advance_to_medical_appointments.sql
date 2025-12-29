-- Add paid_in_advance column to medical_appointments table
ALTER TABLE public.medical_appointments
  ADD COLUMN IF NOT EXISTS paid_in_advance BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.medical_appointments.paid_in_advance IS 'Indica se o pagamento foi feito antecipadamente (true) ou será feito na consulta (false)';






