-- ============================================
-- ATUALIZACAO DOS STAGES DO PIPELINE
-- ============================================
-- Modelo antigo (agencia de marketing):
-- lead_novo, qualificado, apresentacao, proposta, negociacao, fechado_ganho, fechado_perdido
--
-- Novo modelo (clinica medica):
-- lead_novo, agendado, em_tratamento, inadimplente

-- Adicionar novos valores ao enum (se ainda nao existirem)
DO $$
BEGIN
  -- Adicionar 'agendado'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agendado' AND enumtypid = 'crm_pipeline_stage'::regtype) THEN
    ALTER TYPE crm_pipeline_stage ADD VALUE 'agendado';
  END IF;

  -- Adicionar 'em_tratamento'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_tratamento' AND enumtypid = 'crm_pipeline_stage'::regtype) THEN
    ALTER TYPE crm_pipeline_stage ADD VALUE 'em_tratamento';
  END IF;

  -- Adicionar 'inadimplente'
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inadimplente' AND enumtypid = 'crm_pipeline_stage'::regtype) THEN
    ALTER TYPE crm_pipeline_stage ADD VALUE 'inadimplente';
  END IF;
END $$;

-- Adicionar campo is_in_treatment para indicar se paciente esta em tratamento
-- (permite que um deal esteja em "agendado" mas tambem "em tratamento")
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS is_in_treatment BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.crm_deals.is_in_treatment IS 'Indica se o paciente esta em tratamento ativo com o medico. Permite estar em multiplas colunas do pipeline.';

-- Adicionar campo is_defaulting para indicar inadimplencia
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS is_defaulting BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.crm_deals.is_defaulting IS 'Indica se o paciente esta inadimplente (com pagamento pendente).';

-- Migrar dados existentes (manter lead_novo e fechado_ganho/fechado_perdido, converter o resto)
-- Stages de marketing -> lead_novo
UPDATE public.crm_deals
SET stage = 'lead_novo'
WHERE stage IN ('qualificado', 'apresentacao', 'proposta', 'negociacao');

-- fechado_ganho -> agendado (assumindo que ganhou = vai consultar)
-- Comentado para nao perder dados existentes - descomente se quiser migrar
-- UPDATE public.crm_deals
-- SET stage = 'agendado'
-- WHERE stage = 'fechado_ganho';

-- Criar indice para consultas de tratamento e inadimplencia
CREATE INDEX IF NOT EXISTS idx_crm_deals_is_in_treatment ON public.crm_deals(is_in_treatment) WHERE is_in_treatment = true;
CREATE INDEX IF NOT EXISTS idx_crm_deals_is_defaulting ON public.crm_deals(is_defaulting) WHERE is_defaulting = true;
