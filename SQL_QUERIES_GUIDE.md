# Guia de Queries SQL - DashMedPro CRM

Este documento contém queries SQL úteis para análise e gerenciamento do banco de dados do CRM através do MCP do Supabase.

## 📊 Análise de Leads (BDR_PROSPECÇÃO)

### Leads Recentes
```sql
SELECT 
  lead_name,
  status,
  etapa,
  interacoes,
  agendado,
  created_at,
  ultimo_contato
FROM "BDR_PROSPECÇÃO"
ORDER BY created_at DESC
LIMIT 20;
```

### Leads por Status
```sql
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN agendado = true THEN 1 END) as agendados
FROM "BDR_PROSPECÇÃO"
GROUP BY status
ORDER BY total DESC;
```

### Leads por Etapa do Funil
```sql
SELECT 
  etapa,
  COUNT(*) as total,
  COUNT(CASE WHEN agendado = true THEN 1 END) as agendados,
  AVG(interacoes) as media_interacoes
FROM "BDR_PROSPECÇÃO"
GROUP BY etapa
ORDER BY total DESC;
```

### Leads com Mais Interações
```sql
SELECT 
  lead_name,
  status,
  etapa,
  interacoes,
  ultimo_contato,
  created_at
FROM "BDR_PROSPECÇÃO"
WHERE interacoes > 0
ORDER BY interacoes DESC, ultimo_contato DESC
LIMIT 20;
```

### Leads Agendados
```sql
SELECT 
  lead_name,
  status,
  etapa,
  interacoes,
  timeout as data_agendamento,
  created_at
FROM "BDR_PROSPECÇÃO"
WHERE agendado = true
ORDER BY timeout ASC;
```

## 👥 Análise de Contatos (crm_contacts)

### Contatos Recentes
```sql
SELECT 
  name,
  full_name,
  email,
  phone,
  company,
  service,
  service_value,
  created_at,
  last_contact_at
FROM crm_contacts
ORDER BY created_at DESC
LIMIT 20;
```

### Contatos por Serviço
```sql
SELECT 
  service,
  COUNT(*) as total,
  SUM(service_value) as valor_total,
  AVG(service_value) as valor_medio
FROM crm_contacts
WHERE service IS NOT NULL
GROUP BY service
ORDER BY total DESC;
```

### Contatos sem Último Contato
```sql
SELECT 
  name,
  full_name,
  email,
  phone,
  last_contact_at,
  created_at
FROM crm_contacts
WHERE last_contact_at IS NULL 
   OR last_contact_at < NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## 💼 Análise de Deals (crm_deals)

### Deals por Estágio
```sql
SELECT 
  stage,
  COUNT(*) as total,
  SUM(value) as valor_total,
  AVG(value) as valor_medio,
  AVG(probability) as probabilidade_media
FROM crm_deals
GROUP BY stage
ORDER BY total DESC;
```

### Deals de Alto Valor
```sql
SELECT 
  title,
  contact_name,
  stage,
  value,
  probability,
  expected_close_date,
  created_at
FROM crm_deals
WHERE value > 10000
ORDER BY value DESC
LIMIT 20;
```

### Deals que Precisam de Follow-up
```sql
SELECT 
  title,
  contact_name,
  stage,
  value,
  expected_close_date,
  needs_follow_up,
  updated_at
FROM crm_deals
WHERE needs_follow_up = true
ORDER BY expected_close_date ASC;
```

### Pipeline Completo
```sql
SELECT 
  stage,
  COUNT(*) as quantidade,
  SUM(value) as valor_total,
  AVG(probability) as probabilidade_media,
  SUM(value * probability / 100.0) as valor_esperado
FROM crm_deals
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'lead_novo' THEN 1
    WHEN 'qualificado' THEN 2
    WHEN 'apresentacao' THEN 3
    WHEN 'proposta' THEN 4
    WHEN 'negociacao' THEN 5
    WHEN 'fechado_ganho' THEN 6
    WHEN 'fechado_perdido' THEN 7
  END;
```

## 📞 Análise de Chamadas (sales_calls)

### Chamadas Agendadas
```sql
SELECT 
  title,
  scheduled_at,
  duration_minutes,
  status,
  call_type,
  contact_id
FROM sales_calls
WHERE scheduled_at >= NOW()
  AND status = 'scheduled'
ORDER BY scheduled_at ASC;
```

### Chamadas Realizadas
```sql
SELECT 
  title,
  scheduled_at,
  duration_minutes,
  status,
  outcome,
  call_type
FROM sales_calls
WHERE status = 'completed'
ORDER BY scheduled_at DESC
LIMIT 20;
```

### Estatísticas de Chamadas por Tipo
```sql
SELECT 
  call_type,
  status,
  COUNT(*) as total,
  AVG(duration_minutes) as duracao_media
FROM sales_calls
GROUP BY call_type, status
ORDER BY call_type, status;
```

## ✅ Análise de Tarefas (tasks)

### Tarefas Pendentes
```sql
SELECT 
  title,
  description,
  status,
  priority,
  due_date,
  category,
  created_at
FROM tasks
WHERE status != 'completed'
ORDER BY 
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  due_date ASC NULLS LAST;
```

### Tarefas por Status
```sql
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as atrasadas
FROM tasks
GROUP BY status
ORDER BY total DESC;
```

### Tarefas por Categoria
```sql
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as concluidas
FROM tasks
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total DESC;
```

## 💰 Análise Financeira (financial_transactions)

### Transações Recentes
```sql
SELECT 
  type,
  amount,
  description,
  date,
  payment_method,
  status,
  created_at
FROM financial_transactions
ORDER BY date DESC, created_at DESC
LIMIT 20;
```

### Receitas vs Despesas por Mês
```sql
SELECT 
  DATE_TRUNC('month', date) as mes,
  type,
  SUM(amount) as total
FROM financial_transactions
WHERE date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', date), type
ORDER BY mes DESC, type;
```

### Transações por Categoria
```sql
SELECT 
  fc.name as categoria,
  ft.type,
  COUNT(*) as quantidade,
  SUM(ft.amount) as total
FROM financial_transactions ft
LEFT JOIN financial_categories fc ON ft.category_id = fc.id
WHERE ft.category_id IS NOT NULL
GROUP BY fc.name, ft.type
ORDER BY total DESC;
```

### Saldo por Conta
```sql
SELECT 
  fa.name as conta,
  fa.type,
  fa.balance as saldo_atual,
  SUM(CASE WHEN ft.type = 'income' THEN ft.amount ELSE 0 END) as total_receitas,
  SUM(CASE WHEN ft.type = 'expense' THEN ft.amount ELSE 0 END) as total_despesas
FROM financial_accounts fa
LEFT JOIN financial_transactions ft ON fa.id = ft.account_id
GROUP BY fa.id, fa.name, fa.type, fa.balance
ORDER BY fa.name;
```

## 📈 Relatórios de Prospecção

### Sessões de Prospecção
```sql
SELECT 
  ps.started_at,
  ps.ended_at,
  ps.calls_made,
  ps.contacts_reached,
  ps.appointments_set,
  pss.name as script_usado
FROM prospecting_sessions ps
LEFT JOIN prospecting_scripts pss ON ps.script_id = pss.id
ORDER BY ps.started_at DESC
LIMIT 20;
```

### Relatórios Diários
```sql
SELECT 
  report_date,
  calls_made,
  emails_sent,
  meetings_held,
  deals_closed,
  revenue
FROM daily_reports
ORDER BY report_date DESC
LIMIT 30;
```

### Performance de Prospecção
```sql
SELECT 
  DATE_TRUNC('day', started_at) as dia,
  COUNT(*) as sessoes,
  SUM(calls_made) as total_chamadas,
  SUM(contacts_reached) as total_contatos,
  SUM(appointments_set) as total_agendamentos,
  ROUND(AVG(calls_made), 2) as media_chamadas_por_sessao
FROM prospecting_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY dia DESC;
```

## 🔍 Queries de Diagnóstico

### Verificar Integridade de Dados
```sql
-- Contatos sem deals
SELECT COUNT(*) as contatos_sem_deals
FROM crm_contacts c
LEFT JOIN crm_deals d ON c.id = d.contact_id
WHERE d.id IS NULL;

-- Deals sem contato
SELECT COUNT(*) as deals_sem_contato
FROM crm_deals
WHERE contact_id IS NULL;

-- Tarefas sem usuário atribuído
SELECT COUNT(*) as tarefas_sem_atribuicao
FROM tasks
WHERE assigned_to IS NULL AND status != 'completed';
```

### Estatísticas Gerais do CRM
```sql
SELECT 
  'Leads' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN agendado = true THEN 1 END) as agendados
FROM "BDR_PROSPECÇÃO"
UNION ALL
SELECT 
  'Contatos' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN last_contact_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as ativos_30d
FROM crm_contacts
UNION ALL
SELECT 
  'Deals' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN stage NOT IN ('fechado_ganho', 'fechado_perdido') THEN 1 END) as em_aberto
FROM crm_deals
UNION ALL
SELECT 
  'Tarefas' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN status != 'completed' THEN 1 END) as pendentes
FROM tasks;
```

## 📝 Queries para Follow-ups

### Follow-ups Pendentes
```sql
SELECT 
  cf.type,
  cf.scheduled_date,
  cf.status,
  cf.notes,
  cc.name as contato,
  cd.title as deal
FROM crm_follow_ups cf
LEFT JOIN crm_contacts cc ON cf.contact_id = cc.id
LEFT JOIN crm_deals cd ON cf.deal_id = cd.id
WHERE cf.completed = false
  AND cf.scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY cf.scheduled_date ASC;
```

### Atividades Recentes
```sql
SELECT 
  type,
  title,
  description,
  scheduled_at,
  completed,
  completed_at,
  created_at
FROM crm_activities
ORDER BY COALESCE(scheduled_at, created_at) DESC
LIMIT 30;
```

## 🎯 Queries de Performance

### Top Vendedores por Deals
```sql
SELECT 
  p.full_name as vendedor,
  COUNT(d.id) as total_deals,
  SUM(d.value) as valor_total,
  AVG(d.probability) as probabilidade_media,
  COUNT(CASE WHEN d.stage = 'fechado_ganho' THEN 1 END) as deals_fechados
FROM profiles p
LEFT JOIN crm_deals d ON p.id = d.user_id
WHERE p.role = 'vendedor'
GROUP BY p.id, p.full_name
HAVING COUNT(d.id) > 0
ORDER BY valor_total DESC;
```

### Conversão por Etapa
```sql
WITH etapa_stats AS (
  SELECT 
    etapa,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN agendado = true THEN 1 END) as agendados,
    AVG(interacoes) as media_interacoes
  FROM "BDR_PROSPECÇÃO"
  GROUP BY etapa
)
SELECT 
  etapa,
  total_leads,
  agendados,
  ROUND(100.0 * agendados / NULLIF(total_leads, 0), 2) as taxa_conversao,
  ROUND(media_interacoes, 2) as media_interacoes
FROM etapa_stats
ORDER BY total_leads DESC;
```

## 🔐 Verificações de Segurança (RLS)

### Verificar Políticas RLS Ativas
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 💡 Dicas de Uso

1. **Use LIMIT** em queries exploratórias para evitar resultados muito grandes
2. **Filtre por datas** quando possível para melhor performance
3. **Use índices** nas colunas frequentemente filtradas (created_at, status, etc)
4. **Respeite RLS** - todas as queries respeitam Row Level Security automaticamente
5. **Para DDL** (CREATE, ALTER, DROP), use `apply_migration` ao invés de `execute_sql`

## 📚 Recursos Adicionais

- **Listar tabelas**: Use `mcp_supabase_list_tables` para ver estrutura completa
- **Ver migrations**: Use `mcp_supabase_list_migrations` para histórico
- **Ver logs**: Use `mcp_supabase_get_logs` para debug
- **Ver advisors**: Use `mcp_supabase_get_advisors` para segurança/performance





