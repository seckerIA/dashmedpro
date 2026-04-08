# DashMedPro Constitution

> Princípios fundamentais que regem TODO desenvolvimento no DashMedPro.
> Esta constitution SUPERCEDE qualquer prática ad-hoc. Consultada antes de cada `/speckit.specify`, `/speckit.plan` e `/speckit.implement`.

## Core Principles

### I. Quality Loop (NON-NEGOTIABLE)
Toda mudança segue o loop de 5 fases obrigatório:
1. **Pre-Flight**: ler arquivos antes de editar, rodar `npm run build` para baseline
2. **Implementação**: cirúrgica, um arquivo por vez, sem refactor oportunista
3. **Verificação**: build DEVE passar antes de prosseguir; reler cada edit
4. **Re-avaliação**: comparar entrega vs pedido original; análise de impacto
5. **Documentação**: atualizar CLAUDE.md com contexto; informar o usuário com links clicáveis

**Regra de ouro**: "Não declare CONCLUÍDO até que o build passe e você tenha RELIDO suas próprias mudanças."

### II. Security First (SAFETY_PROTOCOL)
Segurança é intransigente — J.A.R.V.I.S. rules:
- NUNCA `DROP TABLE/COLUMN`, delete de código funcional, ou mudanças de auth sem aprovação
- NUNCA migrations destrutivas sem backup/plano de rollback
- SEMPRE modo somente-aditivo em caso de dúvida
- RLS granular obrigatório: Médicos (`auth.uid()`), Secretárias (`secretary_doctor_links`), Admin (`is_admin_or_dono()`)
- Features que tocam auth/RLS/Edge Functions/dados sensíveis DEVEM passar por `/security-review`

### III. Integration Tests (Doctor Strange)
Features cross-module DEVEM ter cobertura em `scripts/qa/`:
- Todo novo módulo cria novo `test-flow-N-*.ts` + registra em `run-all.ts` + script em `package.json`
- `npm run test:qa` roda antes de deploy em features críticas
- 7 flows base: CRM→Financeiro, Pipeline, Sinal, Estoque FEFO, Prontuários, WhatsApp, RLS Secretárias

### IV. Dual Provider Respect (WhatsApp)
Qualquer mudança em WhatsApp DEVE funcionar identicamente para **Meta Business API** e **Evolution API**:
- Provider branching no `whatsapp-send-message`
- AI agent (`whatsapp-ai-agent`) agnóstico ao provider
- Schema com coluna `provider` em `whatsapp_config`, `whatsapp_conversations`, `whatsapp_messages`

### V. UI Stack & Mobile-First
- **Stack obrigatório**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind + TanStack Query v5
- **Forms**: React Hook Form + Zod (nunca state manual)
- **Mobile-first**: breakpoints `sm:`/`md:`, touch targets `h-8`/`h-9`, icon-only buttons em mobile
- **Cache**: invalidação explícita via `queryClient.invalidateQueries` — nunca refetch manual
- **Simplicidade**: preferir componente shadcn existente a criar um novo; YAGNI

## Technology Constraints

### Stack Fixo
- Frontend: React 18 + Vite + TypeScript
- Database: Supabase (PostgreSQL + RLS) — Project Ref: `adzaqkduxnpckbcuqpmg`
- Styling: TailwindCSS + shadcn/ui (Radix)
- State: TanStack Query v5, React Hook Form + Zod
- Edge Functions: Deno runtime
- AI: GPT-4o (agente humanizado), GPT-4o-mini (extração), pgvector (RAG)

### API Rate Limits (Lições Aprendidas)
- **Meta Graph API**: batches de 5, nunca `Promise.all` com N itens
- **Graph API versions**: v22.0 (Ads/OAuth), v18.0 (WhatsApp legado)
- **Evolution API**: phone format JID (`5511999999999@s.whatsapp.net`)

### Anti-Patterns Proibidos
- `.select().single()` após UPDATE com RLS restritiva → causa 406
- `.catch()` direto em queries Supabase no Deno → supabase-js v2 é `PromiseLike`
- Upsert com colunas inexistentes → rejeitado silenciosamente por `functions.invoke`
- Record `meta_oauth` tratado como conta real → SEMPRE filtrar
- Hardcoded em vez de dinâmico → violação de Quality Loop Fase 4

## Development Workflow

### SDD Phase Ordering (para features não-triviais)
```
1. /speckit.constitution  (revisar se princípios mudaram)
2. /speckit.specify       (o QUÊ e o PORQUÊ — sem tech)
3. /speckit.clarify       (opcional: reduzir ambiguidade)
4. /speckit.plan          (COMO — stack, arquitetura, RLS)
5. /speckit.tasks         (passos numerados e testáveis)
6. /speckit.analyze       (opcional: consistência entre artefatos)
7. /speckit.implement     (delegação via DevSquad Avengers)
```

### DevSquad Avengers Mapping
Cada fase SDD mapeia para agentes específicos:
- **specify** → Nick Fury (ARCHITECT) valida intenção
- **plan** → Nick Fury + Thor (BACKEND) + Iron Man (FRONTEND)
- **tasks** → Nick Fury delega via TodoWrite
- **implement** → Squad executa, Doctor Strange (QA) valida, Captain America (SECURITY) faz review
- **bug fixes** (fora do fluxo SDD): Black Widow → Hawkeye → Spider-Man → Hulk

### Deploy Edge Functions
```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy <nome> --project-ref adzaqkduxnpckbcuqpmg
```
Token em `.env`. Tokens expiram — regenerar em https://supabase.com/dashboard/account/tokens

## Governance

- Esta constitution SUPERCEDE qualquer prática conflitante em `.claude/CLAUDE.md` ou arquivos de agente
- Mudanças requerem: (1) justificativa documentada, (2) incremento de versão, (3) atualização em CLAUDE.md
- Versionamento: MAJOR.MINOR.PATCH
  - MAJOR: remoção/redefinição de princípio
  - MINOR: novo princípio ou seção
  - PATCH: clarificações, fixes de wording
- Todo PR que toca auth/RLS/Edge Functions DEVE citar qual princípio está atendendo
- Complexidade adicional DEVE ser justificada contra Princípio I (Quality Loop) e V (Simplicity implícita via shadcn/ui)

**Version**: 1.0.0 | **Ratified**: 2026-04-08 | **Last Amended**: 2026-04-08
