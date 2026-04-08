# DashMedPro — Agent System & Project Guide

> **DevSquad DashMedPro** — Time de agentes AI especializados para desenvolvimento do CRM medico.
> Este arquivo e o CEREBRO do sistema. Consulte SEMPRE antes de iniciar qualquer tarefa.

---

## Spec-Driven Development (SDD) — OBRIGATORIO para Features

> **Constitution**: `.specify/memory/constitution.md` — princípios INTRANSIGÍVEIS do projeto.
> Consultar ANTES de qualquer `/speckit.specify`, `/speckit.plan` ou `/speckit.implement`.

### Quando usar SDD (obrigatório)
- **Feature nova** (> 3 arquivos, cross-module, ou toca banco/RLS/Edge Functions)
- **Refactor estrutural** (mudança de arquitetura, migração de padrão)
- **Integração externa** (nova API, novo provider, nova plataforma)

### Quando NÃO usar SDD (pular direto para agente)
- Bug fix isolado → Black Widow → Hawkeye → Spider-Man → Hulk
- Ajuste cirúrgico de 1-3 linhas → Spider-Man direto
- Pergunta/exploração → leitura direta sem specs

### Fluxo SDD completo
```
1. /speckit.constitution  → revisar princípios (se mudaram)
2. /speckit.specify       → Nick Fury valida o QUÊ e PORQUÊ
3. /speckit.clarify       → (opcional) reduzir ambiguidade
4. /speckit.plan          → Nick Fury + Thor + Iron Man definem COMO
5. /speckit.tasks         → quebra em passos numerados
6. /speckit.analyze       → (opcional) consistência cross-artefato
7. /speckit.implement     → squad executa, Doctor Strange valida, Captain America revisa
```

### Artefatos por feature (VERSIONADOS no Git)
- `specs/<feature-name>/spec.md` — requisitos e critérios de aceitação
- `specs/<feature-name>/plan.md` — arquitetura e decisões técnicas
- `specs/<feature-name>/tasks.md` — tarefas executáveis numeradas

Specs são **primeira classe** — commitadas junto com o código que implementam. Nunca adicionar `specs/` ao `.gitignore`. Revisão de PR DEVE verificar alinhamento código vs spec.

### Regra de ouro
> **"Specs são o artefato primário. Código é gerado a partir delas."**
> Se uma feature foi implementada sem spec, a spec deve ser retroativamente criada antes do próximo PR que toca aquela área.

---

## Agent System — DevSquad Avengers

### Squad DEVELOPERS (Desenvolvedores)

| Codinome | Agente | Arquivo | Funcao |
|----------|--------|---------|--------|
| **Nick Fury** | ARCHITECT | `.claude/agents/ARCHITECT.md` | Orquestrador/PM — NUNCA escreve codigo, planeja e delega |
| **Iron Man** | FRONTEND | `.claude/agents/FRONTEND.md` | React/TypeScript/shadcn-ui — componentes, hooks, pages |
| **Thor** | BACKEND | `.claude/agents/BACKEND.md` | Supabase, PostgreSQL, RLS, Edge Functions, migrations |
| **Captain America** | SECURITY | `.claude/agents/SECURITY.md` | Auth, RLS policies, seguranca, code review |
| **Vision** | SYSTEM | `.claude/agents/SYSTEM.md` | DevOps, deploy, performance, testes, docs |
| **Thanos** | META_SPECIALIST | `.claude/agents/META_SPECIALIST.md` | Meta Graph API, App Review, OAuth, WhatsApp Cloud API, Meta Ads |
| **Doctor Strange** | QA_ENGINEER | `.claude/agents/QA_ENGINEER.md` | QA integration tests, cross-module verification, bug discovery |

### Squad DEBUGGERS (Debugadores)

| Codinome | Agente | Arquivo | Funcao |
|----------|--------|---------|--------|
| **Black Widow** | DETECTIVE | `.claude/agents/DETECTIVE.md` | Investigacao de bugs, coleta de evidencias, root cause |
| **Hawkeye** | RESEARCHER | `.claude/agents/RESEARCHER.md` | Pesquisa web, docs, GitHub issues, solucoes externas |
| **Spider-Man** | FIXER | `.claude/agents/FIXER.md` | Implementacao cirurgica de fixes |
| **Hulk** | GUARDIAN | `.claude/agents/GUARDIAN.md` | QA final, aprovacao antes de producao |
| **Heimdall** | WATCHER | `.claude/agents/WATCHER.md` | Monitoramento background, deteccao de erros |

### Protocolo de Seguranca

| Codinome | Arquivo | Funcao |
|----------|---------|--------|
| **J.A.R.V.I.S.** | `.claude/agents/SAFETY_PROTOCOL.md` | Regras de seguranca OBRIGATORIAS para todos os agentes |

---

## Auto-Activation Rules

> Ao receber uma tarefa, identifique automaticamente o tipo e ative o agente correto.
> NAO espere o usuario pedir — ative com base no conteudo da tarefa.

### Regras de Ativacao

```
FEATURE NOVA / REFACTOR ESTRUTURAL / INTEGRACAO EXTERNA:
  -> ANTES de tudo: fluxo SDD
  -> Passo 1: /speckit.specify (Nick Fury valida intenção)
  -> Passo 2: /speckit.plan (arquitetura cross-squad)
  -> Passo 3: /speckit.tasks (quebra executável)
  -> Passo 4: /speckit.implement (squad executa)
  -> Criterios: > 3 arquivos OU toca RLS/banco/Edge Functions OU cross-module
  -> Exemplos: "adiciona teleconsulta", "novo módulo de receitas", "integração X"

TAREFA DE UI/COMPONENTES/HOOKS/FORMS/CSS/UX:
  -> Ativar Iron Man (FRONTEND)
  -> Consultar: .claude/agents/FRONTEND.md
  -> Exemplos: "cria formulario", "ajusta layout", "adiciona componente", "hook novo"

TAREFA DE BANCO/MIGRATIONS/RLS/EDGE FUNCTIONS:
  -> Ativar Thor (BACKEND)
  -> Consultar: .claude/agents/BACKEND.md
  -> Exemplos: "cria tabela", "migration", "RLS policy", "Edge Function", "query lenta"

BUG REPORT / INVESTIGACAO:
  -> Ativar Black Widow (DETECTIVE) para investigar
  -> Depois Hawkeye (RESEARCHER) para pesquisar solucao
  -> Depois Spider-Man (FIXER) para implementar
  -> Depois Hulk (GUARDIAN) para validar
  -> Pipeline: DETECTIVE -> RESEARCHER -> FIXER -> GUARDIAN
  -> Exemplos: "nao funciona", "erro", "bug", "tela vazia", "dados nao aparecem"

PESQUISA EXTERNA / DOCS / COMO FAZER:
  -> Ativar Hawkeye (RESEARCHER)
  -> Consultar: .claude/agents/RESEARCHER.md
  -> Exemplos: "como integrar X", "qual lib usar", "docs de Y"

FIX CIRURGICO (causa ja conhecida):
  -> Ativar Spider-Man (FIXER)
  -> Consultar: .claude/agents/FIXER.md
  -> Exemplos: "corrige essa linha", "fix no hook", "ajusta o tipo"

DEPLOY / PERFORMANCE / TESTES / DOCS:
  -> Ativar Vision (SYSTEM)
  -> Consultar: .claude/agents/SYSTEM.md
  -> Exemplos: "faz deploy", "otimiza", "testa", "documenta"

SEGURANCA / AUTH / RLS REVIEW:
  -> Ativar Captain America (SECURITY)
  -> Consultar: .claude/agents/SECURITY.md
  -> Exemplos: "review seguranca", "verifica RLS", "auth nao funciona"

QA / TESTES DE INTEGRACAO / VERIFICACAO DE FLUXOS:
  -> Ativar Doctor Strange (QA_ENGINEER)
  -> Consultar: .claude/agents/QA_ENGINEER.md
  -> Comandos: npm run test:qa (todos) ou npm run test:qa:flowN (especifico)
  -> Exemplos: "testa o sistema", "roda os testes", "verifica fluxos",
     "pre-deploy check", "testa integracao", "procura bugs"

QA / APROVACAO FINAL:
  -> Ativar Hulk (GUARDIAN)
  -> Consultar: .claude/agents/GUARDIAN.md
  -> Exemplos: "valida o fix", "aprova para producao"

TAREFA LONGA COM MONITORAMENTO:
  -> Ativar Heimdall (WATCHER)
  -> Usar Task tool com run_in_background: true
  -> Exemplos: "roda build em background", "monitora deploy"

META / FACEBOOK / WHATSAPP API / APP REVIEW / OAUTH / ADS API:
  -> Ativar Thanos (META_SPECIALIST)
  -> Consultar: .claude/agents/META_SPECIALIST.md
  -> Exemplos: "permissao rejeitada", "erro na Graph API", "configurar OAuth Meta",
     "screencast para App Review", "token expirado", "ads nao sincronizam",
     "whatsapp webhook", "resubmeter permissao"

TAREFA COMPLEXA MULTI-DOMINIO:
  -> Ativar Nick Fury (ARCHITECT) para orquestrar
  -> Consultar: .claude/agents/ARCHITECT.md
  -> Exemplos: "feature nova completa", "integracao com API", "refatora modulo inteiro"
```

### Ordem Tipica para Features Novas

```
1. Thor (BACKEND)         -> Schema, tabelas, migrations, RLS
2. Captain America (SECURITY) -> Review do schema e RLS
3. Thor (BACKEND)         -> Edge Functions (se necessario)
4. Iron Man (FRONTEND)    -> Componentes, hooks, UI
5. Doctor Strange (QA_ENGINEER) -> Integration tests (atualizar scripts de teste)
6. Captain America (SECURITY) -> Review final
7. Vision (SYSTEM)        -> Deploy, docs
```

### Ordem Tipica para Bug Fixes

```
1. Black Widow (DETECTIVE)  -> Investigar e coletar evidencias
2. Hawkeye (RESEARCHER)     -> Pesquisar solucao
3. Spider-Man (FIXER)       -> Implementar fix cirurgico
4. Doctor Strange (QA_ENGINEER) -> Rodar suite para verificar regressao
5. Hulk (GUARDIAN)          -> Validar que nao quebrou nada
```

### Regra Obrigatoria — Atualizacao de Testes

```
SEMPRE que funcionalidades novas forem inseridas no DashMedPro,
ATUALIZAR os scripts de teste do Doctor Strange para cobrir os novos fluxos.

Se um novo modulo for criado (ex: teleconsulta):
  1. Criar novo test-flow-N-novo-modulo.ts em scripts/qa/
  2. Registrar no run-all.ts (importar + adicionar ao array)
  3. Adicionar script no package.json (test:qa:flowN)
  4. Documentar no QA_ENGINEER.md (mapa de fluxos)
```

---

## Heimdall Protocol (Long-Running Tasks)

Para tarefas que demoram mais de 30 segundos:

```
1. Heimdall lanca tarefa em background via Task tool (run_in_background: true)
2. Informa usuario que a tarefa foi lancada
3. Monitora via TaskOutput (block: false) periodicamente
4. Se ERRO detectado:
   -> Analisa output e identifica tipo de erro
   -> Notifica usuario com diagnostico + sugestao
   -> Recomenda qual agente acionar para corrigir
5. Se SUCESSO:
   -> Reporta resultado de forma concisa
   -> Inclui metricas (tempo, tamanho, etc.)
```

---

## Quality Loop Protocol — OBRIGATORIO

> **O que e:** Ciclo de auto-verificacao que TODOS os agentes devem seguir para garantir
> que o trabalho entregue esta correto, testado e documentado.
> **Por que:** Um loop de feedback interno aumenta a qualidade do resultado em 2-3x.
> **Quando:** TODA tarefa que modifique codigo ou banco de dados.

### Fase 1: PRE-FLIGHT (Antes de Mexer)

```
1. ENTENDER O ESTADO ATUAL
   -> Ler os arquivos relevantes ANTES de editar (nunca edite sem ler)
   -> Rodar `npm run build` para saber se o build ja esta verde
   -> Se for bug: reproduzir mentalmente o fluxo que causa o erro
   -> Se for feature: mapear quais arquivos serao afetados

2. PLANEJAR A MUDANCA
   -> Descrever em 1-2 frases O QUE vai mudar e POR QUE
   -> Listar arquivos que serao tocados
   -> Identificar riscos (tabelas criticas? auth? RLS?)
   -> Usar TodoWrite para trackear progresso se > 2 passos
```

### Fase 2: IMPLEMENTACAO (Fazer o Trabalho)

```
1. Implementar de forma CIRURGICA
   -> Editar apenas o necessario (sem refactor oportunista)
   -> Um arquivo por vez, confirmar que cada edit esta correto
   -> Seguir padroes do projeto (hooks, imports, nomenclatura)

2. VERIFICAR CADA EDIT
   -> Apos cada Edit, reler o trecho modificado para confirmar
   -> Se o edit falhar (old_string nao encontrado), investigar antes de tentar de novo
```

### Fase 3: VERIFICACAO (Self-Check)

```
1. BUILD TEST (OBRIGATORIO)
   -> Rodar `npm run build`
   -> Se FALHOU: corrigir ANTES de prosseguir
   -> Se passou: continuar para proxima fase

2. REVIEW DAS MUDANCAS
   -> Reler TODOS os arquivos modificados (pelo menos o trecho alterado)
   -> Perguntar-se:
      - "O codigo faz o que deveria?"
      - "Introduzi algum bug ou efeito colateral?"
      - "Tem algo hardcoded que deveria ser dinamico?"
      - "Tratei os edge cases?" (null, undefined, array vazio, erro de rede)
      - "Tem codigo morto ou imports nao utilizados?"

3. VALIDACAO FUNCIONAL (quando possivel)
   -> Se for Edge Function: verificar se os tipos/enums batem com o banco
   -> Se for UI: verificar se o componente renderiza (sem erros de props/tipos)
   -> Se for hook: verificar se queryKey e invalidacoes estao corretos
```

### Fase 4: RE-AVALIACAO (Olhar Critico)

```
1. COMPARAR COM O PEDIDO ORIGINAL
   -> O que o usuario pediu? O que eu entreguei? Bate?
   -> Fiz algo a mais que nao foi pedido? (Se sim, avaliar se e necessario)
   -> Fiz algo a menos? (Se sim, completar antes de declarar concluido)

2. ANALISE DE IMPACTO
   -> Minha mudanca pode quebrar outra funcionalidade?
   -> Se alterei um hook: quais componentes usam esse hook?
   -> Se alterei um tipo: quais arquivos importam esse tipo?
   -> Se alterei RLS: quais roles sao afetados?

3. SCORE DE CONFIANCA
   -> Alta confianca (90%+): Build passa, logica clara, sem efeitos colaterais
   -> Media confianca (60-90%): Build passa mas precisa de teste manual
   -> Baixa confianca (<60%): PARE e comunique ao usuario antes de prosseguir
```

### Fase 5: DOCUMENTACAO (Registrar)

```
1. ATUALIZAR CLAUDE.md
   -> Adicionar entrada em "Contexto Atual" com:
     - Data e titulo descritivo
     - Resumo do que foi feito (bug? feature? refactor?)
     - Arquivos alterados
     - Decisoes tomadas e por que

2. INFORMAR O USUARIO
   -> Resumo conciso do que foi feito
   -> Listar arquivos alterados com links clicaveis
   -> Se confianca < 90%: avisar o que precisa de teste manual
   -> Sugerir proximo passo se aplicavel
```

### Atalho: Quality Loop Rapido (para tasks simples)

```
Para fixes de 1-3 linhas ou tasks triviais, basta:
1. Ler arquivo -> 2. Editar -> 3. npm run build -> 4. Reler edit -> 5. Resumo ao usuario
(Pular fases de planejamento e documentacao CLAUDE.md para tasks triviais)
```

### Regra de Ouro do Quality Loop

> **"Nao declare CONCLUIDO ate que o build passe e voce tenha RELIDO suas proprias mudancas."**

---

## Project Overview

**DashMedPro** — Sistema CRM medico integrado com agenda, prontuarios, pipeline de pacientes e gestao financeira.

### Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** TailwindCSS + shadcn/ui (Radix)
- **State:** TanStack Query v5, React Hook Form + Zod
- **Key libs:** FullCalendar, Recharts, date-fns, Framer Motion, dnd-kit
- **Edge Functions:** Deno runtime (supabase/functions/)
- **Project Ref:** adzaqkduxnpckbcuqpmg

### Estrutura
```
src/
├── components/          # UI organizado por dominio
│   ├── crm/            # Pipeline, deals, contatos
│   ├── medical-calendar/ # Agendamentos medicos
│   ├── medical-records/ # Prontuarios
│   ├── financial/      # Transacoes e contas
│   ├── whatsapp/       # Inbox, chat, automacoes WhatsApp
│   ├── marketing/      # Meta Ads, UTMs, campanhas
│   └── ui/             # shadcn/ui base components
├── hooks/              # Custom hooks (useCRM, useMedicalAppointments, etc)
├── pages/              # Rotas principais
├── types/              # TypeScript types por dominio
├── lib/                # Utils e helpers
├── integrations/supabase/ # Cliente e types gerados
└── supabase/
    └── functions/      # Edge Functions
```

### Padroes Obrigatorios

**Hooks**: TanStack Query + mutations + queryClient.invalidateQueries
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
```

**Componentes**: shadcn/ui + lucide-react icons + cn() para classes condicionais
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
```

**Forms**: React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
```

### Tabelas Principais
- `crm_contacts`: pacientes (name, email, phone, health_insurance_type)
- `crm_deals`: oportunidades (contact_id, stage, is_in_treatment, value)
- `medical_appointments`: consultas (contact_id, doctor_id, status, payment_status)
- `medical_records`: prontuarios (contact_id, doctor_id, diagnosis, treatment_plan)
- `financial_transactions`: lancamentos (account_id, amount, type, transaction_date)
- `secretary_doctor_links`: many-to-many secretaria<->medicos
- `whatsapp_config`: configuracao WhatsApp por usuario
- `whatsapp_conversations`: conversas com contatos (+ `ai_lock_until` para lock atomico)
- `whatsapp_messages`: mensagens enviadas/recebidas
- `whatsapp_ai_config`: config IA por usuario (identity, KB, auto-reply, auto-scheduling)
- `sofia_knowledge_base`: RAG knowledge base com pgvector embeddings (1536 dims)
- `whatsapp_lead_qualifications`: dados estruturados do lead (nome, procedimento, convenio, urgencia, status)

### Pipeline Stages
`lead_novo` -> `agendado` -> `em_tratamento` -> `inadimplente` | `aguardando_retorno`

### RLS Policies
- **Medicos**: `user_id = auth.uid()` — acesso a proprios dados
- **Secretarias**: acesso via `secretary_doctor_links` JOIN
- **Admin/Dono**: acesso total

### Edge Functions
```
supabase/functions/
├── whatsapp-webhook/            # Recebe mensagens do Meta (v18.0) — trigger para AI agent
├── whatsapp-send-message/       # Envia mensagens via Graph API (v18.0) ou Evolution API
├── whatsapp-ai-agent/           # Agente conversacional humanizado GPT-4o
│   ├── index.ts                 # Handler principal (lock, debounce, RAG, send)
│   ├── router.ts                # Deteccao de fase heuristica (5 fases medicas)
│   └── prompt.ts                # Prompts por fase + identidade configuravel
├── whatsapp-ai-analyze/         # Analise de conversas com GPT-4o-mini (legacy)
├── evolution-instance/          # Gerencia instancias Evolution API (create, connect, status, delete)
├── evolution-webhook/           # Recebe webhooks Evolution API (verify_jwt=false)
├── sofia-generate-embedding/    # Gera embeddings para RAG knowledge base
├── whatsapp-config-validate/    # Valida tokens e configura webhook Meta
├── whatsapp-list-accounts/      # Lista WABAs do Business Manager
├── meta-token-exchange/         # OAuth token exchange do Meta Business (v22.0)
├── meta-oauth-callback/         # OAuth callback + asset discovery (v22.0)
├── sync-ad-campaigns/           # Sincroniza campanhas Meta Ads (v22.0)
├── manage-ad-campaign/          # Pause/Activate campanhas Meta Ads (v22.0)
├── test-ad-connection/          # Testa conexao Meta Ads via Graph API (v22.0)
```

### Scripts
```bash
npm run dev           # Vite dev server (port 8080)
npm run build         # Production build
npm run lint          # ESLint check
npm run test:qa       # Doctor Strange — all 7 integration flows
npm run test:qa:flowN # Doctor Strange — specific flow (N=1-7)
```

---

## Decisoes Arquiteturais

- **Pipeline automatico**: Consultas agendadas -> deal `agendado`; sinal nao pago -> `inadimplente`
- **RLS granular**: Secretaria precisa link explicito em `secretary_doctor_links`
- **Transacoes financeiras**: Auto-criadas ao marcar consulta como `completed` SE payment_status=paid
- **WhatsApp Token Storage**: `access_token` em `whatsapp_config` (nao Vault)
- **Webhook JWT**: Desabilitado para Meta webhooks (`verify_jwt = false`)
- **IA no WhatsApp (Agente Humanizado)**: GPT-4o conversacional com 5 fases medicas (abertura, triagem, agendamento, pos_agendamento, handoff), lock atomico PostgreSQL, RAG pgvector, typing simulation, message splitting ([SPLIT])
- **IA no WhatsApp (Legacy)**: `whatsapp-ai-analyze` mantido como backup — analise via GPT-4o-mini, qualificacao de leads
- **AI Agent Identity**: Nome, clinica, especialista e saudacao configuraveis por usuario em `whatsapp_ai_config`
- **Dual WhatsApp Provider**: Meta Business API (oficial) + Evolution API (QR Code self-hosted). Provider enum em whatsapp_config, conversations e messages. AI agent funciona para ambos.
- **Evolution API**: Docker self-hosted (atendai/evolution-api:v2.2.3), QR Code connection, Global API Key + Instance Token
- **Meta Ads**: FB.login() + code exchange, long-lived token (60 dias), Graph API v22.0
- **Meta OAuth**: `useMetaOAuth` hook centralizado (useWhatsAppOAuth deprecado)
- **ROAS**: Calculado via `action_values.purchase` / `spend` na sync de campanhas

---

## Known Issues
- **403 em crm_deals**: RLS pode bloquear INSERT/UPDATE em pipeline automation
- **Conta financeira ausente**: Toast warning se nao houver `financial_accounts` ativa
- **WhatsApp Token Expiration**: Tokens Meta expiram periodicamente
- **Meta OAuth HTTPS**: Facebook requer HTTPS (usar ngrok para dev local)
- **406 em update+select+single**: RLS bloqueia read-back apos PATCH — usar `.update().eq()` sem `.select().single()` (ver Licoes Aprendidas)
- **meta_oauth record nao e conta real**: O record `account_id = 'meta_oauth'` armazena o token OAuth, NAO e uma conta de anuncios — SEMPRE filtrar de sync e listagens

---

## Licoes Aprendidas (Patterns & Anti-Patterns)

### Anti-Pattern: `.select().single()` apos UPDATE com RLS
- **Problema**: `supabase.from('table').update(data).eq('id', id).select().single()` retorna 406 (PGRST116) quando a RLS policy permite UPDATE mas nao permite SELECT do row atualizado
- **Causa**: PostgREST tenta ler o row de volta apos o update, mas a RLS bloqueia o read
- **Fix**: Remover `.select().single()` e retornar apenas `{ id }` quando nao precisa do dado retornado
- **Regra**: So use `.select().single()` em mutations se REALMENTE precisa do dado retornado E tem certeza que a RLS permite read

### Anti-Pattern: `Promise.all` em chamadas de API externa com muitos itens
- **Problema**: `Promise.all(campaigns.map(...))` dispara N requests simultaneas, causando rate limit na Meta API
- **Fix**: Processar em batches de 5 (`BATCH_SIZE = 5`) com loop sequencial entre batches
- **Pattern**:
```typescript
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(batch.map(fn));
  allResults.push(...results);
}
```

### Anti-Pattern: Colunas fantasmas em Edge Functions
- **Problema**: Edge Functions fazendo upsert com colunas que nao existem no banco (ex: `campaign_name`, `raw_data`, `organization_id`, `metadata`, `quality_rating`) — PostgreSQL rejeita silenciosamente via `supabase.functions.invoke` (que engole o erro)
- **Fix**: SEMPRE verificar schema real em `src/integrations/supabase/types.ts` ou migration files antes de fazer upsert
- **Regra**: Quando `supabase.functions.invoke` retorna sucesso mas nada muda no banco, verificar se as colunas do upsert existem

### Pattern: Record especial `meta_oauth`
- O `meta-token-exchange` cria um record em `ad_platform_connections` com `account_id = 'meta_oauth'` para armazenar o token OAuth
- Este record NAO e uma conta de anuncios real — NAO deve ser sincronizado, listado ou contado
- SEMPRE filtrar: `.filter(c => c.account_id !== 'meta_oauth')`

### Pattern: Deploy Edge Functions via CLI
- Token de acesso armazenado em `.env` como `SUPABASE_ACCESS_TOKEN`
- Comando: `SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy <nome> --project-ref adzaqkduxnpckbcuqpmg`
- Tokens expiram — se 401, gerar novo em https://supabase.com/dashboard/account/tokens

---

## Historico de Sessoes

### Sessao 18/02/2026 — Meta Ads Schema Fix + WhatsApp BM Connect + Ad Account Selector

#### 1. Fix Schema Mismatches em Edge Functions (commit e8ec2d0)
- **Problema**: `sync-ad-campaigns` e `meta-oauth-callback` faziam upsert com colunas inexistentes, causando falhas silenciosas
- **Correcoes em `sync-ad-campaigns`**:
  - `campaign_name` → `platform_campaign_name`
  - Adicionado `platform: 'meta_ads'`
  - Removido `raw_data` (coluna inexistente)
  - Adicionados `budget`, `conversion_value`, `start_date`, `end_date`
- **Correcoes em `meta-oauth-callback`**:
  - Graph API v21.0 → v22.0
  - Removidos `organization_id`, `metadata` do upsert ads
  - Removidos `organization_id`, `quality_rating`, `oauth_connected`, `oauth_expires_at` do upsert whatsapp
  - Catch block status 400 → 200 (compatibilidade com `supabase.functions.invoke`)
- **Correcoes em `meta-token-exchange`**:
  - Removidos `organization_id`, `quality_rating` do path whatsapp_config
- **Arquivos**: `supabase/functions/sync-ad-campaigns/index.ts`, `supabase/functions/meta-oauth-callback/index.ts`, `supabase/functions/meta-token-exchange/index.ts`

#### 2. WhatsApp Business Connect via BM (commit c5f6969)
- **Feature**: Conectar conta WhatsApp Business diretamente das contas do Business Manager usando token OAuth ja armazenado
- **Nova Edge Function `whatsapp-list-accounts`**:
  - Action `list`: Busca WABAs e phone numbers via Graph API v22.0 (`/me/businesses` → `/{id}/owned_whatsapp_business_accounts` → `/{id}/phone_numbers`)
  - Action `connect`: Salva WABA/phone escolhido em `whatsapp_config` com `oauth_connected: true`
- **Novo Componente `WhatsAppAccountPicker`**: Dialog com RadioGroup para selecionar conta, quality badges, tratamento de token expirado
- **Atualizacoes em `useMetaOAuth`**: Adicionados `fetchWhatsAppAccounts`, `connectWhatsAppAccount` (query + mutation)
- **Atualizacoes em `MetaIntegrationCard`**: Botao "Configurar" para WhatsApp quando Meta conectado mas WhatsApp nao
- **Arquivos**: `supabase/functions/whatsapp-list-accounts/index.ts`, `src/components/marketing/WhatsAppAccountPicker.tsx`, `src/hooks/useMetaOAuth.tsx`, `src/components/marketing/MetaIntegrationCard.tsx`

#### 3. Ad Account Selector para Sync Seletivo (commit 16fb761)
- **Problema**: Marketing dashboard mostrando valores zerados. 26+ contas de anuncios sincronizando simultaneamente (incluindo `meta_oauth` que nao e conta real), causando rate limits e timeouts
- **Novo Componente `AdAccountSyncSelector`**:
  - Lista contas Meta Ads com checkboxes (exclui `meta_oauth`)
  - Toggle `is_active` para ativar/desativar sync por conta
  - Botao "Sincronizar (N)" com barra de progresso e resultado por conta
  - Colapsavel, com "Selecionar todas" / "Desmarcar todas"
- **Atualizacoes**:
  - `AdPlatformsIntegration`: Integrado seletor, contas `meta_ads` filtradas de "Outras Integracoes"
  - `MarketingDashboard.handleSyncAll`: Exclui `meta_oauth` da sincronizacao
  - `useMarketingDashboard`: Contagem de conexoes ativas exclui `meta_oauth`
  - `sync-ad-campaigns`: Insights buscados em batches de 5 (evita rate limit)
- **Arquivos**: `src/components/marketing/AdAccountSyncSelector.tsx`, `src/components/commercial/AdPlatformsIntegration.tsx`, `src/components/marketing/MarketingDashboard.tsx`, `src/hooks/useMarketingDashboard.tsx`, `supabase/functions/sync-ad-campaigns/index.ts`

#### 4. Fix 406 RLS Error no Toggle (commit 9948df3)
- **Problema**: Clicar em checkbox ou "Desmarcar todas" gerava erro 406 (PGRST116) em loop — a RLS bloqueava o `.select().single()` apos o PATCH
- **Causa**: `useUpdateAdPlatformConnection` usava `.update().eq().select().single()` — PostgREST tentava ler o row atualizado mas a RLS bloqueava o read-back
- **Fix**: Removido `.select().single()`, retorna apenas `{ id }` — o toggle nao precisa do dado retornado
- **Arquivo**: `src/hooks/useAdPlatformConnections.tsx`

### Sessao 19/02/2026 — Agente de IA Humanizado para WhatsApp (Sophia-style)

#### Contexto
Substituicao do motor de analise `whatsapp-ai-analyze` (GPT-4o-mini, robótico) por um agente conversacional humanizado `whatsapp-ai-agent` (GPT-4o), inspirado no modelo Sophia adaptado para nicho medico.

#### Decisoes do Usuario
- **Nome da IA**: Configuravel por clinica (campo `agent_name` em `whatsapp_ai_config`)
- **Foco**: Agendamento (triagem -> agendar consultas)
- **Voz**: Nao (so texto, sem ElevenLabs TTS)

#### Arquitetura do Novo Agente
```
Meta Webhook -> whatsapp-webhook -> fire-and-forget -> whatsapp-ai-agent
  1. Acquire atomic lock (try_acquire_ai_lock RPC, 35s)
  2. Wait 5s (debounce multi-mensagem)
  3. Mark as read (blue check via Graph API)
  4. Load history (ultimas 20 msgs)
  5. Detect phase (heuristica, sem LLM)
  6. Load lead data (whatsapp_lead_qualifications)
  7. [Se agendamento] Load slots disponiveis (5 dias)
  8. [Se preciso] RAG knowledge base (pgvector similarity)
  9. Build prompt por fase + identidade clinica
 10. GPT-4o generation (temp 0.75, max 500 tokens)
 11. Post-process: emoji limit (max 1) + [SPLIT] + auto-split >120 chars
 12. Send messages com typing simulation (800ms-2500ms)
 13. Extract lead data em background (GPT-4o-mini)
 14. Release lock
```

#### 5 Fases Medicas (router.ts)
| # | Fase | Trigger | Objetivo |
|---|------|---------|----------|
| 1 | abertura | 1-3 msgs | Saudacao, identificar paciente |
| 2 | triagem | 4+ msgs sem procedimento | Descobrir procedimento, convenio, urgencia |
| 3 | agendamento | Procedimento + convenio | Oferecer horarios, confirmar consulta |
| 4 | pos_agendamento | Lead agendado | Confirmar detalhes, orientacoes pre-consulta |
| 5 | handoff | Keywords emergencia/reclamacao | Transferir para humano |

#### Migration SQL (executada)
- `sofia_knowledge_base`: RAG com pgvector embeddings (1536 dims)
- `whatsapp_lead_qualifications`: dados estruturados do lead
- `whatsapp_conversations.ai_lock_until`: lock atomico
- `whatsapp_ai_config`: +9 colunas (agent_name, clinic_name, specialist_name, agent_greeting, knowledge_base, already_known_info, custom_prompt_instructions, auto_reply_enabled, auto_scheduling_enabled)
- 3 RPCs: `try_acquire_ai_lock`, `release_ai_lock`, `match_knowledge`

#### Arquivos Criados
- `supabase/migrations/20260219000001_ai_agent_tables.sql`
- `supabase/functions/whatsapp-ai-agent/index.ts` (~500 linhas)
- `supabase/functions/whatsapp-ai-agent/router.ts`
- `supabase/functions/whatsapp-ai-agent/prompt.ts`
- `supabase/functions/sofia-generate-embedding/index.ts`

#### Arquivos Modificados
- `supabase/functions/whatsapp-webhook/index.ts` — trigger `whatsapp-ai-analyze` -> `whatsapp-ai-agent`
- `supabase/config.toml` — adicionadas entradas verify_jwt=false
- `src/components/whatsapp/ai/AISettingsDialog.tsx` — secao identidade do agente
- `src/types/whatsappAI.ts` — 4 campos novos em AIConfig

#### Deploy
- Edge Functions deployadas via CLI: `whatsapp-ai-agent`, `sofia-generate-embedding`, `whatsapp-webhook`
- Migration executada no Supabase SQL Editor
- `whatsapp-ai-analyze` mantido intacto como fallback

#### Pendencias
- Auto-scheduling logic (criar `medical_appointments` automaticamente) — NAO portado do `whatsapp-ai-analyze` ainda
- UI de CRUD para `sofia_knowledge_base` (fase 2 — por agora usa textarea simples)
- Teste end-to-end via mensagem WhatsApp real

### Sessao 22/02/2026 — Claude Code Security Integration

#### Contexto
Integracao do novo recurso **Claude Code Security** (lancado pela Anthropic em Fev 2026) ao agente Captain America (SECURITY.md). O recurso usa IA para escanear vulnerabilidades com raciocinio profundo — traca fluxo de dados, entende interacoes entre componentes e detecta falhas que regex/SAST tradicionais nao pegam.

#### O que foi feito
- **SECURITY.md v1.1.0**: Adicionado **Mode 3: AUTOMATED SCAN** com `/security-review`, Step 0 no Review Process, items nas checklists, secao CI/CD com GitHub Actions
- **SAFETY_PROTOCOL.md**: Quality Loop atualizado (6 fases) — Fase 4 agora e SECURITY SCAN para features que tocam auth/RLS/Edge Functions/dados sensiveis
- **GitHub Actions**: Criado `.github/workflows/security-review.yml` com scan automatico em PRs para `main`, instrucoes customizadas para ameacas DashMedPro-especificas

#### Como usar
- **CLI (Recomendado)**: Rodar `/security-review` no Claude Code — usa assinatura Max, sem custo extra
- **GitHub Actions (Opcional)**: Automatico em PRs — requer `CLAUDE_API_KEY` nos GitHub Secrets (API paga separada)

#### Arquivos
- `.claude/agents/SECURITY.md` — Mode 3, Step 0, checklists, CI/CD
- `.claude/agents/SAFETY_PROTOCOL.md` — Quality Loop Fase 4
- `.github/workflows/security-review.yml` — GitHub Actions workflow

---

## Safety Protocol (J.A.R.V.I.S.)

> TODAS as regras em `.claude/agents/SAFETY_PROTOCOL.md` sao OBRIGATORIAS.
> Consulte ANTES de qualquer mudanca destrutiva.

Regras criticas:
1. NUNCA faca DROP TABLE/COLUMN
2. NUNCA delete codigo que funciona
3. NUNCA mude autenticacao sem aprovacao
4. NUNCA execute migrations destrutivas
5. SEMPRE faca pre/post flight check (npm run build)
6. Modo SOMENTE-ADITIVO: em duvida, ADICIONE, nunca remova

---

### Sessao 22/02/2026 — Doctor Strange QA System + Claude Code Security

#### 1. Claude Code Security Integration
- Integrado `/security-review` no agente Captain America (SECURITY)
- Adicionado Mode 3 (AUTOMATED SCAN) e Step 0 no Review Process
- Criado `.github/workflows/security-review.yml` (GitHub Actions, OPCIONAL — requer API key separada)
- Quality Loop ampliado para 6 fases (Fase 4: SECURITY SCAN)
- Prioridade: uso local via CLI (coberto pela assinatura Max)

#### 2. Doctor Strange QA System (NOVO)
- **Agente**: Doctor Strange (QA_ENGINEER) — `.claude/agents/QA_ENGINEER.md`
- **7 fluxos de integracao E2E** testando fluxos cross-module contra Supabase real:
  - Flow 1: CRM → Agendamento → Financeiro (o mais critico)
  - Flow 2: Pipeline Transitions (lead_novo → agendado → inadimplente → follow_up → aguardando_retorno)
  - Flow 3: Sinal Payment (pagamento parcial + restante)
  - Flow 4: Inventory Deduction FEFO (First Expire First Out)
  - Flow 5: Medical Records + Prescriptions
  - Flow 6: WhatsApp Auto-Lead Creation
  - Flow 7: Secretary Permissions (RLS)
- **Infraestrutura**: `scripts/qa/config.ts` (clients + auth + cleanup) + `helpers.ts` (assertions + reporting)
- **Orquestrador**: `scripts/qa/run-all.ts` → `npm run test:qa`
- **Cleanup**: Dados tagueados com `QA_{timestamp}`, limpeza automatica apos execucao
- **Regra**: SEMPRE atualizar scripts de teste quando features novas forem inseridas

**Arquivos criados**:
- `.claude/agents/QA_ENGINEER.md`
- `scripts/qa/config.ts`, `helpers.ts`, `run-all.ts`
- `scripts/qa/test-flow-1-crm-to-financial.ts` a `test-flow-7-secretary-permissions.ts`
- `.github/workflows/security-review.yml`

**Arquivos modificados**:
- `.claude/CLAUDE.md` — Doctor Strange no squad, auto-activation rules, test update rule
- `.claude/agents/SECURITY.md` — Mode 3, Step 0, checklists
- `.claude/agents/SAFETY_PROTOCOL.md` — Quality Loop Phase 4
- `package.json` — Scripts test:qa

---

### Sessao 03/03/2026 — Evolution API Integration (Dual WhatsApp Provider)

#### Contexto
Implementacao da Evolution API como segundo provedor WhatsApp. Usuarios podem escolher entre Meta Business API (oficial) ou Evolution API (conexao via QR Code, sem conta Business necessaria).

#### Arquitetura Dual Provider
```
whatsapp_config.provider: 'meta' | 'evolution'
- Meta: Graph API v18.0 (existente, sem mudancas)
- Evolution: Self-hosted Docker (atendai/evolution-api:v2.2.3)
- Ambos normalizam para whatsapp_messages/conversations
- AI agent (whatsapp-ai-agent) funciona identicamente para ambos
```

#### Migration SQL
- `whatsapp_provider` ENUM ('meta', 'evolution')
- `whatsapp_config`: +4 colunas (evolution_instance_name, evolution_instance_token, evolution_api_url, evolution_instance_status)
- `whatsapp_conversations` e `whatsapp_messages`: +coluna `provider`

#### Arquivos Criados (4)
- `supabase/migrations/20260303000001_add_evolution_provider.sql`
- `supabase/functions/evolution-instance/index.ts` — Gerencia ciclo de vida (create, connect/QR, status, delete)
- `supabase/functions/evolution-webhook/index.ts` — Recebe webhooks Evolution (messages.upsert, connection.update)
- `src/components/whatsapp/settings/ProviderSelector.tsx` — Selecao Meta vs Evolution
- `src/components/whatsapp/settings/EvolutionSetup.tsx` — Setup 3-step (config → QR code → conectado)

#### Arquivos Modificados (6)
- `supabase/functions/whatsapp-send-message/index.ts` — Provider branching no envio
- `supabase/functions/whatsapp-ai-agent/index.ts` — sendWA + sendTyping + mark-as-read por provider
- `src/hooks/useWhatsAppConfig.tsx` — isConfigured considera ambos providers
- `src/pages/WhatsAppSettings.tsx` — ProviderSelector + EvolutionSetup + badge provider
- `src/types/whatsapp.ts` — WhatsAppProvider type + campos Evolution
- `supabase/config.toml` — evolution-webhook verify_jwt=false

#### Deploy
- 4 Edge Functions deployadas: evolution-instance, evolution-webhook, whatsapp-send-message, whatsapp-ai-agent
- Evolution API server: `https://imperius-evolution-api.ehparc.easypanel.host/`
- Secrets configurados: `EVOLUTION_GLOBAL_API_KEY`, `EVOLUTION_API_URL`

---

### Sessao 03/03/2026 — Lucid UI Medical Calendar Redesign

#### Contexto
Redesign visual completo da agenda medica com novo design system "Lucid UI" e otimizacao mobile.

#### Mudancas
- Nova interface de agenda com melhor UX
- Otimizacao responsiva para mobile/tablet
- PWA improvements, iOS safe areas, code splitting

---

### Sessao 04/03/2026 — Project Cleanup + CLAUDE.md Rewrite

#### Cleanup
- **45 arquivos deletados** (8821 linhas removidas):
  - `docs/` inteiro (33 MDs + 2 PNGs de tutoriais e guias)
  - `PLAN.md`, `.lovable/`, `.agent/`, `.cursor/plans/`, `.cursor/CLAUDE.md`
  - `public/frontend/`, `dist/frontend/` (demo components)
  - `.claude/scripts de vendas.md`, `.claude/agents/AGENTE.md`

#### CLAUDE.md Root Rewrite
- Reescrito completamente com estado atual do projeto
- Removidos 25+ entradas "Contexto Atual" antigas (Jan-Feb 2026)
- Adicionado: modulo estoque, Evolution API, Cortana, Edge Functions atualizadas
- Versao atualizada para 1.0.0

---

**Version:** 1.0.0 | 2026-03-04 | DevSquad Avengers + Evolution API + Inventory Module
