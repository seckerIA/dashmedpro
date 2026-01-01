# 📊 Status da Integração WhatsApp

## ✅ **Funcionando:**

### 1. **Webhook Recebendo Mensagens**
- ✅ Edge Function `whatsapp-webhook` deployada
- ✅ Mensagens sendo salvas no banco
- ✅ Conversas sendo criadas automaticamente
- ✅ Dados testados via n8n com sucesso

**Evidência:**
```sql
-- Conversa criada:
id: 472f4916-1468-4eee-a567-705c8742d42d
phone_number: 5524999409021
contact_name: Gustavo Santos

-- Mensagem salva:
id: 9fc25f0a-ea95-4c54-a7a1-56f0f9035435
content: "Teste do n8n - Olá, esta é uma mensagem de teste!"
direction: inbound
```

### 2. **Configurações**
- ✅ Validação de credenciais funcionando
- ✅ Botão de configurações adicionado no inbox
- ✅ Persistência de tokens no Vault

### 3. **Hooks Implementados**
- ✅ `useWhatsAppConfig` - Gerenciamento de configurações
- ✅ `useWhatsAppConversations` - Lista de conversas
- ✅ `useWhatsAppMessages` - Mensagens (corrigido erro 400)
- ✅ `useWhatsAppLabels` - Gerenciamento de labels
- ✅ `useWhatsAppNotes` - Notas internas

---

## ❌ **Problemas Identificados:**

### 1. **Erro 400 em useWhatsAppMessages** ✅ CORRIGIDO
**Problema:** Query tentando buscar `reply_to` com sintaxe incorreta
**Solução:** Removida referência circular problemática

**Arquivo:** `src/hooks/useWhatsAppMessages.tsx:42-50`

**Antes:**
```typescript
.select(`
  *,
  media:whatsapp_media(*),
  reply_to:whatsapp_messages!whatsapp_messages_reply_to_message_id_fkey(...)
`)
```

**Depois:**
```typescript
.select(`
  *,
  media:whatsapp_media(*)
`)
```

### 2. **Edge Function `whatsapp-send-message` Não Existe** ⚠️ CRÍTICO
**Problema:** Hook `useWhatsAppMessages` tenta invocar função que não foi criada

**Código problemático em** `src/hooks/useWhatsAppMessages.tsx:112-121`:
```typescript
const { error: sendError } = await supabase.functions.invoke('whatsapp-send-message', {
  body: {
    message_id: message.id,
    phone_number: conversation.phone_number,
    content: payload.content,
    // ...
  },
});
```

**Status:** 🔴 Função não existe no diretório `supabase/functions/`

### 3. **Webhook JWT Verification** ⚠️ CONFIGURAÇÃO NECESSÁRIA
**Problema:** Webhook retorna 401 sem re-deploy com `verify_jwt = false`

**Solução aplicada:** Adicionado em `supabase/config.toml`:
```toml
[functions.whatsapp-webhook]
verify_jwt = false
```

**Status:** 🟡 Configuração pronta, mas **REQUER RE-DEPLOY** via:
```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

Ou via Dashboard: desabilitar "Require JWT" manualmente

---

## 🔧 **Pendências Críticas:**

### **1. Criar Edge Function `whatsapp-send-message`**

**Responsabilidade:**
- Receber requisição do frontend com texto da mensagem
- Buscar access_token do Vault
- Chamar Meta Graph API para enviar mensagem
- Atualizar status da mensagem no banco
- Retornar WhatsApp message_id

**Localização:** `supabase/functions/whatsapp-send-message/index.ts`

**Estrutura esperada:**
```typescript
// Input
{
  message_id: "uuid",
  phone_number: "5524999409021",
  content: "Olá!",
  reply_to_wa_id?: "wamid.xxx"
}

// Meta API Call
POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
{
  "messaging_product": "whatsapp",
  "to": "5524999409021",
  "type": "text",
  "text": { "body": "Olá!" }
}

// Response
{
  "messages": [{
    "id": "wamid.HBgN..."
  }]
}

// Update DB
UPDATE whatsapp_messages
SET message_id = 'wamid.HBgN...',
    status = 'sent',
    delivered_at = now()
WHERE id = message_id
```

### **2. Re-deploy do Webhook com JWT Desabilitado**

**Motivo:** Meta não envia tokens JWT, webhook precisa ser público

**Como fazer:**
1. Via CLI: `supabase functions deploy whatsapp-webhook --no-verify-jwt`
2. Via Dashboard: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions/whatsapp-webhook/settings

### **3. Configurar Webhook no Meta Business**

**Após re-deploy do webhook:**

Acessar: https://developers.facebook.com/apps/1296000585673910/whatsapp-business/wa-settings/

**Dados:**
- Callback URL: `https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook`
- Verify Token: `bc9906a9-504c-4a8e-9fcf-539cf01301fd`
- Subscribe to: `messages`, `message_status`

---

## 📋 **Checklist de Implementação:**

- [x] Criar tabelas WhatsApp no banco
- [x] Aplicar RLS policies
- [x] Criar Edge Function `whatsapp-webhook`
- [x] Criar Edge Function `whatsapp-config-validate`
- [x] Implementar hooks do frontend
- [x] Corrigir erro 400 em queries
- [x] Adicionar botão de configurações no inbox
- [x] Testar recebimento de mensagens (via n8n)
- [ ] **Criar Edge Function `whatsapp-send-message`** ⬅️ CRÍTICO
- [ ] **Re-deploy webhook com JWT desabilitado**
- [ ] **Configurar webhook no Meta Business**
- [ ] Testar envio de mensagens do frontend
- [ ] Testar labels e notas
- [ ] Testar mudança de status de conversas
- [ ] Implementar download de mídia
- [ ] Implementar templates

---

## 🎯 **Próximo Passo Imediato:**

**Criar `supabase/functions/whatsapp-send-message/index.ts`**

Esta função é BLOQUEADORA para:
- ✉️ Enviar mensagens do frontend
- 💬 Responder conversas
- 🔄 Completar fluxo bidirecional WhatsApp

**Dependências:**
- Access Token do Vault (via `whatsapp_config`)
- Phone Number ID (via `whatsapp_config`)
- Meta Graph API v18.0

---

## 📞 **Dados de Teste:**

**WhatsApp Business:**
- Phone Number ID: `994951350357570`
- Display Phone: `+55 34 93618-0063`
- WABA ID: `1382244396913500`
- App ID: `1296000585673910`

**Conversa Teste:**
- ID: `472f4916-1468-4eee-a567-705c8742d42d`
- Telefone: `5524999409021`
- Contato: `Gustavo Santos`

**Mensagem Teste Recebida:**
- ID: `9fc25f0a-ea95-4c54-a7a1-56f0f9035435`
- Conteúdo: "Teste do n8n - Olá, esta é uma mensagem de teste!"
- Direção: `inbound`
- Status: ✅ Salva no banco
