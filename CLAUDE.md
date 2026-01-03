# DashMedPro - Context Guide

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
└── whatsapp-ai-analyze/     # Análise de conversas com GPT-3.5 (pendente deploy)
```

### Pendências de Deploy
1. **Edge Function whatsapp-ai-analyze**: Fazer deploy via Supabase Dashboard ou CLI autenticado
2. **OPENAI_API_KEY**: Configurar no Supabase Secrets (`npx supabase secrets set OPENAI_API_KEY=sk-...`)

### Known Issues
- **403 em crm_deals**: Pipeline automation funciona mas RLS pode bloquear INSERT/UPDATE
- **Conta financeira ausente**: Toast warning se não houver `financial_accounts` ativa
- **WhatsApp Token Expiration**: Tokens Meta expiram periodicamente, reconfigurar quando necessário
- **Webhook Meta**: Configurar callback URL no Meta Business Manager após deploy

---
**Version:** 0.2.0 | 2026-01-03 | https://github.com/seckerIA/dashmedpro
