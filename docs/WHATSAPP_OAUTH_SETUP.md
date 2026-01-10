# Configuração do OAuth do WhatsApp/Facebook

Este documento explica como configurar a integração OAuth para permitir que usuários conectem suas contas do WhatsApp Business com poucos cliques.

## Pré-requisitos

1. Conta no [Meta Business Suite](https://business.facebook.com)
2. App no [Meta Developers](https://developers.facebook.com/apps)

---

## 1. Criar App no Meta Developers

1. Acesse https://developers.facebook.com/apps
2. Clique em **"Criar aplicativo"**
3. Selecione tipo: **"Business"**
4. Preencha:
   - Nome: `DashMedPro` (ou nome do seu CRM)
   - Email de contato
   - Conta Business: selecione sua conta

---

## 2. Adicionar Produto WhatsApp

1. No painel do app, vá em **"Adicionar produto"**
2. Selecione **"WhatsApp"**
3. Clique em **"Configurar"**

---

## 3. Configurar Facebook Login

1. Vá em **"Adicionar produto"** > **"Facebook Login"**
2. Em **Configurações do Facebook Login**, adicione:

**URIs de Redirecionamento OAuth Válidos:**
```
https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-oauth-callback
```

**Configurações:**
- ✅ Login do cliente OAuth: Ativado
- ✅ Login do OAuth da Web: Ativado
- ✅ Substituir HTTPS: Ativado (para desenvolvimento)

---

## 4. Obter Credenciais

Em **Configurações > Básico**, copie:

| Campo | Descrição |
|-------|-----------|
| **App ID** | Identificador do app |
| **App Secret** | Chave secreta (clique para mostrar) |

---

## 5. Configurar Variáveis de Ambiente

### No Supabase (Edge Functions Secrets)

```bash
supabase secrets set FB_APP_ID="seu_app_id"
supabase secrets set FB_APP_SECRET="seu_app_secret"
supabase secrets set FB_OAUTH_REDIRECT_URI="https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-oauth-callback"
supabase secrets set FRONTEND_URL="https://seu-app.vercel.app"
```

Ou via Dashboard do Supabase:
1. Vá em **Project Settings > Edge Functions**
2. Adicione cada secret

### No Frontend (.env)

```env
VITE_FB_APP_ID=seu_app_id
```

---

## 6. Solicitar Permissões Avançadas (Para Produção)

Para que usuários fora da sua equipe possam usar, solicite aprovação:

1. Vá em **App Review > Permissions and Features**
2. Solicite:
   - `whatsapp_business_management` - Ler WABAs e números
   - `whatsapp_business_messaging` - Enviar/receber mensagens
   - `business_management` - Listar negócios do usuário

**Documentos necessários:**
- Política de Privacidade (URL)
- Termos de Serviço (URL)
- Vídeo demonstrando o uso

---

## 7. Deploy da Edge Function

```bash
supabase functions deploy whatsapp-oauth-callback
```

---

## 8. Executar Migration

```bash
supabase db push
```

Ou aplique manualmente:
```sql
-- Ver arquivo: supabase/migrations/20260110000001_whatsapp_oauth_sessions.sql
```

---

## Fluxo do Usuário

1. Usuário acessa `/whatsapp/settings`
2. Clica em **"Conectar com Facebook"**
3. É redirecionado para Facebook
4. Autoriza o app
5. Retorna para DashMedPro
6. Seleciona qual número usar
7. **Pronto!** WhatsApp conectado

---

## Troubleshooting

### Erro: "Configuração OAuth incompleta"
- Verifique se `FB_APP_ID` e `FB_APP_SECRET` estão configurados no Supabase

### Erro: "Parâmetros inválidos"
- O state (user_id) não foi passado corretamente
- Verifique se o usuário está logado

### Erro: "Falha ao obter token"
- App Secret incorreto
- Redirect URI não cadastrado no Meta

### Nenhum número encontrado
- Usuário não tem acesso a nenhum WhatsApp Business
- Verifique permissões no Meta Business Suite

---

## Renovação de Token

O token do Facebook expira em ~60 dias. Implemente um cron job para:

1. Verificar `oauth_expires_at` na tabela `whatsapp_config`
2. Se < 7 dias para expirar, notificar usuário
3. Usuário reconecta via OAuth

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/whatsapp-oauth-callback/index.ts` | Edge Function do callback |
| `src/hooks/useWhatsAppOAuth.tsx` | Hook para gerenciar fluxo |
| `src/components/whatsapp/settings/FacebookConnectButton.tsx` | Botão de conexão |
| `src/components/whatsapp/settings/PhoneNumberSelector.tsx` | Seletor de número |
| `src/pages/WhatsAppSettings.tsx` | Página atualizada |
| `supabase/migrations/20260110000001_whatsapp_oauth_sessions.sql` | Migration |
