-- ============================================
-- ADICIONAR STAGE 'aguardando_retorno' AO PIPELINE
-- ============================================
-- Novo stage para pacientes que:
-- - Fizeram 1 consulta completa
-- - Pagaram corretamente
-- - Não têm próxima consulta agendada
-- - Não estão em tratamento (is_in_treatment = false)

-- Adicionar novo valor ao enum (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_retorno' AND enumtypid = 'crm_pipeline_stage'::regtype) THEN
    ALTER TYPE crm_pipeline_stage ADD VALUE 'aguardando_retorno';
  END IF;
END $$;
