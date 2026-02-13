
# Plano: Criar Paginas de Politica de Privacidade e Termos de Servico

## Resumo

Criar duas novas paginas (`/privacy-policy` e `/terms-of-service`) com o conteudo fornecido, adaptadas ao design system do DashMed Pro (Tailwind + componentes existentes). Adicionar links discretos no rodape da pagina de Login com botao de retorno.

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/PrivacyPolicy.tsx` | Pagina completa de Politica de Privacidade |
| `src/pages/TermsOfService.tsx` | Pagina completa de Termos de Servico |

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rotas `/privacy-policy` e `/terms-of-service` (publicas, sem autenticacao) |
| `src/pages/Login.tsx` | Adicionar links discretos no rodape da pagina de login |

## Detalhes Tecnicos

### 1. Paginas de Politica e Termos

Cada pagina tera:
- Layout responsivo com `max-w-4xl` centralizado
- Botao "Voltar ao Login" no topo (usando `useNavigate` do react-router)
- Logo do DashMed Pro no cabecalho
- Conteudo completo fornecido, estilizado com classes Tailwind
- Rodape com copyright e links cruzados entre as duas paginas
- Suporte a dark mode via variaveis CSS existentes

### 2. Links na Pagina de Login

Adicionar abaixo do card de login (apos a linha 591):

```tsx
<div className="mt-4 text-center text-xs text-muted-foreground">
  <Link to="/privacy-policy" className="hover:underline">
    Politica de Privacidade
  </Link>
  <span className="mx-2">|</span>
  <Link to="/terms-of-service" className="hover:underline">
    Termos de Servico
  </Link>
</div>
```

### 3. Rotas no App.tsx

As rotas serao adicionadas no bloco de rotas publicas (junto com `/login`, `/reset-password`, `/auth/callback`), pois nao requerem autenticacao.

### 4. Estrutura das paginas

Ambas as paginas seguirao a mesma estrutura:
- Header com logo + titulo + botao voltar
- Box de "ultima atualizacao"
- Secoes numeradas com h2/h3
- Boxes de destaque (info, warning, highlight) usando classes Tailwind
- Tabelas estilizadas
- Box de contato
- Footer
