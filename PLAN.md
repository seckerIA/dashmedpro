# Plano: Meta Business Platform - WhatsApp + Ads Integration

## Visão Geral

Integração completa com Meta Business Platform para:
1. **WhatsApp Business** - Inbox, envio de mensagens, automações
2. **Meta Ads** - Análise de campanhas, criativos, relatórios de performance

---

## Estrutura Atual do Módulo Marketing

```
src/pages/Marketing.tsx
├── MetaConnectionGate (bloqueia acesso até conectar)
├── Tabs
│   ├── Dashboard → MarketingDashboard
│   ├── Integrações → AdPlatformsIntegration
│   │                  └── MetaIntegrationCard
│   ├── Campanhas → AdCampaignsList
│   ├── UTMs → UtmGenerator + UtmTemplates
│   ├── Leads → MarketingLeadsConversions
│   └── Relatórios → MarketingReports

src/hooks/
├── useMetaOAuth.tsx (OAuth atual - será refatorado)
├── useAdPlatformConnections.tsx (conexões ad_platform_connections)
├── useMarketingDashboard.tsx (métricas agregadas)
└── useAdCampaignsSync.tsx (sync de campanhas)
```

---

## Problema Atual

Nossa implementação usa OAuth tradicional com redirect, que:
1. Requer múltiplas chamadas à Graph API para buscar assets
2. Depende de permissões avançadas que podem não estar disponíveis
3. Fluxo complexo com popup/redirect que não renderiza corretamente

---

## Parte 1: WhatsApp - Embedded Signup

### Solução

Baseado na pesquisa de implementações reais (Chatwoot, YCloud, Alibaba Cloud), o padrão correto é **Embedded Signup**:
- Usa `FB.login()` com configuração específica
- Recebe `waba_id` e `phone_number_id` diretamente no callback
- Simplifica drasticamente o fluxo

### Código Frontend

```javascript
// 1. Carregar Facebook SDK
useEffect(() => {
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_APP_ID',
      cookie: true,
      xfbml: true,
      version: 'v21.0'
    });
  };

  // Load SDK script
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}, []);

// 2. Session Info Listener - captura dados do popup WhatsApp
useEffect(() => {
  const sessionInfoListener = (event) => {
    if (!event.origin?.endsWith('facebook.com')) return;

    try {
      const data = JSON.parse(event.data);

      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        if (data.event === 'FINISH') {
          const { phone_number_id, waba_id, businessId } = data.data;
          saveWhatsAppConfig({ phone_number_id, waba_id, businessId });
        }
      }
    } catch {
      // Non-JSON response, ignore
    }
  };

  window.addEventListener('message', sessionInfoListener);
  return () => window.removeEventListener('message', sessionInfoListener);
}, []);

// 3. Iniciar Embedded Signup para WhatsApp
const launchWhatsAppSignup = () => {
  FB.login((response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      exchangeCodeForToken(code);
    }
  }, {
    config_id: 'WHATSAPP_CONFIG_ID', // Config específico para WhatsApp
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      feature: 'whatsapp_embedded_signup',
      version: 2,
      sessionInfoVersion: 2,
      setup: {}
    }
  });
};
```

### Permissões WhatsApp
- `whatsapp_business_management` - Gerenciar conta WhatsApp Business
- `whatsapp_business_messaging` - Enviar/receber mensagens

---

## Parte 2: Meta Ads - Marketing API

### Solução

Para análise de campanhas e criativos, usamos a **Marketing API** com OAuth padrão:
- Mesmo token de acesso funciona para ambos (WhatsApp + Ads)
- Endpoints específicos para campanhas, ad sets, ads e insights

### Código Frontend - OAuth para Ads

```javascript
// Iniciar OAuth para Ads (pode ser combinado com WhatsApp ou separado)
const launchAdsOAuth = () => {
  FB.login((response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      exchangeCodeForToken(code, 'ads');
    }
  }, {
    scope: 'ads_read,ads_management,business_management',
    response_type: 'code',
    override_default_response_type: true
  });
};
```

### Permissões Ads
- `ads_read` - Ler dados de campanhas e insights (obrigatório)
- `ads_management` - Criar/editar campanhas (opcional)
- `business_management` - Acesso a Business Manager

### Endpoints da Marketing API

| Recurso | Endpoint | Descrição |
|---------|----------|-----------|
| Ad Accounts | `GET /me/adaccounts` | Lista contas de anúncios |
| Campaigns | `GET /act_{id}/campaigns` | Lista campanhas |
| Ad Sets | `GET /act_{id}/adsets` | Lista conjuntos de anúncios |
| Ads | `GET /act_{id}/ads` | Lista anúncios |
| Insights | `GET /{object_id}/insights` | Métricas de performance |
| Creatives | `GET /{ad_id}/adcreatives` | Dados do criativo |

### Exemplo: Buscar Insights de Campanha

```typescript
// Backend: Edge Function para buscar insights
async function getCampaignInsights(campaignId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${campaignId}/insights?` +
    `fields=impressions,clicks,spend,reach,cpc,cpm,ctr,conversions` +
    `&date_preset=last_30d` +
    `&access_token=${accessToken}`
  );
  return response.json();
}

// Buscar todos os ads com criativos
async function getAdsWithCreatives(adAccountId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/act_${adAccountId}/ads?` +
    `fields=id,name,status,creative{id,name,thumbnail_url,object_story_spec}` +
    `&access_token=${accessToken}`
  );
  return response.json();
}
```

### Métricas Disponíveis (70+ campos)

**Performance:**
- `impressions` - Impressões totais
- `reach` - Alcance único
- `clicks` - Cliques
- `spend` - Valor gasto
- `cpc` - Custo por clique
- `cpm` - Custo por mil impressões
- `ctr` - Taxa de cliques

**Conversões:**
- `conversions` - Conversões totais
- `cost_per_conversion` - Custo por conversão
- `conversion_rate_ranking` - Ranking de conversão

**Engajamento:**
- `actions` - Todas as ações (likes, comments, shares)
- `video_views` - Visualizações de vídeo
- `video_p25_watched_actions` - 25% assistido

---

## Parte 3: Backend - Token Exchange

```typescript
// Edge Function: meta-token-exchange
async function exchangeCodeForToken(code: string) {
  // 1. Trocar code por short-lived token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${FB_APP_ID}` +
    `&client_secret=${FB_APP_SECRET}` +
    `&code=${code}`
  );
  const { access_token } = await tokenResponse.json();

  // 2. Trocar por long-lived token (60 dias)
  const longLivedResponse = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${FB_APP_ID}` +
    `&client_secret=${FB_APP_SECRET}` +
    `&fb_exchange_token=${access_token}`
  );
  const longLivedData = await longLivedResponse.json();

  return longLivedData.access_token; // Válido por 60 dias
}
```

---

## Parte 4: Adaptação ao Marketing Existente

### 4.1 Componentes a Modificar

| Arquivo | Mudança |
|---------|---------|
| `MetaConnectionGate.tsx` | Usar Facebook SDK em vez de redirect OAuth |
| `useMetaOAuth.tsx` | Refatorar para usar `FB.login()` + `sessionInfoListener` |
| `AdPlatformsIntegration.tsx` | Já usa `MetaIntegrationCard` - manter estrutura |
| `MarketingDashboard.tsx` | Buscar dados reais via Marketing API |

### 4.2 Novos Arquivos

```
src/
├── lib/
│   └── facebookSDK.ts          # Loader do SDK com types
├── hooks/
│   ├── useMetaEmbeddedSignup.tsx   # WhatsApp Embedded Signup
│   ├── useMetaAdsAPI.tsx           # Fetch campanhas/insights
│   └── useMetaOAuth.tsx            # Refatorado (simplificado)
├── components/marketing/
│   └── MetaConnectionGate.tsx      # Atualizado com FB.login
└── supabase/functions/
    ├── meta-token-exchange/        # Novo: apenas token exchange
    └── fetch-meta-insights/        # Novo: busca insights
```

### 4.3 Fluxo de Dados Atualizado

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐                                               │
│  │ MetaConnectionGate│  (1) Usuário clica "Conectar Facebook"       │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐  (2) Abre popup Facebook com FB.login()       │
│  │ Facebook SDK     │      config_id = WhatsApp Embedded Signup     │
│  │ FB.login()       │      scope = ads_read,whatsapp_*              │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐  (3) sessionInfoListener recebe:              │
│  │ sessionInfoListener│    - waba_id, phone_number_id (WhatsApp)    │
│  │ (window.message) │     - authResponse.code (para token)          │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐  (4) Envia code para Edge Function            │
│  │ useMetaOAuth     │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  (5) Troca code por long-lived token          │
│  │ meta-token-      │                                               │
│  │ exchange         │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐  (6) Salva token + waba_id + ad_account_id    │
│  │ whatsapp_config  │      na tabela correspondente                 │
│  │ ad_platform_     │                                               │
│  │ connections      │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐  (7) Busca campanhas e insights               │
│  │ fetch-meta-      │      via Marketing API                        │
│  │ insights         │                                               │
│  └──────────────────┘                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  whatsapp_config          │  ad_platform_connections                │
│  ─────────────────────    │  ────────────────────────               │
│  - waba_id                │  - account_id (act_xxx)                 │
│  - phone_number_id        │  - platform = 'meta_ads'                │
│  - access_token           │  - api_key (access_token)               │
│  - oauth_expires_at       │  - metadata (currency, timezone)        │
│                           │                                         │
│  ad_campaigns             │  ad_campaign_insights (NOVA)            │
│  ─────────────────────    │  ────────────────────────               │
│  - external_id            │  - campaign_id                          │
│  - name, status           │  - date                                 │
│  - platform               │  - impressions, clicks, spend           │
│  - budget                 │  - reach, cpc, cpm, ctr                 │
│                           │  - conversions                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 MarketingDashboard - Dados Reais

Atualizar `useMarketingDashboard` para buscar dados reais via API:

```typescript
// hooks/useMarketingDashboard.tsx (atualizado)
export function useMarketingDashboard() {
  const { data: connections } = useAdPlatformConnections();

  return useQuery({
    queryKey: ['marketing-dashboard'],
    queryFn: async () => {
      // Buscar insights de todas as conexões Meta Ads ativas
      const metaConnections = connections?.filter(c =>
        c.platform === 'meta_ads' && c.is_active
      );

      if (!metaConnections?.length) {
        return defaultDashboardData;
      }

      // Chamar Edge Function para buscar insights agregados
      const { data } = await supabase.functions.invoke('fetch-meta-insights', {
        body: {
          account_ids: metaConnections.map(c => c.account_id),
          date_preset: 'last_30d'
        }
      });

      return {
        totalSpend: data.spend,
        totalRevenue: data.revenue,
        averageROAS: data.roas,
        totalLeads: data.leads,
        // ... etc
      };
    },
    enabled: !!connections?.length
  });
}
```

### 4.5 Nova Edge Function: fetch-meta-insights

```typescript
// supabase/functions/fetch-meta-insights/index.ts
serve(async (req) => {
  const { account_ids, date_preset } = await req.json();

  // Buscar tokens das conexões
  const { data: connections } = await supabaseAdmin
    .from('ad_platform_connections')
    .select('account_id, api_key')
    .in('account_id', account_ids);

  // Agregar insights de todas as contas
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
  const campaigns = [];

  for (const conn of connections) {
    const insights = await fetch(
      `https://graph.facebook.com/v21.0/act_${conn.account_id}/insights?` +
      `fields=spend,impressions,clicks,reach,actions` +
      `&date_preset=${date_preset}` +
      `&access_token=${conn.api_key}`
    ).then(r => r.json());

    totalSpend += parseFloat(insights.data?.[0]?.spend || 0);
    totalImpressions += parseInt(insights.data?.[0]?.impressions || 0);
    totalClicks += parseInt(insights.data?.[0]?.clicks || 0);

    // Buscar campanhas
    const campaignsData = await fetch(
      `https://graph.facebook.com/v21.0/act_${conn.account_id}/campaigns?` +
      `fields=id,name,status,insights{spend,impressions,clicks}` +
      `&access_token=${conn.api_key}`
    ).then(r => r.json());

    campaigns.push(...(campaignsData.data || []));
  }

  return new Response(JSON.stringify({
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    campaigns,
  }));
});
```

---

## Parte 5: Arquitetura Final

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  facebookSDK.ts │    │  useMetaOAuth   │                 │
│  │  (Facebook SDK) │    │  (FB.login)     │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                           │
│  ┌────────▼──────────────────────▼────────┐                 │
│  │           MetaConnectionGate            │                 │
│  │  (Bloqueia acesso até conectar)         │                 │
│  └────────┬──────────────────────┬────────┘                 │
│           │                      │                           │
│  ┌────────▼────────┐    ┌────────▼────────┐                 │
│  │ WhatsApp Module │    │   Ads Module    │                 │
│  │ - Inbox         │    │ - Dashboard     │                 │
│  │ - Chat          │    │ - Campaigns     │                 │
│  │ - Automações    │    │ - Insights      │                 │
│  └─────────────────┘    │ - Creatives     │                 │
│                         │ - Reports       │                 │
│                         └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Edge Functions                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ meta-token-     │    │ fetch-meta-     │                 │
│  │ exchange        │    │ insights        │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ whatsapp-       │    │ sync-ad-        │                 │
│  │ webhook         │    │ campaigns       │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Meta Graph API                            │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp Cloud API        │        Marketing API           │
│  - Messages                │        - Campaigns             │
│  - Templates               │        - Insights              │
│  - Phone Numbers           │        - Creatives             │
└─────────────────────────────────────────────────────────────┘
```

---

## Passos de Implementação

### Fase 1: Configuração Meta Developers (Pré-requisito)

1. [ ] Ir para [developers.facebook.com](https://developers.facebook.com)
2. [ ] No App `1557514182198067`:
   - [ ] **Facebook Login for Business** → Criar Login Configuration
   - [ ] Variação: **WhatsApp Embedded Signup**
   - [ ] Permissões: `whatsapp_business_management`, `whatsapp_business_messaging`, `ads_read`
   - [ ] Copiar **Config ID** gerado
3. [ ] Em **Marketing API**:
   - [ ] Verificar acesso a `ads_read`
   - [ ] (Opcional) Solicitar `ads_management` para edição

### Fase 2: Frontend - Facebook SDK + OAuth

4. [ ] Criar `src/lib/facebookSDK.ts` - Loader do SDK
5. [ ] Refatorar `src/hooks/useMetaOAuth.tsx`:
   - Remover lógica de redirect
   - Usar `FB.login()` com config_id
   - Implementar `sessionInfoListener`
6. [ ] Atualizar `src/components/marketing/MetaConnectionGate.tsx`:
   - Carregar Facebook SDK
   - Usar novo hook de OAuth

### Fase 3: Backend - Edge Functions

7. [ ] Simplificar `meta-oauth-callback` → renomear para `meta-token-exchange`
   - Apenas fazer exchange code → access_token
   - Remover lógica de busca de assets (vem do frontend)
8. [ ] Criar `fetch-meta-insights` Edge Function
   - Buscar insights agregados de campanhas
   - Suportar múltiplas contas
9. [ ] Atualizar `sync-ad-campaigns` Edge Function
   - Usar token do `ad_platform_connections`
   - Buscar campanhas com criativos

### Fase 4: Dashboard com Dados Reais

10. [ ] Atualizar `useMarketingDashboard.tsx`:
    - Buscar dados reais via `fetch-meta-insights`
    - Calcular métricas (ROAS, CPA, CTR)
11. [ ] Atualizar `MarketingDashboard.tsx`:
    - Remover dados mockados
    - Exibir gráficos com dados reais
12. [ ] Criar nova tabela `ad_campaign_insights` para cache

### Fase 5: Funcionalidades Avançadas

13. [ ] Visualização de criativos (imagens/vídeos)
14. [ ] Relatórios exportáveis (PDF/CSV)
15. [ ] Alertas automáticos (ROAS baixo, sem conversões)

---

## Rate Limits

**Marketing API:**
- Fórmula: `60 + 400 × Active_Ads - 0.001 × User_Errors` por hora
- Insights pesados contam mais no limite
- Recomendado: date ranges menores (28 dias)

---

## Referências

### WhatsApp
- [Alibaba Cloud - Implement Embedded Signup](https://www.alibabacloud.com/help/en/chatapp/use-cases/implement-embedded-signup)
- [YCloud - Embedded Signup](https://helpdocs.ycloud.com/partner-center/english-en-2/ji-shu-kai-fa-huo-ban/embedded-signup)
- [GitHub - whatsapp-embedded-signup](https://github.com/Gaurang200/whatsapp-embedded-signup)

### Ads API
- [Meta Ads API Complete Guide](https://admanage.ai/blog/meta-ads-api)
- [Facebook Ads API Guide A-Z](https://blog.coupler.io/facebook-ads-api/)
- [Facebook Ads Reporting API Guide](https://magicbrief.com/post/comprehensive-guide-to-the-facebook-ads-reporting-api)
- [Facebook Node.js Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk)
