
# Plano: Corrigir Logo Não Carregando em Produção

## Problema Identificado

A logo do DashMed Pro não carrega no build de produção (Lovable) porque o arquivo tem um **espaço no nome**: `dashmed transparente.png`.

URLs com espaços funcionam em localhost porque o servidor de desenvolvimento do Vite trata isso automaticamente, mas em produção os espaços causam problemas de roteamento e encoding.

## Solução

Vou:

1. **Copiar a nova logo** que você anexou para o diretório `public` com um nome sem espaços
2. **Atualizar todas as referências** no código para usar o novo nome do arquivo

## Arquivos a Serem Modificados

| Arquivo | Mudança |
|---------|---------|
| `public/dashmed-logo.png` | Copiar a logo que você anexou |
| `index.html` | Atualizar href do favicon |
| `src/pages/Login.tsx` | Atualizar caminho da logo |
| `src/pages/ResetPassword.tsx` | Atualizar caminho da logo |
| `src/pages/AuthCallback.tsx` | Atualizar caminho da logo |
| `src/components/layout/AppSidebar.tsx` | Atualizar caminho da logo |
| `src/components/onboarding/OnboardingWizard.tsx` | Atualizar caminho da logo (se aplicável) |

## Detalhes Técnicos

**Antes:**
```tsx
const dashmedLogo = '/dashmed transparente.png';
```

**Depois:**
```tsx
const dashmedLogo = '/dashmed-logo.png';
```

**index.html - Antes:**
```html
<link rel="icon" type="image/png" href="/dashmed transparente.png">
```

**Depois:**
```html
<link rel="icon" type="image/png" href="/dashmed-logo.png">
```

## Resultado Esperado

Após a implementação, a logo aparecerá corretamente tanto no localhost quanto no build de produção do Lovable.
