# DashMedPro - Context Guide

> **IMPORTANTE**: Para o sistema completo de agentes AI (DevSquad Avengers), consulte `.claude/CLAUDE.md`.
> **SDD (Spec-Driven Development)**: Features novas DEVEM seguir o fluxo `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`. Constitution em `.specify/memory/constitution.md`. Specs em `specs/<feature-name>/`. Bug fixes seguem o pipeline Detective → Researcher → Fixer → Guardian (sem SDD).

## Overview
Sistema CRM medico integrado com agenda, prontuarios, pipeline de pacientes, gestao financeira, estoque e WhatsApp via Supabase RLS.

## Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** Supabase (PostgreSQL + RLS) — Project Ref: `adzaqkduxnpckbcuqpmg`
- **Styling:** TailwindCSS + shadcn/ui (Radix)
- **State:** TanStack Query v5, React Hook Form + Zod
- **Key libs:** FullCalendar, Recharts, date-fns, Framer Motion, dnd-kit
- **Edge Functions:** Deno runtime (supabase/functions/)
- **WhatsApp AI:** GPT-4o (agente humanizado) + GPT-4o-mini (extracao de dados)
- **WhatsApp Providers:** Meta Business API (oficial) + Evolution API (QR Code)

## Estrutura
```
src/
├── components/          # UI organizado por dominio
│   ├── crm/            # Pipeline, deals, contatos
│   ├── medical-calendar/ # Agendamentos medicos (Lucid UI design)
│   ├── medical-records/ # Prontuarios
│   ├── financial/      # Transacoes e contas
│   ├── inventory/      # Estoque, lotes, FEFO, fornecedores, ABC, turnover
│   ├── whatsapp/       # Inbox, chat, automacoes WhatsApp
│   │   ├── chat/       # ChatWindow, MessageBubble, ChatInput
│   │   ├── inbox/      # ConversationList, ConversationFilters
│   │   ├── ai/         # AISettingsDialog, LeadScoreBadge
│   │   └── settings/   # ProviderSelector, EvolutionSetup, CredentialsForm
│   ├── marketing/      # Meta Ads, UTMs, campanhas
│   ├── cortana/        # Assistente de voz AI (ElevenLabs)
│   └── ui/             # shadcn/ui base components
├── hooks/              # Custom hooks (useCRM, useMedicalAppointments, useInventory, etc)
├── pages/              # Rotas principais
├── types/              # TypeScript types por dominio
├── lib/                # Utils e helpers
├── services/cortana/   # Servicos da assistente Cortana
├── integrations/supabase/ # Cliente e types gerados
├── supabase/
│   └── functions/      # Edge Functions (15+)
├── docker/
│   └── evolution-api/  # Docker Compose para Evolution API self-hosted
└── scripts/
    └── qa/             # Doctor Strange — 7 fluxos de teste E2E
```

## Modulos Principais

### CRM & Pipeline
- **useCRM** — Gestao de deals, contatos e pipeline
- **PipelineBoard** — Kanban drag-and-drop (dnd-kit)
- **ContactForm** — Cadastro pacientes com health_insurance_type
- Stages: `lead_novo` → `agendado` → `em_tratamento` → `inadimplente` | `aguardando_retorno`

### Agenda Medica (Lucid UI)
- **useMedicalAppointments** — CRUD consultas + automacao pipeline + transacoes
- **AppointmentCard** — Cards com botoes inline (Compareceu, Falta, Editar, Excluir)
- **MonthlyCalendarView** + **DailyAppointmentsList** — Layout responsivo mobile-first
- **AppointmentMetrics** — KPIs com scroll horizontal em mobile

### Prontuarios
- **MedicalRecordForm** — Prontuarios com is_in_treatment flag
- Prescricoes e historico medico

### Financeiro
- **financial_transactions** — Lancamentos automaticos ao concluir consultas
- **financial_accounts** — Contas bancarias com seletor de cores
- Integracao com estoque (notas de entrada geram despesas)

### Estoque (8 abas)
- **useInventory** — CRUD produtos + lotes + movimentacoes
- **useInventoryAlerts** — Alertas: vencido, critico (7d), aviso (30d), estoque baixo
- **useABCAnalysis** — Classificacao Pareto (A=80%, B=95%, C=100%)
- **useStockTurnover** — Giro: alto (15d), medio (45d), baixo (90d), parado
- **useInventoryReports** — Consumo mensal, projecao reposicao, perdas
- **useInventoryTransaction** — Notas de entrada/saida com criacao automatica de lotes
- **useSuppliers** — CRUD fornecedores (soft delete)
- FEFO: First Expire First Out (deduz do lote mais proximo de vencer)
- Trigger SQL: `handle_inventory_movement()` atualiza saldo automaticamente

### WhatsApp (Dual Provider)
- **Provider Meta:** API oficial WhatsApp Business via Graph API v18.0
- **Provider Evolution:** Conexao via QR Code (Evolution API v2, self-hosted)
- **useWhatsAppConfig** — Config com suporte a ambos providers
- **ProviderSelector** — Escolha entre Meta e Evolution
- **EvolutionSetup** — Fluxo 3 steps (configurar → QR Code → conectado)
- **whatsapp-ai-agent** — Agente GPT-4o humanizado (5 fases medicas)
- **whatsapp-send-message** — Branching automatico por provider
- **evolution-instance** — Edge Function: create/connect/status/delete instancias
- **evolution-webhook** — Edge Function: recebe webhooks Evolution, normaliza dados

### Meta Ads & Marketing
- **useMetaOAuth** — Hook centralizado para OAuth Facebook
- **sync-ad-campaigns** — Sincronizacao em batches de 5 (evita rate limit)
- Graph API v22.0 para Ads/OAuth

### Cortana (Assistente de Voz)
- ElevenLabs conversational AI
- Integracao com CRM via clientTools

## Database — Tabelas Principais

### Core
- `crm_contacts` — pacientes (name, email, phone, health_insurance_type)
- `crm_deals` — oportunidades (contact_id, stage, is_in_treatment, value)
- `medical_appointments` — consultas (contact_id, doctor_id, status, payment_status)
- `medical_records` — prontuarios (contact_id, doctor_id, diagnosis, treatment_plan)
- `financial_transactions` — lancamentos (account_id, amount, type, transaction_date)
- `financial_accounts` — contas bancarias
- `secretary_doctor_links` — many-to-many secretaria↔medicos
- `profiles` — usuarios (full_name, email, role, organization_id)

### Estoque
- `inventory_items` — produtos (name, unit, category, min_stock, sell_price, cost_price)
- `inventory_batches` — lotes (batch_number, expiration_date, quantity)
- `inventory_movements` — movimentacoes (type: IN/OUT/ADJUST/LOSS, quantity, batch_id)
- `inventory_suppliers` — fornecedores (name, cnpj, email, phone)
- `inventory_transactions` — notas de entrada/saida (cabecalho)
- `inventory_transaction_items` — itens da nota (linhas)
- `appointment_stock_usage` — consumo por consulta

### WhatsApp
- `whatsapp_config` — config por usuario (provider: 'meta'|'evolution', access_token, evolution_instance_name, evolution_api_url)
- `whatsapp_conversations` — conversas (phone_number, contact_name, ai_autonomous_mode, ai_lock_until, provider)
- `whatsapp_messages` — mensagens (content, direction, message_type, status, provider)
- `whatsapp_ai_config` — config IA (agent_name, clinic_name, knowledge_base, auto_reply_enabled, auto_scheduling_enabled)
- `sofia_knowledge_base` — RAG com pgvector embeddings (1536 dims)
- `whatsapp_lead_qualifications` — dados do lead (nome, procedimento, convenio, urgencia)

### RLS Policies (3 niveis)
- **Medicos**: `user_id = auth.uid()` — acesso a proprios dados
- **Secretarias**: acesso via `secretary_doctor_links` JOIN
- **Admin/Dono**: acesso total via `is_admin_or_dono()`

## Edge Functions
```
supabase/functions/
├── whatsapp-webhook/            # Recebe msgs Meta (verify_jwt: false) → trigger AI
├── whatsapp-send-message/       # Envia msgs via Meta ou Evolution (branching por provider)
├── whatsapp-ai-agent/           # Agente GPT-4o humanizado (lock, debounce, RAG, 5 fases)
│   ├── index.ts                 # Handler principal (~630 linhas)
│   ├── router.ts                # Deteccao de fase heuristica
│   └── prompt.ts                # Prompts por fase + identidade
├── whatsapp-ai-analyze/         # Legacy: analise GPT-4o-mini (backup)
├── evolution-instance/          # CRUD instancias Evolution API (create/connect/status/delete)
├── evolution-webhook/           # Recebe webhooks Evolution (verify_jwt: false)
├── sofia-generate-embedding/    # Gera embeddings para RAG
├── whatsapp-config-validate/    # Valida tokens e configura webhook Meta
├── whatsapp-list-accounts/      # Lista WABAs do Business Manager
├── meta-token-exchange/         # OAuth token exchange (v22.0)
├── meta-oauth-callback/         # OAuth callback + asset discovery (v22.0)
├── sync-ad-campaigns/           # Sincroniza campanhas Meta Ads (v22.0, batches de 5)
├── manage-ad-campaign/          # Pause/Activate campanhas
├── test-ad-connection/          # Testa conexao Meta Ads
└── facebook-leadgen-webhook/    # Webhook de leads do Facebook
```

## Scripts
```bash
npm run dev           # Vite dev server (port 8080)
npm run build         # Production build
npm run lint          # ESLint check
npm run test:qa       # Doctor Strange — 7 integration test flows
npm run test:qa:flowN # Flow especifico (N=1-7)
```

## Decisoes Arquiteturais
- **Pipeline automatico**: Consultas agendadas → deal `agendado`; sinal nao pago → `inadimplente`
- **RLS granular**: Secretaria precisa link explicito em `secretary_doctor_links`
- **Transacoes financeiras**: Auto-criadas ao marcar consulta como `completed` SE payment_status=paid
- **WhatsApp Dual Provider**: Meta (API oficial) e Evolution (QR Code) — provider field em config/conversations/messages
- **WhatsApp Token Storage**: `access_token` em `whatsapp_config` (nao Vault)
- **Webhook JWT**: Desabilitado para Meta e Evolution webhooks (`verify_jwt = false`)
- **IA Agente Humanizado**: GPT-4o com 5 fases medicas, lock atomico PostgreSQL, RAG pgvector
- **AI Agent Identity**: Nome, clinica, especialista configuraveis por usuario em `whatsapp_ai_config`
- **Evolution API**: Self-hosted Docker, Global API Key para admin, Instance Token para mensagens
- **Meta Ads**: FB.login() + code exchange, long-lived token (60 dias), Graph API v22.0
- **Estoque FEFO**: Trigger SQL atualiza saldo do lote ao inserir movimento
- **Estoque ABC/Turnover**: Classificacao Pareto + analise de giro calculadas no frontend
- **Mobile-first**: Responsive Tailwind com breakpoints `sm:`, touch targets h-8/h-9, icon-only buttons em mobile

## Known Issues
- **403 em crm_deals**: RLS pode bloquear INSERT/UPDATE em pipeline automation
- **Conta financeira ausente**: Toast warning se nao houver `financial_accounts` ativa
- **WhatsApp Token Expiration**: Tokens Meta expiram periodicamente
- **Meta OAuth HTTPS**: Facebook requer HTTPS (usar ngrok para dev local)
- **406 em update+select+single**: RLS bloqueia read-back apos PATCH — usar `.update().eq()` sem `.select().single()`
- **meta_oauth record**: `account_id = 'meta_oauth'` NAO e conta de anuncios — SEMPRE filtrar

## Licoes Aprendidas
- `.select().single()` apos UPDATE com RLS restritiva causa 406 — remover quando nao precisa do dado retornado
- `Promise.all` com muitos items causa rate limit — usar batch processing (5 por vez)
- Colunas inexistentes em upsert sao rejeitadas silenciosamente via `supabase.functions.invoke`
- NUNCA usar `.catch()` em queries Supabase no Deno (supabase-js v2 retorna `PromiseLike`, nao `Promise`)
- Record `meta_oauth` em `ad_platform_connections` NAO e conta real — filtrar com `.filter(c => c.account_id !== 'meta_oauth')`
- Deploy Edge Functions: `SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy <nome> --project-ref adzaqkduxnpckbcuqpmg`
- Evolution API: phone format JID (`5511999999999@s.whatsapp.net`) — strip `@s.whatsapp.net` para storage

---
**Version:** 1.0.1 | 2026-03-11 | https://github.com/seckerIA/dashmedpro

### Contexto Atual do CLAUDE.md
- Adicionado filtro por tags ('meta_ads', 'indicacao') nas visualizações de Lista (LeadsList.tsx) e Funil (PipelineManagement.tsx) do CRM.
- Integrado Calculadora de ROI com CRM via `useCRM` para preenchimento de Leads Gerados e Mínimo/Máximo de Taxa de Conversão.
