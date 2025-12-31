# Como Configurar o Webhook do WhatsApp Business

## Por que não aparecem conversas?

Atualmente, **não há conversas no banco de dados** porque:
- O webhook do WhatsApp não está configurado no Meta Business
- Quando alguém envia mensagem no WhatsApp, o Meta precisa enviar para o seu sistema
- Isso é feito via webhook (Edge Function)

## Passo a Passo

### 1️⃣ Deploy da Edge Function `whatsapp-webhook`

Esta função recebe as mensagens do WhatsApp e salva no banco.

**Via Dashboard do Supabase:**

1. Acesse: https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg/functions
2. Clique em **"Create a new function"**
3. Nome: `whatsapp-webhook`
4. Cole o código de: `supabase/functions/whatsapp-webhook/index.ts`
5. Clique em **"Deploy function"**

**Ou via CLI (se conseguir autenticar):**
```bash
npx supabase functions deploy whatsapp-webhook --project-ref adzaqkduxnpckbcuqpmg
```

### 2️⃣ Obter URL do Webhook e Verify Token

Após configurar as credenciais na tela de configurações do WhatsApp, você recebe:

- **Webhook URL**: `https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook`
- **Verify Token**: Um UUID gerado automaticamente (você verá isso após validar credenciais)

### 3️⃣ Configurar Webhook no Meta Business

1. **Acesse Meta Developers:**
   - https://developers.facebook.com/apps
   - Selecione seu App
   - WhatsApp > Configuration

2. **Configure o Webhook:**
   - Clique em **"Edit"** na seção Webhook
   - **Callback URL**: Cole a URL do webhook acima
   - **Verify Token**: Cole o token que você recebeu ao configurar credenciais
   - Clique em **"Verify and Save"**

3. **Inscrever-se em Eventos:**
   - Na mesma tela, clique em **"Manage"** em Webhook fields
   - Marque as opções:
     - ✅ `messages` (para receber mensagens)
     - ✅ `message_status` (para status de entrega/leitura)
   - Clique em **"Save"**

### 4️⃣ Testar

Depois de configurado:

1. Envie uma mensagem de teste para o número do WhatsApp Business
2. Aguarde alguns segundos
3. Recarregue a página do Inbox no DashMedPro
4. A conversa deve aparecer! 🎉

## Credenciais Necessárias

Você mencionou que tem:
- ✅ **Access Token** (configurado)
- ✅ **Phone Number ID** (configurado)
- ℹ️ **App ID** (opcional, mas pode ser útil)
- ℹ️ **App Secret** (opcional)
- ℹ️ **Business Account ID** (opcional)

Os campos opcionais podem ser preenchidos nas configurações para tracking adicional.

## Troubleshooting

### Webhook não valida?
- Verifique se a Edge Function foi deployada com sucesso
- Confirme que o Verify Token está correto
- Teste a URL do webhook diretamente: `GET https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345`
  - Deve retornar `12345`

### Mensagens não chegam?
- Verifique se inscreveu nos eventos `messages` e `message_status`
- Confira os logs da Edge Function no Dashboard do Supabase
- Certifique-se de que o WhatsApp Business está ativo

### Como ver os logs?
1. Supabase Dashboard > Edge Functions > whatsapp-webhook
2. Aba "Logs"
3. Envie uma mensagem de teste
4. Veja se há erros nos logs

## Estrutura do Fluxo

```
WhatsApp (usuário envia msg)
    ↓
Meta WhatsApp Business API
    ↓
Webhook (POST para sua Edge Function)
    ↓
whatsapp-webhook (processa mensagem)
    ↓
Salva em whatsapp_conversations + whatsapp_messages
    ↓
Interface atualiza automaticamente (realtime ou refetch)
    ↓
Conversa aparece no Inbox! 🎉
```

## Próximos Passos

1. ✅ Deploy `whatsapp-webhook` Edge Function
2. ✅ Configurar webhook no Meta Business
3. ✅ Testar enviando mensagem
4. ✅ Verificar se aparece no Inbox

---

**Dica:** Mantenha a página de logs da Edge Function aberta enquanto testa para ver o que está acontecendo em tempo real!
