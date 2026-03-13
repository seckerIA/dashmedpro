-- Tabela de métricas diárias de campanhas
-- Armazena um row por campanha por dia (via Meta API time_increment=1)
-- Permite filtros de período reais nos relatórios de marketing

CREATE TABLE IF NOT EXISTS public.ad_campaign_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_sync_id UUID NOT NULL REFERENCES public.ad_campaigns_sync(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(12, 2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_value DECIMAL(12, 2) DEFAULT 0,
    ctr DECIMAL(5, 4) DEFAULT 0,
    cpc DECIMAL(12, 2) DEFAULT 0,
    cpm DECIMAL(12, 2) DEFAULT 0,
    reach INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_sync_id, metric_date)
);

-- Indexes para queries comuns
CREATE INDEX idx_daily_metrics_user_date ON public.ad_campaign_daily_metrics(user_id, metric_date DESC);
CREATE INDEX idx_daily_metrics_campaign_date ON public.ad_campaign_daily_metrics(campaign_sync_id, metric_date DESC);

-- RLS
ALTER TABLE public.ad_campaign_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily metrics"
    ON public.ad_campaign_daily_metrics FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_dono(auth.uid()));

CREATE POLICY "Users insert own daily metrics"
    ON public.ad_campaign_daily_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily metrics"
    ON public.ad_campaign_daily_metrics FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin_or_dono(auth.uid()));

CREATE POLICY "Users delete own daily metrics"
    ON public.ad_campaign_daily_metrics FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin_or_dono(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON public.ad_campaign_daily_metrics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
