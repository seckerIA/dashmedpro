# Documentação do Schema do Banco de Dados - DashMed Pro

Esta documentação descreve a estrutura completa do banco de dados do projeto DashMed Pro.

## Visão Geral

O banco de dados utiliza PostgreSQL através do Supabase e contém:

- **28 Enums**: Tipos enumerados para padronização
- **27 Tabelas**: Estruturas de dados principais
- **8 Funções**: Funções auxiliares e triggers
- **100+ Índices**: Otimização de queries
- **50+ Triggers**: Automação de atualizações
- **100+ RLS Policies**: Segurança em nível de linha
- **2 Storage Buckets**: Armazenamento de arquivos
- **1 View**: View para cálculos financeiros

## Enums

### User Management

- **`user_role`**: `'admin'`, `'dono'`, `'vendedor'`, `'gestor_trafego'`

### CRM

- **`crm_pipeline_stage`**: `'lead_novo'`, `'qualificado'`, `'apresentacao'`, `'proposta'`, `'negociacao'`, `'fechado_ganho'`, `'fechado_perdido'`
- **`crm_activity_type`**: `'call'`, `'email'`, `'whatsapp'`, `'meeting'`, `'note'`, `'task'`, `'ai_interaction'`

### Tasks

- **`task_category`**: `'comercial'`, `'marketing'`, `'financeiro'`, `'social_media'`, `'empresarial'`
- **`task_status`**: `'pendente'`, `'em_andamento'`, `'concluida'`, `'cancelada'`
- **`task_priority`**: `'baixa'`, `'media'`, `'alta'`, `'urgente'`

### Medical Appointments

- **`appointment_type`**: `'first_visit'`, `'return'`, `'procedure'`, `'urgent'`, `'follow_up'`, `'exam'`
- **`appointment_status`**: `'scheduled'`, `'confirmed'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'no_show'`
- **`payment_status`**: `'pending'`, `'paid'`, `'partial'`, `'cancelled'`

### Meetings

- **`meeting_type`**: `'meeting'`, `'appointment'`, `'block'`, `'other'`
- **`meeting_status`**: `'scheduled'`, `'completed'`, `'cancelled'`

### Sales

- **`sales_call_status`**: `'scheduled'`, `'completed'`, `'cancelled'`, `'no_show'`

### Prospecting

- **`session_result`**: `'atendimento_encerrado'`, `'contato_decisor'`, `'sem_resposta'`, `'rejeitado'`

### Commercial

- **`commercial_lead_status`**: `'new'`, `'contacted'`, `'qualified'`, `'converted'`, `'lost'`
- **`commercial_lead_origin`**: `'google'`, `'instagram'`, `'facebook'`, `'indication'`, `'website'`, `'other'`
- **`commercial_procedure_category`**: `'consultation'`, `'procedure'`, `'exam'`, `'surgery'`, `'other'`
- **`commercial_sale_status`**: `'quote'`, `'confirmed'`, `'completed'`, `'cancelled'`
- **`commercial_payment_method`**: `'cash'`, `'credit_card'`, `'debit_card'`, `'pix'`, `'bank_transfer'`, `'installment'`
- **`commercial_campaign_type`**: `'first_consultation_discount'`, `'procedure_package'`, `'seasonal_promotion'`, `'referral_benefit'`
- **`commercial_interaction_type`**: `'call'`, `'email'`, `'whatsapp'`, `'meeting'`, `'other'`

### Financial

- **`account_type`**: `'conta_corrente'`, `'poupanca'`, `'caixa'`, `'investimento'`
- **`transaction_type`**: `'entrada'`, `'saida'`
- **`category_type`**: `'entrada'`, `'saida'`
- **`payment_method`**: `'dinheiro'`, `'pix'`, `'cartao_credito'`, `'cartao_debito'`, `'boleto'`, `'transferencia'`, `'cheque'`
- **`transaction_status`**: `'pendente'`, `'concluida'`, `'cancelada'`
- **`recurrence_frequency`**: `'diaria'`, `'semanal'`, `'quinzenal'`, `'mensal'`, `'bimestral'`, `'trimestral'`, `'semestral'`, `'anual'`
- **`budget_status`**: `'active'`, `'exceeded'`, `'completed'`, `'cancelled'`
- **`cost_type`**: `'ferramentas'`, `'operacional'`, `'terceirizacao'`

## Tabelas Principais

### 1. User Management

#### `profiles`
Perfis de usuários com roles e informações básicas.

**Campos principais**:
- `id` (UUID, PK, FK → auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (user_role)
- `avatar_url` (TEXT)
- `is_active` (BOOLEAN)

#### `team_invitations`
Convites para adicionar membros à equipe.

**Campos principais**:
- `id` (UUID, PK)
- `email` (TEXT)
- `role` (user_role)
- `invitation_token` (UUID)
- `expires_at` (TIMESTAMPTZ)
- `accepted_at` (TIMESTAMPTZ)

### 2. CRM

#### `crm_contacts`
Contatos do CRM.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `full_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `company` (TEXT)
- `lead_score` (INTEGER)
- `tags` (TEXT[])

#### `crm_deals`
Negócios e oportunidades do CRM.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `contact_id` (UUID, FK → crm_contacts)
- `assigned_to` (UUID, FK → auth.users)
- `title` (TEXT)
- `value` (DECIMAL)
- `stage` (crm_pipeline_stage)
- `probability` (INTEGER)
- `position` (INTEGER)

#### `crm_activities`
Atividades do CRM (ligações, emails, reuniões, etc.).

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `contact_id` (UUID, FK → crm_contacts)
- `deal_id` (UUID, FK → crm_deals)
- `activity_type` (crm_activity_type)
- `title` (TEXT)
- `completed` (BOOLEAN)
- `scheduled_at` (TIMESTAMPTZ)

#### `crm_follow_ups`
Follow-ups de negócios e contatos.

**Campos principais**:
- `id` (UUID, PK)
- `deal_id` (UUID, FK → crm_deals)
- `contact_id` (UUID, FK → crm_contacts)
- `user_id` (UUID, FK → auth.users)
- `scheduled_date` (TIMESTAMPTZ)
- `completed` (BOOLEAN)

### 3. Tasks

#### `tasks`
Tarefas do sistema.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `created_by` (UUID, FK → auth.users)
- `title` (TEXT)
- `status` (task_status)
- `priority` (task_priority)
- `category` (task_category)
- `due_date` (DATE)
- `deal_id` (UUID, FK → crm_deals)
- `contact_id` (UUID, FK → crm_contacts)
- `assigned_to` (UUID, FK → auth.users)
- `image_url` (TEXT)

### 4. Financial

#### `financial_accounts`
Contas financeiras (contas correntes, poupanças, etc.).

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `type` (account_type)
- `bank_name` (TEXT)
- `current_balance` (DECIMAL)

#### `financial_categories`
Categorias financeiras (entrada/saída).

**Campos principais**:
- `id` (UUID, PK)
- `name` (TEXT)
- `type` (category_type)
- `color` (TEXT)
- `icon` (TEXT)
- `parent_id` (UUID, FK → financial_categories)
- `is_system` (BOOLEAN)

#### `financial_transactions`
Transações financeiras (entradas e saídas).

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `account_id` (UUID, FK → financial_accounts)
- `category_id` (UUID, FK → financial_categories)
- `type` (transaction_type)
- `amount` (DECIMAL)
- `description` (TEXT)
- `date` (DATE)
- `transaction_date` (DATE)
- `payment_method` (payment_method)
- `status` (transaction_status)
- `deal_id` (UUID, FK → crm_deals)
- `contact_id` (UUID, FK → crm_contacts)
- `has_costs` (BOOLEAN)
- `total_costs` (DECIMAL)

#### `financial_attachments`
Anexos de transações financeiras.

**Campos principais**:
- `id` (UUID, PK)
- `transaction_id` (UUID, FK → financial_transactions)
- `file_name` (TEXT)
- `file_path` (TEXT)
- `file_type` (TEXT)
- `file_size` (INTEGER)

#### `financial_recurring_transactions`
Transações recorrentes.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `template_transaction_id` (UUID, FK → financial_transactions)
- `frequency` (recurrence_frequency)
- `start_date` (DATE)
- `end_date` (DATE)
- `next_occurrence` (DATE)
- `is_active` (BOOLEAN)

#### `financial_budgets`
Orçamentos financeiros por categoria.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `category_id` (UUID, FK → financial_categories)
- `amount` (DECIMAL)
- `period_start` (DATE)
- `period_end` (DATE)
- `status` (budget_status)

#### `transaction_costs`
Custos associados a transações de prestação de serviços.

**Campos principais**:
- `id` (UUID, PK)
- `transaction_id` (UUID, FK → financial_transactions)
- `cost_type` (cost_type)
- `amount` (DECIMAL)
- `description` (TEXT)
- `attachment_id` (UUID, FK → financial_attachments)

### 5. Medical

#### `medical_appointments`
Agendamentos médicos com integração financeira.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `contact_id` (UUID, FK → crm_contacts)
- `title` (TEXT)
- `appointment_type` (appointment_type)
- `status` (appointment_status)
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `duration_minutes` (INTEGER)
- `estimated_value` (DECIMAL)
- `payment_status` (payment_status)
- `financial_transaction_id` (UUID, FK → financial_transactions)
- `notes` (TEXT)
- `internal_notes` (TEXT)

### 6. Meetings

#### `general_meetings`
Reuniões e compromissos gerais do médico.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `title` (TEXT)
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `duration_minutes` (INTEGER)
- `meeting_type` (meeting_type)
- `is_busy` (BOOLEAN)
- `status` (meeting_status)
- `location` (TEXT)
- `attendees` (TEXT[])

### 7. Commercial

#### `commercial_leads`
Leads comerciais.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `origin` (commercial_lead_origin)
- `status` (commercial_lead_status)
- `estimated_value` (DECIMAL)
- `contact_id` (UUID, FK → crm_contacts)

#### `commercial_procedures`
Catálogo de procedimentos comerciais.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `category` (commercial_procedure_category)
- `price` (DECIMAL)
- `duration_minutes` (INTEGER)
- `is_active` (BOOLEAN)

#### `commercial_sales`
Vendas comerciais.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `lead_id` (UUID, FK → commercial_leads)
- `contact_id` (UUID, FK → crm_contacts)
- `procedure_id` (UUID, FK → commercial_procedures)
- `appointment_id` (UUID, FK → medical_appointments)
- `value` (DECIMAL)
- `status` (commercial_sale_status)
- `payment_method` (commercial_payment_method)

#### `commercial_campaigns`
Campanhas comerciais e promoções.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `type` (commercial_campaign_type)
- `discount_percentage` (DECIMAL)
- `discount_amount` (DECIMAL)
- `start_date` (TIMESTAMPTZ)
- `end_date` (TIMESTAMPTZ)
- `promo_code` (TEXT, UNIQUE)
- `is_active` (BOOLEAN)

#### `commercial_lead_interactions`
Interações com leads comerciais.

**Campos principais**:
- `id` (UUID, PK)
- `lead_id` (UUID, FK → commercial_leads)
- `user_id` (UUID, FK → auth.users)
- `interaction_type` (commercial_interaction_type)
- `notes` (TEXT)

### 8. Prospecting

#### `prospecting_scripts`
Scripts de prospecção.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `content` (TEXT)
- `category` (TEXT)
- `is_active` (BOOLEAN)

#### `prospecting_sessions`
Sessões de prospecção.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `script_id` (UUID, FK → prospecting_scripts)
- `contact_id` (UUID, FK → crm_contacts)
- `started_at` (TIMESTAMPTZ)
- `ended_at` (TIMESTAMPTZ)
- `result` (session_result)

#### `prospecting_daily_reports`
Relatórios diários de prospecção.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `report_date` (DATE)
- `calls_made` (INTEGER)
- `contacts_reached` (INTEGER)
- `appointments_set` (INTEGER)
- `deals_closed` (INTEGER)
- `revenue` (DECIMAL)
- `is_paused` (BOOLEAN)
- `total_paused_time` (INTEGER)

### 9. Sales

#### `sales_calls`
Chamadas de vendas agendadas.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `contact_id` (UUID, FK → crm_contacts)
- `deal_id` (UUID, FK → crm_deals)
- `title` (TEXT)
- `scheduled_at` (TIMESTAMPTZ)
- `duration_minutes` (INTEGER)
- `status` (sales_call_status)
- `completed_at` (TIMESTAMPTZ)

### 10. Configuration

#### `user_daily_goals`
Metas padrão diárias de cada usuário para prospecção.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, UNIQUE)
- `default_goal_calls` (INTEGER)
- `default_goal_contacts` (INTEGER)

#### `notifications`
Notificações do sistema para usuários.

**Campos principais**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `type` (TEXT)
- `title` (TEXT)
- `message` (TEXT)
- `read` (BOOLEAN)

## Funções

### `update_updated_at_column()`
Função genérica para atualizar o campo `updated_at` em qualquer tabela.

### `get_user_role(_user_id UUID)`
Retorna o role de um usuário.

### `has_role(_user_id UUID, _role user_role)`
Verifica se um usuário tem um role específico.

### `is_admin_or_dono(_user_id UUID)`
Verifica se um usuário é admin ou dono.

### `calculate_appointment_end_time()`
Calcula `end_time` baseado em `duration_minutes` para appointments.

### `update_medical_appointments_updated_at()`
Trigger específico para atualizar `updated_at` em medical_appointments.

### `update_general_meetings_updated_at()`
Trigger específico para atualizar `updated_at` em general_meetings.

### `update_transaction_costs()`
Atualiza `total_costs` e `has_costs` em financial_transactions quando transaction_costs mudam.

### `handle_new_user_from_invitation()`
Cria perfil automaticamente quando um novo usuário se registra, verificando convites pendentes.

## Views

### `vw_transactions_with_net_profit`
View que calcula lucro líquido para transações de entrada, incluindo:
- `gross_amount`: Valor bruto
- `total_costs`: Custos totais
- `net_amount`: Valor líquido (bruto - custos)
- `profit_margin_percentage`: Margem de lucro em porcentagem

## Storage Buckets

### `avatars`
Bucket público para avatares de usuários.

**Políticas**:
- Usuários podem fazer upload de seus próprios avatares
- Todos podem visualizar avatares (bucket público)
- Usuários podem atualizar/deletar seus próprios avatares

### `task-images`
Bucket privado para imagens de tarefas.

**Políticas**:
- Usuários autenticados podem fazer upload/visualizar/atualizar/deletar imagens

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas que seguem este padrão:

- **SELECT**: Admin/Dono veem tudo, outros veem apenas seus próprios registros
- **INSERT**: Usuários podem criar seus próprios registros
- **UPDATE**: Admin/Dono podem atualizar tudo, outros apenas seus próprios
- **DELETE**: Admin/Dono podem deletar tudo, outros apenas seus próprios

Exceções específicas são documentadas nas políticas individuais.

## Índices

Índices foram criados para:

- Foreign keys (para joins eficientes)
- Campos frequentemente filtrados (status, type, dates)
- Campos usados em ordenação (created_at, updated_at)
- Campos usados em buscas (full_name, email, phone)
- Composite indexes para queries complexas (user_id + date_range)

## Triggers

Triggers automáticos foram criados para:

- Atualizar `updated_at` em todas as tabelas que têm esse campo
- Calcular `end_time` automaticamente em medical_appointments
- Atualizar custos totais em financial_transactions quando transaction_costs mudam
- Criar perfil automaticamente quando um novo usuário se registra

## Relacionamentos Principais

```
auth.users
  ├── profiles
  ├── crm_contacts
  ├── crm_deals
  ├── tasks
  ├── financial_accounts
  ├── financial_transactions
  ├── medical_appointments
  ├── general_meetings
  └── ...

crm_contacts
  ├── crm_deals
  ├── crm_activities
  ├── medical_appointments
  ├── sales_calls
  └── commercial_leads

crm_deals
  ├── crm_activities
  ├── crm_follow_ups
  ├── tasks
  ├── financial_transactions
  └── sales_calls

financial_transactions
  ├── financial_attachments
  ├── transaction_costs
  ├── financial_recurring_transactions
  └── medical_appointments (via financial_transaction_id)
```

## Notas de Design

1. **UUIDs**: Todas as tabelas usam UUID como chave primária para melhor distribuição e segurança
2. **Timestamps**: Uso consistente de `TIMESTAMPTZ` para datas/horas
3. **Soft Deletes**: Algumas tabelas usam campos como `cancelled_at` em vez de deletar registros
4. **JSONB**: Campos `custom_fields` e `metadata` usam JSONB para flexibilidade
5. **Arrays**: Campos `tags` e `attendees` usam arrays PostgreSQL
6. **Constraints**: Validações em nível de banco (CHECK constraints) para garantir integridade

---

**Última Atualização**: 2025-01-20  
**Versão do Schema**: 1.0












