

# Corrigir Fluxo de Login WhatsApp: Mostrar Business Manager em vez de Páginas

## Problema

Quando o usuario clica no botao de conexao WhatsApp, o `FB.login()` esta sendo chamado com scopes genericos de Meta Ads (`pages_show_list`, `pages_read_engagement`, etc.), sem ativar o fluxo de **WhatsApp Embedded Signup**. Por isso o Facebook mostra a tela de selecao de Paginas ao inves de mostrar as contas WhatsApp Business (WABA).

## Causa Raiz

No hook `useMetaOAuth.tsx`, o `FB.login()` e chamado assim:

```text
FB.login(callback, {
  scope: 'ads_management,business_management,pages_show_list,...',
  response_type: 'code',
  override_default_response_type: true,
})
```

Faltam dois parametros criticos para o fluxo WhatsApp Embedded Signup:
1. **`config_id`** - O Configuration ID do Facebook Login for Business (ja existe como `VITE_FB_CONFIG_ID = '791657633947469'`)
2. **`extras.feature = 'whatsapp_embedded_signup'`** - Flag que ativa o fluxo de selecao de WhatsApp Business Account

## Solucao

### 1. Atualizar `useMetaOAuth.tsx` - Adicionar suporte a dois fluxos

O hook precisa ter dois modos de login:

- **Fluxo WhatsApp**: Usa `config_id` + `extras.feature = 'whatsapp_embedded_signup'` para mostrar selecao de WABA/numero
- **Fluxo Meta Ads**: Mantem o fluxo atual com scopes para ads_management

Mudancas no arquivo:

```text
// Adicionar constantes
const FB_CONFIG_ID = '791657633947469';

// Adicionar scopes de WhatsApp
const WHATSAPP_SCOPES = [
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'business_management',
].join(',');

// Nova funcao: startWhatsAppOAuthFlow
// Usa FB.login com:
{
  config_id: FB_CONFIG_ID,
  response_type: 'code',
  override_default_response_type: true,
  extras: {
    feature: 'whatsapp_embedded_signup',
    version: 2,
  }
}
```

### 2. Atualizar `FacebookConnectButton.tsx`

- Importar e usar `startWhatsAppOAuthFlow` ao inves de `startOAuthFlow` generico
- O botao de conexao WhatsApp deve chamar especificamente o fluxo de Embedded Signup

### 3. Exportar a nova funcao do hook

Adicionar `startWhatsAppOAuthFlow` ao return do hook para que os componentes de WhatsApp possam usa-lo separadamente do fluxo de Meta Ads.

## Resultado Esperado

Ao clicar no botao de conexao WhatsApp, o usuario vera:
- Tela de login Facebook
- Selecao de Business Manager
- Selecao/criacao de WhatsApp Business Account
- Selecao de numero de telefone

Em vez de ver a selecao de Paginas do Facebook.

## Detalhes Tecnicos

- **Arquivos modificados:** `src/hooks/useMetaOAuth.tsx`, `src/components/whatsapp/settings/FacebookConnectButton.tsx`
- **Referencia:** Documentacao oficial Meta "WhatsApp Embedded Signup" - o `config_id` e obtido em Facebook Login for Business > Configurations no Meta Developer Dashboard
- **Os erros de build existentes** (FollowUps, CRM types, Inventory, etc.) nao serao tratados neste plano pois sao independentes desta correcao

