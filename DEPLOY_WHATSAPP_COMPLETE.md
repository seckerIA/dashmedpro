# 🚀 Guia Completo de Deploy - WhatsApp Integration

## ✅ **O Que Já Está Pronto:**

1. ✅ Código do webhook criado
2. ✅ Código da função de envio criado
3. ✅ Configuração JWT desabilitada
4. ✅ Hook de mensagens corrigido (erro 400 resolvido)
5. ✅ Botão de configurações adicionado
6. ✅ Teste via n8n bem-sucedido

---

## 📋 **Próximos Passos (Execute nesta ordem):**

### **1. Deploy das Edge Functions no Supabase Dashboard**

#### **A. Função `whatsapp-webhook` (receber mensagens)**

1. Acesse: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions

2. Clique em **"Create a new function"** ou edite a existente `whatsapp-webhook`

3. **Nome:** `whatsapp-webhook`

4. **Código:** Copie todo o conteúdo de:
   ```
   supabase/functions/whatsapp-webhook/index.ts
   ```

5. **IMPORTANTE:** Nas configurações da função, **DESABILITE** "Require JWT" ou "Verify JWT"

6. Clique em **Deploy**

#### **B. Função `whatsapp-send-message` (enviar mensagens)**

1. No mesmo painel, clique em **"Create a new function"**

2. **Nome:** `whatsapp-send-message`

3. **Código:** Copie todo o conteúdo de:
   ```
   supabase/functions/whatsapp-send-message/index.ts
   ```

4. Esta função **MANTÉM** JWT verificação (precisa de autenticação do usuário)

5. Clique em **Deploy**

#### **C. Função `whatsapp-config-validate` (já existe, mas verifique)**

1. Verifique se já está deployada

2. Se não estiver, crie com o conteúdo de:
   ```
   supabase/functions/whatsapp-config-validate/index.ts
   ```

---

### **2. Configurar Webhook no Meta Business**

Após o deploy do `whatsapp-webhook`:

1. Acesse: https://developers.facebook.com/apps/1296000585673910/whatsapp-business/wa-settings/

2. Na seção **Webhooks**, clique em **Configure**

3. Preencha:
   - **Callback URL:**
     ```
     https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook
     ```
   - **Verify Token:**
     ```
     bc9906a9-504c-4a8e-9fcf-539cf01301fd
     ```

4. Clique em **Verify and Save**

5. Após verificação, **Subscribe** aos campos:
   - ✅ **messages**
   - ✅ **message_status**

6. Salve

---

### **3. Testar Fluxo Completo**

#### **A. Teste de Recebimento (via n8n ou WhatsApp real)**

**Opção 1: n8n** (já testado com sucesso ✅)
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1382244396913500",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5534936180063",
              "phone_number_id": "994951350357570"
            },
            "contacts": [
              {
                "profile": { "name": "Teste" },
                "wa_id": "5524999409021"
              }
            ],
            "messages": [
              {
                "from": "5524999409021",
                "id": "wamid.TEST123",
                "timestamp": "1767302934",
                "text": { "body": "Olá!" },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Opção 2: WhatsApp Real**
- Envie uma mensagem para `+55 34 93618-0063`
- Aguarde aparecer no inbox do sistema

#### **B. Teste de Envio**

1. Acesse o sistema: http://localhost:8080
2. Vá em **WhatsApp > Conversas**
3. Selecione a conversa de teste
4. Digite uma mensagem
5. Clique em Enviar
6. Verifique se a mensagem foi enviada no WhatsApp

---

## 🔍 **Verificação de Deploy:**

### **Teste 1: Webhook Aceita Requisições Sem Auth**

```bash
curl -X POST https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

**Resposta esperada:** `OK` (status 200)
**❌ Se retornar 401:** Webhook ainda exige JWT, re-deploy necessário

### **Teste 2: Função de Envio Existe**

```bash
curl -X POST https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-send-message \
  -H "Content-Type: application/json"
```

**Resposta esperada:** `401` ou `400` (função existe, mas sem auth)
**❌ Se retornar 404:** Função não foi deployada

### **Teste 3: Verificação do Meta**

GET request (simula verificação do Meta):
```
https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=bc9906a9-504c-4a8e-9fcf-539cf01301fd&hub.challenge=TESTE_123
```

**Resposta esperada:** `TESTE_123`

---

## 📊 **Checklist Final:**

- [ ] Deploy `whatsapp-webhook` com JWT desabilitado
- [ ] Deploy `whatsapp-send-message`
- [ ] Configurar webhook no Meta Business
- [ ] Subscribe aos campos `messages` e `message_status`
- [ ] Testar recebimento de mensagem (n8n ou WhatsApp real)
- [ ] Testar envio de mensagem pelo sistema
- [ ] Verificar logs no Supabase Dashboard
- [ ] Confirmar mensagens aparecendo no inbox

---

## 🐛 **Troubleshooting:**

### **Problema: Webhook retorna 401**
**Solução:** JWT não foi desabilitado. Vá nas configurações da função e desabilite "Require JWT"

### **Problema: Mensagens não aparecem no inbox**
**Possíveis causas:**
1. User ID do config não corresponde ao user logado
2. RLS policies bloqueando
3. Query com erro (já corrigida)

**Verificar:**
```sql
SELECT * FROM whatsapp_conversations WHERE phone_number = '5524999409021';
SELECT * FROM whatsapp_messages WHERE conversation_id = 'xxx';
```

### **Problema: Não consegue enviar mensagens**
**Possíveis causas:**
1. Access token expirado (renovar nas configurações)
2. Função `whatsapp-send-message` não deployada
3. Token não está no Vault

**Verificar logs:**
https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions/whatsapp-send-message/logs

---

## 📱 **Dados de Referência:**

**WhatsApp Business:**
- Phone Number ID: `994951350357570`
- Display Phone: `+55 34 93618-0063`
- WABA ID: `1382244396913500`
- App ID: `1296000585673910`

**Webhook:**
- URL: `https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook`
- Verify Token: `bc9906a9-504c-4a8e-9fcf-539cf01301fd`

**Conversa Teste:**
- Telefone: `5524999409021`
- Nome: `Gustavo Santos`

---

## 🎯 **Resultado Final Esperado:**

1. ✅ Mensagens recebidas no WhatsApp aparecem no inbox do sistema
2. ✅ Mensagens enviadas pelo sistema chegam no WhatsApp do cliente
3. ✅ Status das mensagens atualizam automaticamente (enviado, entregue, lido)
4. ✅ Labels e notas funcionam
5. ✅ Conversas podem ser atribuídas e mudadas de status

**Pronto! Sistema WhatsApp totalmente funcional! 🎉**
