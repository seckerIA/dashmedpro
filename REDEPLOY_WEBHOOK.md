# 🔄 Re-deploy do Webhook WhatsApp

## Problema Identificado
O Edge Function `whatsapp-webhook` está exigindo autenticação JWT, mas o Meta WhatsApp **não envia headers de autenticação**.

## Solução
Adicionada configuração `verify_jwt = false` no `supabase/config.toml` para permitir acesso público ao webhook.

## Como Re-deployar

### **Via Supabase CLI (Recomendado):**

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link ao projeto
supabase link --project-ref adzaqkduxnpckbcuqpmg

# 4. Deploy do webhook com nova configuração
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

### **Via Dashboard Supabase (Alternativa):**

1. Acesse: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions

2. Clique em `whatsapp-webhook`

3. Na aba **Settings** ou **Configuration**, procure por:
   - **JWT Verification** ou **Require Auth**
   - **Desabilite** essa opção

4. Salve as alterações

## Verificação

Após re-deploy, teste com cURL:

```bash
curl -X POST https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

**Response esperado:** `OK` (status 200) ao invés de 401

## Configuração Final no Meta Business

Após re-deploy bem-sucedido:

**Callback URL:**
```
https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook
```

**Verify Token:**
```
bc9906a9-504c-4a8e-9fcf-539cf01301fd
```

**Subscription Fields:**
- ✅ messages
- ✅ message_status
