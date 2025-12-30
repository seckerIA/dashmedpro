-- Adicionar campo de porcentagem de sinal aos procedimentos
ALTER TABLE public.commercial_procedures
  ADD COLUMN IF NOT EXISTS sinal_percentage DECIMAL(5,2) DEFAULT 30.00;

COMMENT ON COLUMN public.commercial_procedures.sinal_percentage IS 'Porcentagem do valor cobrada como sinal (entrada). Ex: 30.00 = 30%';

-- Atualizar procedimentos existentes com 30% de sinal padrão
UPDATE public.commercial_procedures
SET sinal_percentage = 30.00
WHERE sinal_percentage IS NULL;
