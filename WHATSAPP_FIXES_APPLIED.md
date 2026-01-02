# 🔧 Correções Aplicadas ao WhatsApp

## ✅ **Problemas Corrigidos:**

### 1. **Erro 400 em `useWhatsAppMessages`**
**Arquivo:** `src/hooks/useWhatsAppMessages.tsx`

**Problema:** Query tentava fazer join com `reply_to` usando FK auto-referencial com sintaxe incorreta

**Solução:**
```typescript
// ANTES (linha 47):
reply_to:whatsapp_messages!whatsapp_messages_reply_to_message_id_fkey(id, content, message_type, direction)

// DEPOIS:
// Removido - join auto-referencial causa erro 400
```

### 2. **Erro 400 em `useWhatsAppNotes`**
**Arquivo:** `src/hooks/useWhatsAppNotes.tsx`

**Problema:** Query tentava fazer join com `profiles` mas FK aponta para `auth.users`

**Solução:**
```typescript
// ANTES (linhas 35-38):
.select(`
  *,
  user:profiles!whatsapp_internal_notes_user_id_fkey(id, full_name, email, avatar_url)
`)

// DEPOIS (linhas 35-37):
.select('*')
```

Aplicado em 2 lugares:
- Linha 35: Query de listagem
- Linha 64: Mutation de criação

### 3. **Botão de Configurações Ausente**
**Arquivo:** `src/components/whatsapp/inbox/ConversationFilters.tsx`

**Problema:** Após conectar WhatsApp, não havia como voltar às configurações

**Solução:**
```tsx
// Adicionado header com botão (linhas 124-135):
<div className="flex items-center justify-between">
  <h2 className="text-lg font-semibold">Conversas</h2>
  <Button
    variant="ghost"
    size="icon"
    onClick={() => navigate('/whatsapp/settings')}
    title="Configurações do WhatsApp"
  >
    <Settings className="h-4 w-4" />
  </Button>
</div>
```

### 4. **Edge Function `whatsapp-send-message` Criada**
**Arquivo:** `supabase/functions/whatsapp-send-message/index.ts` (NOVO)

**Problema:** Função não existia, impedindo envio de mensagens

**Solução:** Criada função completa com:
- Autenticação do usuário
- Busca de access_token do Vault
- Chamada à Meta Graph API
- Atualização de status da mensagem
- Error handling completo

### 5. **Configuração JWT do Webhook**
**Arquivo:** `supabase/config.toml`

**Problema:** Webhook exigia JWT mas Meta não envia autenticação

**Solução:**
```toml
[functions.whatsapp-webhook]
verify_jwt = false
```

### 6. **Logs de Debug Adicionados**
**Arquivo:** `src/hooks/useWhatsAppMessages.tsx`

**Adicionados logs** (linhas 79-80, 89, 92):
```typescript
console.log('[sendText] User ID:', user.id);
console.log('[sendText] Conversation ID:', payload.conversation_id);
console.log('[sendText] Query result:', { conversation, error: convError });
console.error('[sendText] Conversation not found. Error:', convError);
```

---

## ⚠️ **Problema Atual: "Conversa não encontrada"**

### **Causa Raiz:**
A query para buscar a conversa está falhando devido a **RLS (Row Level Security)**.

### **RLS Policy Atual:**
```sql
-- Acesso permitido SE:
auth.uid() = user_id -- Você é o dono
OR
auth.uid() = assigned_to -- Você está atribuído
OR
EXISTS (SELECT 1 FROM secretary_doctor_links WHERE secretary_id = auth.uid() AND doctor_id = whatsapp_conversations.user_id) -- Você é secretária do médico
```

### **Situação Atual:**
- **Conversa criada por:** `user_id = 49704dd5-01ab-4cfe-8854-07799641a1f0` (secretaria.teste@dashmedpro.com)
- **Usuário logado:** Provavelmente DIFERENTE do acima
- **Resultado:** RLS bloqueia o acesso → "Conversa não encontrada"

### **Como Verificar:**
1. Recarregue a página (F5)
2. Abra o Console do navegador (F12)
3. Tente enviar mensagem novamente
4. Veja os logs:
   ```
   [sendText] User ID: <seu-user-id>
   [sendText] Conversation ID: 472f4916-1468-4eee-a567-705c8742d42d
   [sendText] Query result: { conversation: null, error: {...} }
   ```

### **Soluções Possíveis:**

#### **Opção 1: Fazer Login com Usuário Correto**
Faça login com `secretaria.teste@dashmedpro.com` (dono da conversa)

#### **Opção 2: Atribuir Conversa ao Usuário Atual**
```sql
UPDATE whatsapp_conversations
SET assigned_to = '<seu-user-id-atual>'
WHERE id = '472f4916-1468-4eee-a567-705c8742d42d';
```

#### **Opção 3: Criar Link Secretária-Médico**
Se você é secretária, crie link:
```sql
INSERT INTO secretary_doctor_links (secretary_id, doctor_id)
VALUES ('<seu-user-id>', '49704dd5-01ab-4cfe-8854-07799641a1f0');
```

#### **Opção 4: Modificar RLS (NÃO RECOMENDADO)**
Remover verificação temporariamente (apenas para debug):
```sql
DROP POLICY whatsapp_conversations_select ON whatsapp_conversations;
CREATE POLICY whatsapp_conversations_select ON whatsapp_conversations
  FOR SELECT USING (true); -- Acesso total (TEMPORÁRIO)
```

---

## 📋 **Checklist de Verificação:**

- [x] Erro 400 corrigido em `useWhatsAppMessages`
- [x] Erro 400 corrigido em `useWhatsAppNotes`
- [x] Botão de configurações adicionado
- [x] Edge Function `whatsapp-send-message` criada
- [x] Configuração JWT do webhook
- [x] Logs de debug adicionados
- [ ] **Verificar usuário logado vs dono da conversa** ⬅️ PRÓXIMO PASSO
- [ ] Deploy das Edge Functions
- [ ] Configurar webhook no Meta Business
- [ ] Testar envio de mensagens end-to-end

---

## 🎯 **Próxima Ação:**

**Recarregue a página e veja os logs do console ao tentar enviar mensagem.**

Os logs vão mostrar:
1. ID do usuário logado
2. ID da conversa
3. Erro exato da query

Com essas informações, conseguimos identificar qual das 4 soluções aplicar.
