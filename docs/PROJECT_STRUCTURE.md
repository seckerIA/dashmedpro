# Estrutura do Projeto DashMed Pro

Este documento descreve a organização das pastas do projeto após a reestruturação.

## Diretórios Principais

- **`/src`**: Código fonte da aplicação (React, Vite).
- **`/supabase`**: Configurações do Supabase, Migrações oficiais e Edge Functions.
- **`/docs`**: Documentação do projeto, guias e relatórios.
  - **`/docs/assets`**: Imagens e prints de referência.
- **`/scripts`**: Scripts de automação e manutenção.
  - **`/scripts/maintenance`**: Scripts utilitários em Node.js (`.mjs`) e PowerShell (`.ps1`) para tarefas de manutenção (ex: gerar tipos, verificar banco).
  - **`/scripts/sql_snippets`**: Scripts SQL avulsos para consultas rápidas ou correções manuais (não são migrações oficiais).
- **`/public`**: Arquivos estáticos servidos diretamente.

## Onde encontrar o que você procura?

- **Quer rodar uma migração manual?** Olhe em `/scripts/sql_snippets` ou use as migrações oficiais em `/supabase/migrations`.
- **Quer ler sobre o Schema do Banco?** Vá para `/docs/DATABASE_SCHEMA.md`.
- **Quer rodar scripts de verificação?** Vá para `/scripts/maintenance`. Exemplo: `node scripts/maintenance/check-rls.mjs`.

## Notas Importantes

- Os scripts de manutenção deve ser executados **a partir da raiz do projeto**.
  - Correto: `node scripts/maintenance/script.mjs`
  - Incorreto: `cd scripts/maintenance && node script.mjs` (pode quebrar caminhos relativos)
