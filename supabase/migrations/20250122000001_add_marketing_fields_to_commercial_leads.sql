-- =====================================================
-- ADICIONAR CAMPOS DE INTEGRAÇÃO COM MARKETING
-- Vincular leads comerciais a campanhas de anúncios e UTMs
-- =====================================================

-- Adicionar campos opcionais para vincular leads a anúncios
ALTER TABLE public.commercial_leads 
ADD COLUMN IF NOT EXISTS utm_id UUID REFERENCES public.generated_utms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ad_campaign_sync_id UUID REFERENCES public.ad_campaigns_sync(id) ON DELETE SET NULL;

-- Comentários
COMMENT ON COLUMN public.commercial_leads.utm_id IS 'Vínculo com UTM gerado que originou este lead';
COMMENT ON COLUMN public.commercial_leads.ad_campaign_sync_id IS 'Vínculo com campanha de anúncio que originou este lead';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commercial_leads_utm_id ON public.commercial_leads(utm_id);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_ad_campaign_sync_id ON public.commercial_leads(ad_campaign_sync_id);

-- RLS já está habilitado na tabela commercial_leads
-- Os campos adicionados herdam as mesmas políticas RLS

