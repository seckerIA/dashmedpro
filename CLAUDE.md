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
│   └── ui/             # shadcn/ui base components
├── hooks/              # Custom hooks (useCRM, useMedicalAppointments, etc)
├── pages/              # Rotas principais
├── types/              # TypeScript types por domínio
├── lib/                # Utils e helpers
└── integrations/supabase/ # Cliente e types gerados
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
- **PipelineBoard** - Kanban drag-and-drop (dnd-kit) para stages
- **AppointmentForm** - Form consultas com sinal, payment_status e estimated_value
- **MedicalRecordForm** - Prontuários com is_in_treatment flag
- **ContactForm** - Cadastro pacientes com health_insurance_type e dados médicos

## Database/APIs

### Tabelas Principais
- `crm_contacts`: pacientes (name, email, phone, health_insurance_type, birth_date)
- `crm_deals`: oportunidades (contact_id, user_id, stage, is_in_treatment, is_defaulting, value)
- `medical_appointments`: consultas (contact_id, doctor_id, status, payment_status, sinal_amount, sinal_paid, estimated_value)
- `medical_records`: prontuários (contact_id, doctor_id, diagnosis, treatment_plan, is_in_treatment)
- `financial_transactions`: lançamentos (account_id, category_id, amount, type, transaction_date)
- `secretary_doctor_links`: many-to-many secretária↔médicos

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

## Contexto Atual (2025-01-31)

### Última Sessão
- Implementada automação de pipeline baseada em status de consultas
- `updateDealPipeline`: auto-move deals conforme sinal_paid, status, payment_status
- `checkAndMoveToAguardandoRetorno`: move paciente após 1 consulta completa paga sem retorno
- `updateDealToTreatment`: marca `is_in_treatment=true` ao criar prontuário
- Query invalidation: `crm-deals` e `crm-pipeline` após mutations de appointments

### Decisões Arquiteturais
- **Pipeline automático**: Consultas agendadas → deal `agendado`; sinal não pago → `inadimplente`; concluída paga → `aguardando_retorno` ou `follow_up`
- **RLS granular**: Secretária precisa link explícito em `secretary_doctor_links` para ver agendas
- **Transações financeiras**: Auto-criadas ao marcar consulta como `completed` SE payment_status=paid
- **Hooks exportam funções**: `updateDealPipeline`, `checkAndMoveToAguardandoRetorno` exportadas para reuso
- **Dual doctor support**: `doctor_id` (FK explícito) OR `user_id` (fallback) em appointments

### Known Issues
- **403 em crm_deals**: Pipeline automation funciona mas RLS pode bloquear INSERT/UPDATE (verificar policies)
- **Conta financeira ausente**: Toast warning se não houver `financial_accounts` ativa ao criar transação
- **Duplicação de deals**: Lógica busca deal existente por `contact_id` + `stage='agendado'` antes de criar novo
- **Migration aguardando_retorno**: Novo stage adicionado via `20250201000000_add_aguardando_retorno_stage.sql`

---
**Version:** 0.0.0 | 2025-01-31 | https://github.com/seckerIA/dashmedpro
