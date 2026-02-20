# DashMedPro - Context Guide

> **IMPORTANTE**: Para o sistema completo de agentes AI (DevSquad Avengers), consulte `.claude/CLAUDE.md`.
> Ele contem as regras de ativacao automatica, squads, e protocolos de seguranca.

## Overview
Sistema CRM médico integrado com agenda, prontuários, pipeline de pacientes e gestão financeira via Supabase RLS.

## Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** TailwindCSS + shadcn/ui (Radix)
- **State:** TanStack Query v5, React Hook Form + Zod
- **Key libs:** FullCalendar, Recharts, date-fns, Framer Motion, dnd-kit

## Estrutura
```
src/
├── components/          # UI organizado por domínio
│   ├── crm/            # Pipeline, deals, contatos
│   ├── medical-calendar/ # Agendamentos médicos
│   ├── medical-records/ # Prontuários
│   ├── financial/      # Transações e contas
│   ├── whatsapp/       # Inbox, chat, automações WhatsApp
│   │   ├── chat/       # ChatWindow, MessageBubble, ChatInput
│   │   ├── inbox/      # ConversationList, ConversationFilters
│   │   └── settings/   # Configuração de tokens e webhooks
│   └── ui/             # shadcn/ui base components
├── hooks/              # Custom hooks (useCRM, useMedicalAppointments, etc)
├── pages/              # Rotas principais
├── types/              # TypeScript types por domínio
├── lib/                # Utils e helpers
├── integrations/supabase/ # Cliente e types gerados
└── supabase/
    └── functions/      # Edge Functions (whatsapp-webhook, whatsapp-send-message)
```

## Padrões

### Nomenclatura
- Componentes: PascalCase (e.g., `AppointmentForm.tsx`)
- Hooks: camelCase prefixado `use` (e.g., `useCRM.tsx`)
- Types: PascalCase + sufixo (e.g., `CRMContactInsert`, `MedicalAppointmentWithRelations`)

### Estrutura de Hook
```typescript
// Pattern: TanStack Query + mutations + helpers
export function useResourceName(filters?) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['resource-name', filters],
    queryFn: async () => { /* fetch */ },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => { /* insert */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-name'] });
      toast({ title: 'Success' });
    },
  });

  return { data, isLoading, createMutation, ... };
}
```

### Importações
```typescript
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
```

## Componentes/Módulos Key
- **useCRM** - Gestão de deals, contatos e pipeline CRM
- **useMedicalAppointments** - CRUD consultas + automação pipeline + transações
- **useSecretaryDoctors** - Vinculo secretária-médicos (tabela `secretary_doctor_links`)
- **useWhatsAppMessages** - Mensagens WhatsApp com sendText mutation
- **useWhatsAppConversations** - Conversas e inbox WhatsApp
- **PipelineBoard** - Kanban drag-and-drop (dnd-kit) para stages
- **AppointmentForm** - Form consultas com sinal, payment_status e estimated_value
- **MedicalRecordForm** - Prontuários com is_in_treatment flag
- **ContactForm** - Cadastro pacientes com health_insurance_type e dados médicos
- **ChatWindow** - Interface de chat WhatsApp com envio/recebimento de mensagens
- **ConversationFilters** - Filtros de inbox com acesso a configurações

## Database/APIs

### Tabelas Principais
- `crm_contacts`: pacientes (name, email, phone, health_insurance_type, birth_date)
- `crm_deals`: oportunidades (contact_id, user_id, stage, is_in_treatment, is_defaulting, value)
- `medical_appointments`: consultas (contact_id, doctor_id, status, payment_status, sinal_amount, sinal_paid, estimated_value)
- `medical_records`: prontuários (contact_id, doctor_id, diagnosis, treatment_plan, is_in_treatment)
- `financial_transactions`: lançamentos (account_id, category_id, amount, type, transaction_date)
- `secretary_doctor_links`: many-to-many secretária↔médicos

### Tabelas WhatsApp
- `whatsapp_config`: Configuração por usuário (phone_number_id, business_account_id, access_token, webhook_verify_token)
- `whatsapp_conversations`: Conversas com contatos (phone_number, contact_name, last_message_at, unread_count)
- `whatsapp_messages`: Mensagens enviadas/recebidas (conversation_id, content, direction, message_type, status)
- `whatsapp_media`: Mídia anexada às mensagens (message_id, media_type, url, mime_type)
- `whatsapp_internal_notes`: Notas internas por conversa (conversation_id, user_id, content)
- `whatsapp_templates`: Templates de mensagem pré-aprovados
- `whatsapp_quick_replies`: Respostas rápidas personalizadas

### Pipeline Stages (crm_pipeline_stage enum)
- `lead_novo` → `agendado` → `em_tratamento` → `inadimplente` | `aguardando_retorno`
- Legacy: `qualificado`, `apresentacao`, `proposta`, `negociacao`, `fechado_ganho`, `fechado_perdido`

### RLS Policies
- Médicos: acesso a próprios dados (`user_id = auth.uid()`)
- Secretárias: acesso via `secretary_doctor_links` join
- Admin/Dono: acesso total

## Scripts
```bash
npm run dev           # Vite dev server (port 8080)
npm run build         # Production build
npm run lint          # ESLint check
```

## Contexto Atual (2026-01-03)

### Última Sessão
- **Sistema de IA para WhatsApp** implementado:
  - Tabelas: `whatsapp_conversation_analysis`, `whatsapp_ai_suggestions`, `whatsapp_ai_config`
  - Tipos ENUM: `whatsapp_lead_status`, `whatsapp_urgency_level`, `whatsapp_sentiment`, `whatsapp_suggestion_type`
  - Funções RPC: `get_hot_leads()`, `get_pending_followups()`, `get_ai_stats()`
  - Hook `useWhatsAppAI` para análise de conversas via GPT-3.5
  - Componentes: `LeadScoreBadge`, `AISuggestionsPanel`, `ConversationInsights`
  - Integração no ChatWindow: botão IA no header, badge de status, sugestões inline
  - Edge Function `whatsapp-ai-analyze` (pendente deploy + OPENAI_API_KEY)
- **Remoção de código duplicado**: SmartReplyDialog removido, fluxo unificado via IA

### Decisões Arquiteturais
- **Pipeline automático**: Consultas agendadas → deal `agendado`; sinal não pago → `inadimplente`; concluída paga → `aguardando_retorno`
- **RLS granular**: Secretária precisa link explícito em `secretary_doctor_links` para ver agendas
- **Transações financeiras**: Auto-criadas ao marcar consulta como `completed` SE payment_status=paid
- **WhatsApp Token Storage**: `access_token` armazenado em `whatsapp_config` (não Vault, pois não há `read_secret`)
- **Webhook JWT**: Desabilitado (`verify_jwt = false` em config.toml) pois Meta não envia JWT
- **Dual doctor support**: `doctor_id` (FK explícito) OR `user_id` (fallback) em appointments
- **IA no WhatsApp**: Análise via GPT-3.5, qualificação de leads (novo/frio/morno/quente/convertido/perdido)

### Edge Functions WhatsApp
```
supabase/functions/
├── whatsapp-webhook/        # Recebe mensagens do Meta (verify_jwt: false)
├── whatsapp-send-message/   # Envia mensagens via Graph API v18.0
├── whatsapp-config-validate/ # Valida tokens e configura webhook
├── whatsapp-ai-analyze/     # Análise de conversas com GPT-3.5 (pendente deploy)
```

### Pendências de Deploy
1. **Edge Function whatsapp-ai-analyze**: Fazer deploy via Supabase Dashboard ou CLI autenticado
2. **OPENAI_API_KEY**: Configurar no Supabase Secrets (`npx supabase secrets set OPENAI_API_KEY=sk-...`)

### Known Issues
- **403 em crm_deals**: Pipeline automation funciona mas RLS pode bloquear INSERT/UPDATE
- **Conta financeira ausente**: Toast warning se não houver `financial_accounts` ativa
- **WhatsApp Token Expiration**: Tokens Meta expiram periodicamente, reconfigurar quando necessário
- **Webhook Meta**: Configurar callback URL no Meta Business Manager após deploy

### Contexto Atual (Janeiro 2026 - Sprint Frontend & Bugfixes)
- **Settings Page Fix**: Corrigido salvamento de avatar e nome de perfil que não funcionava
  - **Bug**: Ao remover avatar ou alterar nome, as mudanças não persistiam após reload
  - **Causa**: (1) Falta de invalidação do cache Redis, (2) Tipo incorreto em `onUploadComplete` (string vazia vs null), (3) Erros TypeScript com `as any`
  - **Fix**: 
    - `AvatarUpload.tsx`: Adicionado `cacheDelete(CacheKeys.userProfile(user.id))` em upload e remoção, mudado retorno de `''` para `null`
    - `ProfileTab.tsx`: Adicionado `cacheDelete` na mutation de update, corrigido tipo com `as never`
  - Arquivos alterados: `src/components/settings/AvatarUpload.tsx`, `src/components/settings/ProfileTab.tsx`
- **Frontend Analysis**: Auditoria completa do UI/UX via localhost:8080
  - Identificadas 10 melhorias prioritárias (skeleton loading, estados vazios, indicadores de atraso, etc)
  - Documentação: `docs/FRONTEND_IMPROVEMENTS.md` (a ser criada)

---
**Version:** 0.4.0 | 2026-01-13 | https://github.com/seckerIA/dashmedpro

### Contexto Atual (16/01/2026 - Sprint UI Financeiro & Otimizações)
- **Melhorias no Módulo Financeiro**:
  - **Account Deletion**: Substituído `window.confirm` nativo por componente `AlertDialog` do Shadcn UI para melhor UX/UI.
  - **Account Form**: Adicionado formatação de moeda em tempo real (`initial_balance`) e seletor de cores pré-definidas (bolinhas) com opção customizada.
  - **Nova Conta Card**: Adicionado card visual "Adicionar Nova Conta" diretamente no grid de contas bancárias.
- **Padronização de UI**:
  - **DatePicker**: Substituição de inputs nativos `type="date"` pelo componente `DatePicker` (Shadcn + date-fns) em vários formulários (`SalesCallForm`, `CampaignForm`, `PatientInfoTab`, `TransactionForm`).
- **Otimização de Performance**:
  - **Sidebar**: Corrigido "travamento" (jank) na animação de recolhimento prevenindo quebra de linha de texto (`whitespace-nowrap`) durante a transição CSS.
- **Fixes**:
  - Restaurada lógica de fechamento de tags HTML perdidas em `Financial.tsx`.

### Contexto Atual (17/01/2026 - Secretary Dashboard Data Fix)
- **Correção de Dados no Dashboard da Secretária**:
  - **Bug (NaN)**: Os badges de "Sinais e Pagamentos" e métricas de "Produtividade" mostravam `NaN` ou valores vazios.
  - **Causa**: O componente `SecretaryDashboard.tsx` acessava propriedades inexistentes nos objetos retornados pelos hooks (ex: `pendingSinais` em vez de `pendingCount`, `totalCalls` em vez de `callsToday`).
  - **Correção**: Atualizado `SecretaryDashboard.tsx` para usar as propriedades corretas definidas nas interfaces TypeScript (`SecretarySinalMetrics`, `ProductivityMetrics`).

### Contexto Atual (17/01/2026 - Secretary Permissions & Calendar Fix)
- **Bug Fix (Pipeline Visibility):** Secretárias não viam o pipeline dos médicos.
  - Correção na Edge Function `update-team-user` para permitir que médicos editem secretárias vinculadas (resolvendo erro 403).
  - Aplicação de nova política RLS em `secretary_doctor_links` permitindo que médicos gerenciem vínculos.
  - Correção no frontend (`TeamManagement.tsx`) para usar a nova lógica de vínculos.
- **Bug Fix (Checkbox Loop):** Checkbox de seleção de médicos em `TeamManagement` não funcionava.
  - Causa: Loop infinito no `useEffect` devido a função `getLinksForSecretary` não memoizada.
  - Correção: Uso de `useCallback` no hook `useSecretaryDoctors`.
- **Bug Fix (Medical Calendar):** Secretária travava ao marcar "Compareceu" por não ter conta bancária própria.
  - Backend Logic: `useFinancialAccounts` agora retorna contas dos médicos vinculados quando o usuário é secretária.
  - Frontend Logic: `MedicalCalendar` não bloqueia mais a ação se a secretária não tiver conta pessoal, permitindo selecionar o banco do médico no modal de pagamento.
- **Status:** Testado e aprovado pelo usuário. Pipeline visível e fluxo de calendário funcional.

### Contexto Atual (19/01/2026 - Debugging AI Schedule Logic)
- **WhatsApp AI Analyze Fixes**:
  - Debug e resolução de alucinações de horários na agenda via GPT-3.5.
  - Identificados bugs de fuso horário (UTC vs UTC-3) e de sumarização ("Gap Mismatch").
  - Versão 49 implementou agrupamento por intervalos contíguos para evitar buracos na agenda.
  - **Status Atual**: Rollback para a **Versão 48** realizado a pedido do usuário (mantém análise completa de leads, mas possui o bug conhecido de sugerir horários ocupados em blocos resumidos).
  - Melhora nos logs de debug salvando `agendaContext` e `brazilTime` na tabela `debug_logs`.

### Contexto Atual (21/01/2026 - Data Reset e Seeding)
- **Data Reset & Seeding**:
  - Implementada função SQL `reset_and_seed_imperius` para limpar e repopular dados da organização "Imperius Tech".
  - **Recursos Populados**: Contatos (200+), Deals (Pipeline diversificado), Consultas (Histórico de 1 ano), Financeiro (Receitas e Despesas Recorrentes), Estoque, Tarefas e Campanhas de Marketing.
  - **Correções de Schema**: Identificados ajustes em enums e constraints (`inventory_movements_type_check`, `commercial_procedure_category`) para garantir integridade dos dados gerados.
  - **Administração**: Criadas páginas de administração (`AdminUsers`, `AdminMetrics`, `AdminSettings`) para gestão global do sistema (Super Admin).
- **Frontend Fixes**:
  - `TeamManagement.tsx`: Adicionada validação de permissões no frontend para criação de usuários.

### Contexto Atual (30/01/2026 - Realtime AI & RLS Fixes)
- **WhatsApp AI Realtime Subscriptions**:
  - `useWhatsAppAI.tsx`: Adicionado subscriptions de realtime para atualizar análises e sugestões de IA automaticamente quando há mudanças no banco.
  - Channels: `whatsapp_conversation_analysis` e `whatsapp_ai_suggestions` com invalidação automática de queries.
- **Edge Function Fixes**:
  - `whatsapp-ai-analyze`: Corrigido CORS headers (adicionados `cache-control`, `pragma`, `expires`, `x-requested-with`).
  - Fix de variável duplicada `CONFIDENCE_THRESHOLD` e adicionado tipo `system_message` ao enum `SuggestionType`.
- **Database Migrations**:
  - `20260221000005_fix_whatsapp_assignment_pool_fkey.sql`: Correção de FK no pool de atribuição de WhatsApp.
  - `20260221000006_fix_ai_rls_policies.sql`: Ajustes em políticas RLS para análise de IA.

### Contexto Atual (26/01/2026 - AI Data Extraction & UI Fixes)
- **WhatsApp AI Data Enrichment**:
  - Implementada lógica de extração autônoma de dados (CPF, Email, Nome, Endereço) diretamente da conversa do WhatsApp na Edge Function `whatsapp-ai-analyze`.
  - A IA agora detecta informações sensíveis e atualiza automaticamente as tabelas `crm_contacts` (email, full_name, custom_fields) e `patients` (cpf, name).
  - Adicionado log de debug (`debug_logs`) para rastrear atualizações de contatos via IA (`CRM Contact Enriched`).
- **UI/UX Fixes**:
  - `WhatsAppLayout.tsx`: Corrigido bug de sobreposição do botão de toggle da sidebar adicionando `relative` ao container.
  - `ContactInfo.tsx`:
    - Corrigido layout dos botões de ação ("Agendar" e "Ver no CRM") para ficarem lado a lado em grid.
    - Estilização aprimorada: removidas bordas brancas, aplicado background colorido suave (blue/green tints) para melhor contraste no tema dark.
    - Botão "Agendar" tornado sempre visível, com alerta amigável se o contato não estiver vinculado.
    - Corrigidos erros de tipagem TypeScript (`name` -> `full_name`, `avatar_url` removido).

### Contexto Atual (01/02/2026 - Cortana Integration Refactor)
- **Cortana AI Assistant Updates**:
  - `CortanaProvider.tsx`: Melhorias no gerenciamento de contexto e estado da assistente de voz.
  - `clientTools.ts`: Adicionadas novas ferramentas para integração Cortana-CRM.
  - `contextBuilder.ts`: Refatorado builder de contexto para melhor performance e precisão.
  - `cortana.ts`: Atualizações nas interfaces TypeScript para novos recursos.
- **Dashboard Components Refactor**:
  - `DoctorDashboard.tsx`: Estrutura de componentes mais limpa e otimizada.
  - `FutureOutlook.tsx`: Melhorias na exibição de dados de projeções futuras.
  - `NegotiationsWidget.tsx`: Aprimoramentos visuais e de performance no widget de negociações.
  - `SecretaryActivities.tsx`: Substituído pela versão V2 (arquivo original movido para `_DEPRECATED`).
  - `SecretaryActivitiesV2.tsx`: Nova versão com melhor arquitetura e UX.
- **Medical Calendar**:
  - `AppointmentForm.tsx`: Validações aprimoradas e melhor tratamento de erros.
- **Status**: Refatoração focada em manutenibilidade e preparação para futuras features da Cortana.

### Contexto Atual (02/02/2026 - Receipt Download & Follow-Up UI)
- **Receipt Download Fix**:
  - Implementada função `handleDownloadReceipt` em `SecretaryFinancial.tsx` e `SinalTab.tsx`.
  - Resolve problema de abrir recibos em nova aba criando um Blob URL e forçando o download programático com atributo `download`.
  - Corrigido import duplicado de `Loader2`.
- **Follow-Up Page Improvements**:
  - Adicionado botão "Voltar para WhatsApp" em `FollowUpPage.tsx`.
  - Botão estilizado com `variant="secondary"` para melhor visibilidade no tema dark.
  - Corrigido erro de sintaxe `Duplicate identifier 'Pause'` causado por import duplicado acidental.
- **Badge Component Fix**:
  - Atualizado `AppointmentStatusBadge` para corrigir warning do React sobre props booleanas inválidas no DOM.

### Contexto Atual (14/02/2026 - Cortana Prompt Too Long Fix + Quality Loop Protocol)
- **Bug Fix (Cortana "Prompt is too long")**:
  - **Erro**: ElevenLabs retornava "Prompt is too long" ao iniciar sessão da Cortana.
  - **Causa**: `dynamicVariables` enviavam `systemInstruction` (texto longo) + `currentDateTime` (redundante com `currentDate`+`currentTime`), inflando o prompt no ElevenLabs.
  - **Correção**:
    - `contextBuilder.ts`: Removido `systemInstruction` e `currentDateTime` das `dynamicVariables`. Instruções fixas devem estar no system prompt do agente no painel do ElevenLabs.
    - `CortanaProvider.tsx`: Adicionado tratamento de erro específico para "Prompt is too long" nos callbacks `onError` e `catch` de `startConversation`, exibindo mensagem amigável ao usuário.
  - **Recomendação**: Se o erro persistir, encurtar o System Prompt diretamente no painel do ElevenLabs (configuração do Agent).
  - Arquivos alterados: `src/services/cortana/contextBuilder.ts`, `src/components/cortana/CortanaProvider.tsx`
- **Quality Loop Protocol (Novo)**:
  - Criado protocolo de auto-verificação obrigatório para todos os agentes do DevSquad.
  - **5 Fases**: Pre-Flight → Implementação → Verificação → Re-Avaliação → Documentação.
  - Integrado em `.claude/CLAUDE.md` (seção dedicada) e `.claude/agents/SAFETY_PROTOCOL.md` (checklist J.A.R.V.I.S.).
  - **Regra de Ouro**: "Não declare CONCLUÍDO até que o build passe e você tenha RELIDO suas próprias mudanças."
  - Inclui atalho "Quality Loop Rápido" para tasks triviais (1-3 linhas).

### Contexto Atual (02/02/2026 - AI Auto-Reply & Lead Creation)
- **Otimização de Auto-Resposta do WhatsApp**:
  - Implementada lógica hierárquica em `whatsapp-ai-analyze`: Configuração Local da conversa tem prioridade, mas usa Configuração Global como fallback para novas conversas.
  - Banco de Dados: Removido valor padrão `true` da coluna `ai_autonomous_mode` em `whatsapp_conversations` para permitir estado `NULL` (herança).
- **Auto-Cadastramento de Leads**:
  - Atualizado `whatsapp-webhook` para criar automaticamente registros em `crm_contacts` e `crm_deals` (Pipeline Stage: Lead Novo) quando uma mensagem chega de um número desconhecido.
  - A conversa é criada com link automático para este novo contato.
- **Correções Adicionais**:
  - `WhatsAppSettings.tsx`: Correção na navegação de abas via URL params.
  - `whatsapp-ai-analyze`: Prompt da IA reforçado para priorizar "Base de Conhecimento" e evitar alucinações.

### Contexto Atual (13/02/2026 - Onboarding & UI Tweaks)
- **UI Updates**:
  - `AppSidebar.tsx`: Ocultada a rota `/marketing` da barra lateral (`hiddenUrls`) para simplificar a navegação.
- **Onboarding Testing**:
  - Criado usuário de teste (`testemedpro@gmail.com`) via bypass seguro no banco de dados para validar o fluxo completo de onboarding (Wizard -> Edge Function -> Dashboards).

### Contexto Atual (14/02/2026 - Meta Business Platform Integration)
- **Meta OAuth Scopes Fix**:
  - `useMetaOAuth.tsx`: Atualizado `META_SCOPES` para incluir apenas permissões aprovadas no App Review.
  - Removidos: `ads_read`, `catalog_management` (rejeitados pelo Meta). Adicionados: `pages_manage_metadata`, `pages_manage_ads`, `email`, `public_profile`.
- **accessToken Fallback Fix**:
  - `useMetaOAuth.tsx`: Quando FB.login retorna `accessToken` direto (sem code), agora chama `meta-token-exchange` corretamente.
  - `meta-token-exchange`: Edge Function agora aceita tanto `{ code }` quanto `{ access_token }`.
- **Edge Functions — Stubs Implementados**:
  - `test-ad-connection`: Implementada chamada real à Meta Graph API (`/me` + `/{account_id}`) com validação de token e status da conta.
  - `manage-ad-campaign`: Implementada chamada real `POST /{campaign_id}` para pause/activate campanhas Meta Ads.
- **ROAS Fix**:
  - `sync-ad-campaigns`: Adicionado `action_values` ao fetch de insights. ROAS agora calculado como `purchase_value / spend` (antes hardcoded 0).
- **Graph API Upgrade**: Todas as Edge Functions de Ads atualizadas de `v21.0` para `v22.0`.
- **useWhatsAppOAuth Deprecado**:
  - Hook renomeado para `_deprecated_useWhatsAppOAuth.tsx` (referenciava tabela inexistente `whatsapp_oauth_sessions`).
  - `FacebookConnectButton.tsx` e `WhatsAppSettings.tsx` migrados para usar `useMetaOAuth`.
  - `PhoneNumberSelector` atualizado para importar do hook deprecado (componente não mais utilizado).
- **Token Refresh Banner**:
  - `MetaIntegrationCard.tsx`: Adicionado banner amarelo de alerta quando token expira em < 7 dias, com botão "Renovar" que refaz FB.login().
- **Meta App Credentials**:
  - App ID: `1557514182198067` (configurar em `VITE_FB_APP_ID`)
  - App Secret: `2973953f9f307045913fe6e85dbcbba0` (configurar em Supabase Secrets como `FB_APP_SECRET`)
  - **Nota**: Permissões rejeitadas (ads_read, catalog_management, whatsapp_business_management, etc.) funcionam normalmente em dev com conta do criador do app.
- **Pendências**:
  - Configurar `FB_APP_SECRET` no Supabase Secrets: `npx supabase secrets set FB_APP_SECRET=2973953f9f307045913fe6e85dbcbba0`
  - Gravar screencasts para resubmeter permissões rejeitadas ao Meta App Review
  - WhatsApp Edge Functions ainda usam Graph API v18.0 (funcional, upgrade opcional)

### Contexto Atual (18/02/2026 - Meta Ads Schema Fix + WhatsApp BM Connect + Ad Account Selector)
- **Fix Schema Mismatches em Edge Functions** (commit `e8ec2d0`):
  - `sync-ad-campaigns`: Corrigido `campaign_name` → `platform_campaign_name`, removido `raw_data`, adicionados `budget`, `conversion_value`, `start_date`, `end_date`
  - `meta-oauth-callback`: Removidas colunas inexistentes (`organization_id`, `metadata`, `quality_rating`, `oauth_connected`, `oauth_expires_at`), Graph API v21→v22
  - `meta-token-exchange`: Removidos `organization_id`, `quality_rating` do path whatsapp_config
- **WhatsApp Business Connect via BM** (commit `c5f6969`):
  - Nova Edge Function `whatsapp-list-accounts` (list + connect WABAs from BM)
  - Novo componente `WhatsAppAccountPicker` com seleção de WABA/phone
  - Botão "Configurar" no `MetaIntegrationCard` para WhatsApp
- **Ad Account Selector para Sync Seletivo** (commit `16fb761`):
  - Novo componente `AdAccountSyncSelector` com checkboxes por conta, progresso de sync, e resultado por conta
  - Exclui record `meta_oauth` (não é conta real) de sync e contagens
  - Batch processing em `sync-ad-campaigns` (5 por vez, evita rate limit)
- **Fix 406 RLS Error** (commit `9948df3`):
  - `useUpdateAdPlatformConnection`: Removido `.select().single()` que causava 406 (RLS bloqueia read-back após PATCH)
- **Lições Aprendidas**:
  - `.select().single()` após UPDATE com RLS restritiva causa 406 — remover quando não precisa do dado retornado
  - `Promise.all` com muitos items causa rate limit — usar batch processing
  - Colunas inexistentes em upsert são rejeitadas silenciosamente via `supabase.functions.invoke`
  - Record `meta_oauth` na `ad_platform_connections` NÃO é conta de anúncios — sempre filtrar
  - Token de deploy do Supabase CLI está em `.env` como `SUPABASE_ACCES_TOKEN` (com typo)
### Contexto Atual (20/02/2026 - Sprint Agente IA Humanizado v5)
- **Migração para whatsapp-ai-agent**:
  - Webhook e Trigger (`trigger_whatsapp_ai_analysis`) agora apontam para a nova função `whatsapp-ai-agent`, substituindo a legada `whatsapp-ai-analyze`.
  - O novo agente possui arquitetura modular com `router.ts` e `prompt.ts` separados.
- **Melhorias de Agendamento Autônomo**:
  - **Detecção de Intenção**: Adicionada Regex para capturar horários específicos (ex: "10h", "15:30") e ativar imediatamente a fase de agendamento.
  - **Extração de Dados**: Refatorada a função `extractLeadData` para processar confirmações de agendamento em background via GPT-4o-mini.
  - **Booking**: Quando o paciente confirma ("pode agendar", "ok"), a IA insere automaticamente o registro em `medical_appointments` e atualiza o pipeline do CRM para `agendado`.
- **Correções Críticas**:
  - **Fuso Horário**: Corrigido bug na exibição de slots livres que usava `getUTCHours() - 3` (causava erros em horários de virada de dia). Agora usa `toLocaleTimeString` com `America/Sao_Paulo`.
  - **Regra de Horários Passados**: Adicionada regra absoluta para a IA não oferecer horários que já passaram no dia atual, sugerindo automaticamente o mesmo horário para o dia seguinte.
  - **Sumarização de Agenda**: Removida a lógica que escondia horários livres em blocos, dando visibilidade total dos slots para a IA.
- **Deploy**: Funções `whatsapp-ai-agent` e `whatsapp-webhook` atualizadas com sucesso.
- **Status**: Fluxo de agendamento 100% automatizado via WhatsApp e testado via CLI.
