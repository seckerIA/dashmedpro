# DashMedPro — Agent System & Project Guide

> **DevSquad DashMedPro** — Time de agentes AI especializados para desenvolvimento do CRM medico.
> Este arquivo e o CEREBRO do sistema. Consulte SEMPRE antes de iniciar qualquer tarefa.

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
5. Captain America (SECURITY) -> Review final
6. Vision (SYSTEM)        -> Deploy, docs
```

### Ordem Tipica para Bug Fixes

```
1. Black Widow (DETECTIVE)  -> Investigar e coletar evidencias
2. Hawkeye (RESEARCHER)     -> Pesquisar solucao
3. Spider-Man (FIXER)       -> Implementar fix cirurgico
4. Hulk (GUARDIAN)          -> Validar que nao quebrou nada
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
- `whatsapp_conversations`: conversas com contatos
- `whatsapp_messages`: mensagens enviadas/recebidas

### Pipeline Stages
`lead_novo` -> `agendado` -> `em_tratamento` -> `inadimplente` | `aguardando_retorno`

### RLS Policies
- **Medicos**: `user_id = auth.uid()` — acesso a proprios dados
- **Secretarias**: acesso via `secretary_doctor_links` JOIN
- **Admin/Dono**: acesso total

### Edge Functions
```
supabase/functions/
├── whatsapp-webhook/         # Recebe mensagens do Meta (v18.0)
├── whatsapp-send-message/    # Envia mensagens via Graph API (v18.0)
├── whatsapp-ai-analyze/      # Analise de conversas com GPT-4o-mini
├── whatsapp-config-validate/ # Valida tokens e configura webhook
├── meta-token-exchange/      # OAuth token exchange do Meta Business (v22.0)
├── meta-oauth-callback/      # OAuth callback + asset discovery (v22.0)
├── sync-ad-campaigns/        # Sincroniza campanhas Meta Ads (v22.0)
├── manage-ad-campaign/       # Pause/Activate campanhas Meta Ads (v22.0)
├── test-ad-connection/       # Testa conexao Meta Ads via Graph API (v22.0)
```

### Scripts
```bash
npm run dev           # Vite dev server (port 8080)
npm run build         # Production build
npm run lint          # ESLint check
```

---

## Decisoes Arquiteturais

- **Pipeline automatico**: Consultas agendadas -> deal `agendado`; sinal nao pago -> `inadimplente`
- **RLS granular**: Secretaria precisa link explicito em `secretary_doctor_links`
- **Transacoes financeiras**: Auto-criadas ao marcar consulta como `completed` SE payment_status=paid
- **WhatsApp Token Storage**: `access_token` em `whatsapp_config` (nao Vault)
- **Webhook JWT**: Desabilitado para Meta webhooks (`verify_jwt = false`)
- **IA no WhatsApp**: Analise via GPT-4o-mini, qualificacao de leads
- **Meta Ads**: FB.login() + code exchange, long-lived token (60 dias), Graph API v22.0
- **Meta OAuth**: `useMetaOAuth` hook centralizado (useWhatsAppOAuth deprecado)
- **ROAS**: Calculado via `action_values.purchase` / `spend` na sync de campanhas

---

## Known Issues
- **403 em crm_deals**: RLS pode bloquear INSERT/UPDATE em pipeline automation
- **Conta financeira ausente**: Toast warning se nao houver `financial_accounts` ativa
- **WhatsApp Token Expiration**: Tokens Meta expiram periodicamente
- **Meta OAuth HTTPS**: Facebook requer HTTPS (usar ngrok para dev local)

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

**Version:** 0.5.0 | 2026-02-14 | DevSquad Avengers Edition
