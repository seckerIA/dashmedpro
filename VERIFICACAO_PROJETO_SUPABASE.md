# 🔒 Sistema de Validação do Projeto Supabase

Este documento explica o sistema de validação implementado para garantir que **TODAS** as requisições vão para o projeto Supabase correto.

## ✅ O que foi implementado

### 1. **Validação no Cliente Supabase** (`src/integrations/supabase/client.ts`)
- ✅ Validação rigorosa que **lança erro** se o Project Ref ou URL estiverem incorretos
- ✅ Limpeza automática de sessões antigas ao inicializar
- ✅ Validação de JWT para verificar se o token é do projeto correto
- ✅ Storage key específica do projeto para evitar conflitos

### 2. **Sistema de Validação** (`src/integrations/supabase/validator.ts`)
- ✅ Funções para validar configuração do projeto
- ✅ Validação de sessões para garantir que são do projeto correto
- ✅ Interceptor para validar antes de operações críticas
- ✅ Hook React para validação em componentes

### 3. **Componente de Validação** (`src/components/SupabaseProjectValidator.tsx`)
- ✅ Valida o projeto na inicialização da aplicação
- ✅ Mostra alertas se houver problemas
- ✅ Bloqueia a aplicação se houver erros críticos

### 4. **Script de Verificação** (`scripts/verify-supabase-config.js`)
- ✅ Escaneia todos os arquivos do projeto
- ✅ Verifica referências a projetos antigos
- ✅ Valida URLs e Project Refs hardcoded

## 🚀 Como usar

### Verificar configuração manualmente

Execute o script de verificação:

```bash
npm run verify:supabase
```

Este script irá:
- ✅ Verificar todos os arquivos do projeto
- ✅ Procurar referências a projetos antigos
- ✅ Validar URLs e Project Refs
- ✅ Reportar erros e avisos

### Validação automática na aplicação

A validação acontece automaticamente quando a aplicação inicia:

1. **Na inicialização do cliente Supabase** - Valida URL e Project Ref
2. **No componente `SupabaseProjectValidator`** - Valida configuração e sessão
3. **No hook `useAuth`** - Valida sessão ao verificar autenticação

## 🔍 Como verificar se está usando o projeto correto

### 1. Verificar no Console do Navegador

Ao abrir a aplicação, você verá logs como:

```
✅ Cliente Supabase inicializado para projeto: adzaqkduxnpckbcuqpmg
✅ URL: https://adzaqkduxnpckbcuqpmg.supabase.co
✅ Supabase Client Configurado:
   URL: https://adzaqkduxnpckbcuqpmg.supabase.co
   Project Ref: adzaqkduxnpckbcuqpmg
   Storage Key: sb-adzaqkduxnpckbcuqpmg-auth-token
```

### 2. Verificar no Network Tab

Abra o DevTools (F12) > Network e verifique:

- Todas as requisições devem ir para: `https://adzaqkduxnpckbcuqpmg.supabase.co`
- Headers devem conter: `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (com `ref: adzaqkduxnpckbcuqpmg` no JWT)

### 3. Verificar JWT Token

No console, você pode verificar o JWT decodificado:

```javascript
// No console do navegador
const session = await supabase.auth.getSession();
if (session.data.session) {
  const payload = JSON.parse(atob(session.data.session.access_token.split('.')[1]));
  console.log('JWT Issuer:', payload.iss);
  // Deve conter: adzaqkduxnpckbcuqpmg
}
```

## ⚠️ O que acontece se detectar problema

### Erros Críticos

Se o sistema detectar que está usando o projeto errado:

1. **No `client.ts`**: A aplicação **não inicia** (throw Error)
2. **No `SupabaseProjectValidator`**: Mostra tela de erro bloqueando a aplicação
3. **No `useAuth`**: Limpa sessão inválida automaticamente

### Avisos

Avisos não bloqueiam a aplicação, mas são logados no console:
- Sessões antigas encontradas no localStorage
- Chaves de outros projetos no storage

## 📋 Checklist de Verificação

Antes de criar dados importantes, verifique:

- [ ] Console mostra: `✅ Cliente Supabase inicializado para projeto: adzaqkduxnpckbcuqpmg`
- [ ] Network tab mostra requisições para: `adzaqkduxnpckbcuqpmg.supabase.co`
- [ ] JWT token contém `adzaqkduxnpckbcuqpmg` no issuer
- [ ] Script `npm run verify:supabase` não reporta erros
- [ ] Não há alertas de validação na tela

## 🔧 Solução de Problemas

### Problema: "Sessão é de outro projeto"

**Solução:**
1. Limpar localStorage: `localStorage.clear()`
2. Limpar sessionStorage: `sessionStorage.clear()`
3. Recarregar a página

### Problema: "URL do Supabase incorreta"

**Solução:**
1. Verificar `src/integrations/supabase/client.ts`
2. Garantir que `SUPABASE_URL` = `https://adzaqkduxnpckbcuqpmg.supabase.co`
3. Garantir que `CURRENT_PROJECT_REF` = `adzaqkduxnpckbcuqpmg`

### Problema: "Usuário não existe no banco"

**Solução:**
1. Verificar se o usuário existe no Auth do projeto correto
2. Verificar se o perfil existe na tabela `profiles`
3. Se não existir, criar manualmente ou migrar do projeto antigo

## 📊 Projeto Esperado

- **Project Ref**: `adzaqkduxnpckbcuqpmg`
- **URL**: `https://adzaqkduxnpckbcuqpmg.supabase.co`
- **Dashboard**: `https://supabase.com/dashboard/project/adzaqkduxnpckbcuqpmg`

## 🛡️ Garantias

Com este sistema implementado, você tem garantia de que:

1. ✅ **A aplicação não inicia** se estiver configurada para outro projeto
2. ✅ **Sessões inválidas são limpas** automaticamente
3. ✅ **Todas as requisições** vão para o projeto correto
4. ✅ **Dados não serão criados** no banco errado
5. ✅ **Alertas visuais** aparecem se houver problemas

## 📝 Notas Importantes

- O sistema de validação é **defensivo** - bloqueia operações se detectar problemas
- Logs detalhados são gerados para facilitar diagnóstico
- O script de verificação pode ser executado a qualquer momento
- A validação acontece em múltiplas camadas para máxima segurança

---

**Última atualização**: 2025-01-20
**Projeto**: DashMed Pro
**Status**: ✅ Implementado e Ativo







