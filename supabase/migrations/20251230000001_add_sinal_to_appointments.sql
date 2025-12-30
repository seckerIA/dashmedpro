-- Adicionar campos de sinal ao medical_appointments
ALTER TABLE public.medical_appointments
  ADD COLUMN IF NOT EXISTS sinal_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS sinal_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sinal_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS sinal_paid_at TIMESTAMPTZ;

COMMENT ON COLUMN public.medical_appointments.sinal_amount IS 'Valor do sinal calculado (porcentagem do estimated_value)';
COMMENT ON COLUMN public.medical_appointments.sinal_paid IS 'Se o sinal foi pago';
COMMENT ON COLUMN public.medical_appointments.sinal_receipt_url IS 'URL do comprovante de pagamento no Supabase Storage';
COMMENT ON COLUMN public.medical_appointments.sinal_paid_at IS 'Data/hora do pagamento do sinal';

-- Criar índice para consultas com sinal pendente
CREATE INDEX IF NOT EXISTS idx_medical_appointments_sinal_paid ON public.medical_appointments(sinal_paid) WHERE sinal_amount IS NOT NULL AND sinal_amount > 0;
