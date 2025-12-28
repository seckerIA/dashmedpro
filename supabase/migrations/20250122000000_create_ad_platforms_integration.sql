-- =====================================================
-- INTEGRAÇÃO COM PLATAFORMAS DE ANÚNCIOS
-- Google Ads e Meta Ads - Versão Simplificada Utimify
-- =====================================================

-- Enum para plataformas de anúncios
CREATE TYPE ad_platform AS ENUM ('google_ads', 'meta_ads');

-- Enum para status de sincronização
CREATE TYPE sync_status AS ENUM ('success', 'error', 'pending');

-- =====================================================
-- TABELA: ad_platform_connections
-- Armazena conexões com Google Ads e Meta Ads
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ad_platform_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform ad_platform NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    api_key TEXT NOT NULL, -- Será criptografado via aplicação
    refresh_token TEXT, -- Para OAuth futuro (Google)
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_status sync_status DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Evitar conexões duplicadas
    UNIQUE(user_id, platform, account_id)
);

COMMENT ON TABLE public.ad_platform_connections IS 'Conexões com plataformas de anúncios (Google Ads e Meta Ads)';
COMMENT ON COLUMN public.ad_platform_connections.platform IS 'Plataforma: google_ads ou meta_ads';
COMMENT ON COLUMN public.ad_platform_connections.api_key IS 'Chave API (deve ser criptografada na aplicação)';
COMMENT ON COLUMN public.ad_platform_connections.sync_status IS 'Status da última sincronização: success, error, pending';

-- =====================================================
-- TABELA: ad_campaigns_sync
-- Armazena dados sincronizados das campanhas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ad_campaigns_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.ad_platform_connections(id) ON DELETE CASCADE,
    platform_campaign_id TEXT NOT NULL, -- ID da campanha na plataforma
    platform_campaign_name TEXT NOT NULL,
    platform ad_platform NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'removed')),
    budget DECIMAL(12, 2), -- Orçamento diário
    spend DECIMAL(12, 2) DEFAULT 0, -- Gasto atual
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0, -- Click-through rate (porcentagem)
    conversions INTEGER DEFAULT 0,
    conversion_value DECIMAL(12, 2) DEFAULT 0,
    cpa DECIMAL(12, 2), -- Cost per acquisition
    roas DECIMAL(5, 2), -- Return on ad spend
    start_date DATE,
    end_date DATE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Evitar duplicatas de campanhas
    UNIQUE(connection_id, platform_campaign_id)
);

COMMENT ON TABLE public.ad_campaigns_sync IS 'Dados sincronizados das campanhas de anúncios';
COMMENT ON COLUMN public.ad_campaigns_sync.platform_campaign_id IS 'ID da campanha na plataforma original (Google/Meta)';
COMMENT ON COLUMN public.ad_campaigns_sync.ctr IS 'Click-through rate em porcentagem (ex: 2.5 = 2.5%)';
COMMENT ON COLUMN public.ad_campaigns_sync.roas IS 'Return on ad spend (ex: 3.5 = 3.5x)';

-- =====================================================
-- TABELA: utm_templates
-- Templates de UTMs para geração de links
-- =====================================================
CREATE TABLE IF NOT EXISTS public.utm_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    utm_source TEXT NOT NULL, -- Ex: 'google', 'facebook'
    utm_medium TEXT NOT NULL, -- Ex: 'cpc', 'social'
    utm_campaign TEXT NOT NULL, -- Nome da campanha
    utm_term TEXT, -- Termo de busca (opcional)
    utm_content TEXT, -- Conteúdo específico (opcional)
    base_url TEXT NOT NULL, -- URL base do site
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.utm_templates IS 'Templates de UTMs para geração de links rastreáveis';
COMMENT ON COLUMN public.utm_templates.utm_source IS 'Fonte do tráfego (ex: google, facebook)';
COMMENT ON COLUMN public.utm_templates.utm_medium IS 'Meio de tráfego (ex: cpc, social, email)';
COMMENT ON COLUMN public.utm_templates.utm_campaign IS 'Nome da campanha';

-- =====================================================
-- TABELA: generated_utms
-- UTMs gerados e seus resultados
-- =====================================================
CREATE TABLE IF NOT EXISTS public.generated_utms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.utm_templates(id) ON DELETE SET NULL,
    ad_campaign_sync_id UUID REFERENCES public.ad_campaigns_sync(id) ON DELETE SET NULL,
    full_url TEXT NOT NULL, -- URL completa com UTMs
    clicks INTEGER DEFAULT 0, -- Cliques rastreados
    conversions INTEGER DEFAULT 0, -- Conversões rastreadas
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.generated_utms IS 'UTMs gerados e seus resultados de rastreamento';
COMMENT ON COLUMN public.generated_utms.full_url IS 'URL completa com parâmetros UTM';
COMMENT ON COLUMN public.generated_utms.clicks IS 'Número de cliques rastreados via UTM';

-- =====================================================
-- ATUALIZAR: commercial_campaigns
-- Adicionar campos para vincular com anúncios
-- =====================================================
ALTER TABLE public.commercial_campaigns 
ADD COLUMN IF NOT EXISTS ad_campaign_sync_id UUID REFERENCES public.ad_campaigns_sync(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS utm_template_id UUID REFERENCES public.utm_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.commercial_campaigns.ad_campaign_sync_id IS 'Vínculo com campanha de anúncio sincronizada';
COMMENT ON COLUMN public.commercial_campaigns.utm_template_id IS 'Template de UTM usado na campanha';

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- ad_platform_connections
CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_user_id ON public.ad_platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_platform ON public.ad_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_is_active ON public.ad_platform_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_sync_status ON public.ad_platform_connections(sync_status);

-- ad_campaigns_sync
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_user_id ON public.ad_campaigns_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_connection_id ON public.ad_campaigns_sync(connection_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_platform ON public.ad_campaigns_sync(platform);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_status ON public.ad_campaigns_sync(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_synced_at ON public.ad_campaigns_sync(synced_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_sync_platform_campaign_id ON public.ad_campaigns_sync(platform_campaign_id);

-- utm_templates
CREATE INDEX IF NOT EXISTS idx_utm_templates_user_id ON public.utm_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_utm_templates_is_active ON public.utm_templates(is_active);

-- generated_utms
CREATE INDEX IF NOT EXISTS idx_generated_utms_user_id ON public.generated_utms(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_utms_template_id ON public.generated_utms(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_utms_ad_campaign_sync_id ON public.generated_utms(ad_campaign_sync_id);
CREATE INDEX IF NOT EXISTS idx_generated_utms_created_at ON public.generated_utms(created_at);

-- commercial_campaigns (novos campos)
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_ad_campaign_sync_id ON public.commercial_campaigns(ad_campaign_sync_id);
CREATE INDEX IF NOT EXISTS idx_commercial_campaigns_utm_template_id ON public.commercial_campaigns(utm_template_id);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

-- Trigger para ad_platform_connections
CREATE TRIGGER update_ad_platform_connections_updated_at
    BEFORE UPDATE ON public.ad_platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para ad_campaigns_sync
CREATE TRIGGER update_ad_campaigns_sync_updated_at
    BEFORE UPDATE ON public.ad_campaigns_sync
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para utm_templates
CREATE TRIGGER update_utm_templates_updated_at
    BEFORE UPDATE ON public.utm_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para generated_utms
CREATE TRIGGER update_generated_utms_updated_at
    BEFORE UPDATE ON public.generated_utms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_utms ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: ad_platform_connections
-- =====================================================

-- SELECT: Usuário vê apenas suas próprias conexões, Admin/Dono vê tudo
CREATE POLICY "Users can view own ad platform connections"
    ON public.ad_platform_connections FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- INSERT: Usuário pode criar suas próprias conexões
CREATE POLICY "Users can insert own ad platform connections"
    ON public.ad_platform_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário pode atualizar suas próprias conexões, Admin/Dono pode atualizar tudo
CREATE POLICY "Users can update own ad platform connections"
    ON public.ad_platform_connections FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- DELETE: Usuário pode deletar suas próprias conexões, Admin/Dono pode deletar tudo
CREATE POLICY "Users can delete own ad platform connections"
    ON public.ad_platform_connections FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- =====================================================
-- POLÍTICAS RLS: ad_campaigns_sync
-- =====================================================

-- SELECT: Usuário vê apenas suas próprias campanhas, Admin/Dono vê tudo
CREATE POLICY "Users can view own ad campaigns sync"
    ON public.ad_campaigns_sync FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- INSERT: Usuário pode criar suas próprias campanhas sincronizadas
CREATE POLICY "Users can insert own ad campaigns sync"
    ON public.ad_campaigns_sync FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário pode atualizar suas próprias campanhas, Admin/Dono pode atualizar tudo
CREATE POLICY "Users can update own ad campaigns sync"
    ON public.ad_campaigns_sync FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- DELETE: Usuário pode deletar suas próprias campanhas, Admin/Dono pode deletar tudo
CREATE POLICY "Users can delete own ad campaigns sync"
    ON public.ad_campaigns_sync FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- =====================================================
-- POLÍTICAS RLS: utm_templates
-- =====================================================

-- SELECT: Usuário vê apenas seus próprios templates, Admin/Dono vê tudo
CREATE POLICY "Users can view own utm templates"
    ON public.utm_templates FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- INSERT: Usuário pode criar seus próprios templates
CREATE POLICY "Users can insert own utm templates"
    ON public.utm_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário pode atualizar seus próprios templates, Admin/Dono pode atualizar tudo
CREATE POLICY "Users can update own utm templates"
    ON public.utm_templates FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- DELETE: Usuário pode deletar seus próprios templates, Admin/Dono pode deletar tudo
CREATE POLICY "Users can delete own utm templates"
    ON public.utm_templates FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- =====================================================
-- POLÍTICAS RLS: generated_utms
-- =====================================================

-- SELECT: Usuário vê apenas seus próprios UTMs gerados, Admin/Dono vê tudo
CREATE POLICY "Users can view own generated utms"
    ON public.generated_utms FOR SELECT
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- INSERT: Usuário pode criar seus próprios UTMs gerados
CREATE POLICY "Users can insert own generated utms"
    ON public.generated_utms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário pode atualizar seus próprios UTMs, Admin/Dono pode atualizar tudo
CREATE POLICY "Users can update own generated utms"
    ON public.generated_utms FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );

-- DELETE: Usuário pode deletar seus próprios UTMs, Admin/Dono pode deletar tudo
CREATE POLICY "Users can delete own generated utms"
    ON public.generated_utms FOR DELETE
    USING (
        auth.uid() = user_id 
        OR public.is_admin_or_dono(auth.uid())
    );


