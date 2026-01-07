# Deploy da Edge Function: whatsapp-config-validate

## Problema
A Edge Function `whatsapp-config-validate` não está deployada no Supabase, causando erro CORS ao tentar validar credenciais do WhatsApp.

## Solução: Deploy Manual via Dashboard

### Passo 1: Acessar o Dashboard
1. Acesse: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions
2. Faça login se necessário

### Passo 2: Criar/Atualizar a Função
1. Clique em **"Create a new function"** (ou edite se já existir)
2. Nome da função: `whatsapp-config-validate`
3. Cole o código do arquivo: `supabase/functions/whatsapp-config-validate/index.ts`

### Passo 3: Deploy
1. Clique em **"Deploy function"**
2. Aguarde o deploy completar (pode levar 1-2 minutos)

### Passo 4: Verificar
1. A função deve aparecer na lista como "Deployed"
2. Status deve estar verde
3. URL será: `https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-config-validate`

## Variáveis de Ambiente

As seguintes variáveis são auto-configuradas pelo Supabase:
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

Não é necessário configurar manualmente.

## Teste Após Deploy

Execute o seguinte comando para testar a função:

```bash
curl -i -X POST "https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-config-validate" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number_id": "123456789",
    "access_token": "EAAtest"
  }'
```

Você deve receber:
- **Sucesso**: HTTP 200 com dados de configuração
- **Erro de credenciais inválidas**: HTTP 400 com mensagem de erro da Meta API
- **CORS OK**: Não deve ter erro de CORS

## Alternativa: Deploy via CLI (se resolver autenticação)

```bash
# Login no Supabase
npx supabase login

# Link ao projeto
npx supabase link --project-ref adzaqkduxnpckbcuqpmg

# Deploy da função
npx supabase functions deploy whatsapp-config-validate
```

## Código da Função

O código completo está em:
- `supabase/functions/whatsapp-config-validate/index.ts`

**IMPORTANTE**: A função já foi corrigida para usar os nomes corretos do Vault:
- ✅ `create_secret` (ao invés de `vault_create_secret`)
- ✅ `update_secret` (ao invés de `vault_delete_secret` + `vault_create_secret`)
