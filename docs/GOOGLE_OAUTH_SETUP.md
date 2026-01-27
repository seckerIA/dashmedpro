# 🔐 Configuração do Google OAuth - DashMedPro

Este guia detalha como configurar a autenticação via Google no DashMedPro.

---

## 📋 Pré-requisitos

- Conta Google (para acessar o Google Cloud Console)
- Acesso ao Supabase Dashboard do projeto
- Projeto DashMedPro deployado (ou rodando em localhost)

---

## 🚀 Passo 1: Configurar Google Cloud Console

### 1.1 Criar/Selecionar Projeto

1. Acesse: https://console.cloud.google.com/
2. No topo da página, clique no seletor de projetos
3. **Opção A**: Criar novo projeto
   - Clique em "Novo Projeto"
   - Nome: `DashMedPro` (ou outro nome)
   - Organização: Sua organização (se aplicável)
   - Clique em "Criar"
4. **Opção B**: Usar projeto existente
   - Selecione o projeto na lista

### 1.2 Ativar Google+ API (se necessário)

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**
2. Pesquise por "Google+ API"
3. Se não estiver habilitada, clique em "Ativar"

### 1.3 Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar Credenciais** → **ID do cliente OAuth**
3. **Tela de consentimento OAuth** (se for a primeira vez):
   - Clique em "Configurar tela de consentimento"
   - Tipo de usuário: **Externo** (permite qualquer email do Google)
   - Clique em "Criar"
   - Preencha:
     - **Nome do app**: DashMedPro
     - **E-mail de suporte do usuário**: Seu email
     - **Logo do app**: (opcional) Upload do logo
     - **Domínios autorizados**: (deixe vazio por enquanto)
     - **E-mail do desenvolvedor**: Seu email
   - Clique em "Salvar e continuar"
   - **Escopos**: Clique em "Adicionar ou remover escopos"
     - Selecione: `.../auth/userinfo.email` e `.../auth/userinfo.profile`
     - Clique em "Atualizar"
   - Clique em "Salvar e continuar"
   - **Usuários de teste** (opcional): Adicione emails de teste se estiver em modo "Testing"
   - Clique em "Salvar e continuar"
   - Revise e clique em "Voltar ao painel"

4. Volte para **Credenciais** > **+ Criar Credenciais** > **ID do cliente OAuth**
5. Tipo de aplicativo: **Aplicativo da Web**
6. Nome: `DashMedPro Web Client`
7. **URIs de redirecionamento autorizados**:
   ```
   https://adzaqkduxnpckbcuqpmg.supabase.co/auth/v1/callback
   ```

   **Para desenvolvimento local**, adicione também:
   ```
   http://localhost:8080/auth/callback
   ```

8. Clique em **Criar**

### 1.4 Copiar Credenciais

Após criar, você verá um modal com:
- **ID do cliente**: `123456789-abc123def456.apps.googleusercontent.com`
- **Chave secreta do cliente**: `GOCSPX-aBcD1234eFgH5678iJkL`

⚠️ **IMPORTANTE**: Anote essas credenciais em local seguro. Você precisará delas no próximo passo.

---

## 🔧 Passo 2: Configurar Supabase Dashboard

### 2.1 Acessar Painel de Autenticação

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto **DashMedPro** (ref: `adzaqkduxnpckbcuqpmg`)
3. No menu lateral, vá em **Authentication** > **Providers**

### 2.2 Habilitar Google Provider

1. Na lista de providers, encontre **Google**
2. Clique no switch para **habilitar**
3. Preencha os campos:
   - **Client ID**: Cole o ID copiado do Google Cloud Console
   - **Client Secret**: Cole a chave secreta copiada
4. **Redirect URL** (já preenchido automaticamente):
   ```
   https://adzaqkduxnpckbcuqpmg.supabase.co/auth/v1/callback
   ```
   ✅ Este é o mesmo URL que você adicionou no Google Cloud Console

5. **Skip nonce check**: Deixe **desmarcado** (padrão)
6. Clique em **Save**

---

## 🗄️ Passo 3: Aplicar Migration do Trigger

A migration já está criada em:
```
supabase/migrations/20260126000000_create_profile_on_signup_trigger.sql
```

### 3.1 Aplicar via Supabase CLI (Recomendado)

```bash
# Logar no Supabase CLI
npx supabase login

# Linkar projeto
npx supabase link --project-ref adzaqkduxnpckbcuqpmg

# Aplicar migration
npx supabase db push
```

### 3.2 Aplicar Manualmente (Alternativa)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo do arquivo `20260126000000_create_profile_on_signup_trigger.sql`
4. Clique em **Run** (canto inferior direito)
5. Verifique se a mensagem de sucesso aparece

---

## ✅ Passo 4: Testar a Autenticação

### 4.1 Testar Login

1. Acesse a página de login do DashMedPro:
   - **Produção**: `https://seudominio.com/login`
   - **Desenvolvimento**: `http://localhost:8080/login`

2. Clique no botão **"Entrar com Google"**

3. Você será redirecionado para a tela de consentimento do Google

4. Selecione uma conta Google **que já esteja cadastrada no sistema**
   - ⚠️ **IMPORTANTE**: Modo "Apenas Login" está ativo. Novos emails serão **bloqueados**.

5. Autorize o aplicativo

6. Você será redirecionado para `/auth/callback`

7. Se tudo estiver correto:
   - ✅ **Usuário existente**: Redirecionado para o dashboard (`/`)
   - ❌ **Novo usuário**: Mensagem de erro "Acesso negado. Seu email não está cadastrado no sistema."

### 4.2 Verificar Logs

No console do navegador (F12), você verá logs detalhados:

```
🔐 [Login] Iniciando Google OAuth. Redirect URL: http://localhost:8080/auth/callback
🔐 [AuthCallback] Processando callback OAuth...
✅ [AuthCallback] Sessão criada: user@example.com
✅ [AuthCallback] Perfil existente encontrado: user@example.com
```

---

## 🔐 Passo 5: Configurar Whitelist (Opcional)

Se você deseja permitir **novos usuários via Google** sem precisar cadastrá-los manualmente antes, edite o arquivo:

```typescript
// src/pages/AuthCallback.tsx

// Lista de emails permitidos (whitelisted)
const ALLOWED_EMAILS: string[] = [
  'admin@example.com',
  'doctor@example.com',
  // Adicione mais emails conforme necessário
];

// Lista de domínios permitidos (ex: '@seudominio.com')
const ALLOWED_DOMAINS: string[] = [
  '@seudominio.com.br',
  // Qualquer email com esse domínio será aceito
];
```

**Exemplo**:
- Se adicionar `'joao@gmail.com'` em `ALLOWED_EMAILS`, João poderá fazer login mesmo sendo novo usuário.
- Se adicionar `'@clinicamedica.com.br'` em `ALLOWED_DOMAINS`, qualquer email `@clinicamedica.com.br` será aceito.

---

## 🛠️ Troubleshooting

### Erro: "Redirect URI mismatch"

**Causa**: A URL de callback no código não corresponde à configurada no Google Cloud Console.

**Solução**:
1. Verifique se a URL em **Google Cloud Console** > **Credenciais** está exatamente:
   ```
   https://adzaqkduxnpckbcuqpmg.supabase.co/auth/v1/callback
   ```
2. No Supabase Dashboard, verifique se o **Redirect URL** está correto.

### Erro: "Acesso negado. Seu email não está cadastrado no sistema."

**Causa**: Modo "Apenas Login" está ativo e o email não existe na tabela `profiles`.

**Solução**:
1. **Opção A**: Cadastrar o usuário manualmente antes:
   - Vá em **Supabase Dashboard** > **Authentication** > **Users**
   - Clique em "Invite user" e adicione o email

2. **Opção B**: Adicionar email à whitelist (ver Passo 5)

### Erro: "Perfil não encontrado após callback"

**Causa**: Trigger não foi criado ou falhou.

**Solução**:
1. Verifique se a migration foi aplicada:
   ```bash
   npx supabase db diff
   ```
2. Verifique se a função existe:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user_signup';
   ```
3. Reaplique a migration (ver Passo 3)

### Erro: "Email not confirmed"

**Causa**: Usuário criado via email/senha mas não confirmou o email.

**Solução**:
- Google OAuth **não requer confirmação de email** (o Google já validou)
- Se o erro persiste, verifique se o usuário não foi criado anteriormente via email/senha

---

## 📚 Recursos Adicionais

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## 📝 Checklist de Configuração

- [ ] Projeto criado no Google Cloud Console
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] URIs de redirecionamento adicionados no Google
- [ ] Client ID e Secret configurados no Supabase Dashboard
- [ ] Migration do trigger aplicada
- [ ] Teste de login com usuário existente bem-sucedido
- [ ] Teste de bloqueio de novo usuário bem-sucedido (se aplicável)

---

**Versão**: 1.0.0
**Data**: 26/01/2026
**Autor**: DashMedPro Team
