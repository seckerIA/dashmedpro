-- ============================================
-- SISTEMA DE SINAL (ENTRADA) - MIGRAÇÕES
-- ============================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Adicionar campo de porcentagem de sinal aos procedimentos
ALTER TABLE public.commercial_procedures
  ADD COLUMN IF NOT EXISTS sinal_percentage DECIMAL(5,2) DEFAULT 30.00;

COMMENT ON COLUMN public.commercial_procedures.sinal_percentage IS 'Porcentagem do valor cobrada como sinal (entrada). Ex: 30.00 = 30%';

-- Atualizar procedimentos existentes com 30% de sinal padrão
UPDATE public.commercial_procedures
SET sinal_percentage = 30.00
WHERE sinal_percentage IS NULL;

-- 2. Adicionar campos de sinal ao medical_appointments
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
CREATE INDEX IF NOT EXISTS idx_medical_appointments_sinal_paid
ON public.medical_appointments(sinal_paid)
WHERE sinal_amount IS NOT NULL AND sinal_amount > 0;

-- ============================================
-- BUCKET DE STORAGE
-- ============================================
-- IMPORTANTE: O bucket precisa ser criado manualmente no Supabase Dashboard!
-- Vá em: Storage > New Bucket
-- Nome: sinal-receipts
-- Public: NÃO (deixar privado)
-- File size limit: 5MB (5242880 bytes)
-- Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf

-- Após criar o bucket, adicione estas políticas RLS:

-- Política para upload (INSERT)
-- CREATE POLICY "Users can upload sinal receipts"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'sinal-receipts');

-- Política para visualização (SELECT)
-- CREATE POLICY "Users can view sinal receipts"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'sinal-receipts');

-- Política para atualização (UPDATE)
-- CREATE POLICY "Users can update their sinal receipts"
--   ON storage.objects FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'sinal-receipts');

-- Política para exclusão (DELETE)
-- CREATE POLICY "Users can delete their sinal receipts"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'sinal-receipts');

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Após executar, verifique se os campos foram criados:

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'commercial_procedures' AND column_name = 'sinal_percentage';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'medical_appointments' AND column_name LIKE 'sinal%';
