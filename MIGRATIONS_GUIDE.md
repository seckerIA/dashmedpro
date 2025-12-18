# Guia de Migrations - Supabase MCP

Este documento explica como criar, gerenciar e aplicar migrations no banco de dados Supabase através do MCP do Cursor.

## 📋 Status Atual

O projeto possui **12 migrations** aplicadas, com a mais recente sendo:
- `20251213221907` (mais recente)
- `20251213221206` (mais antiga listada)

## 🔍 Verificar Migrations Existentes

### Listar Todas as Migrations
Use o comando MCP:
```
mcp_supabase_list_migrations
```

Ou peça diretamente: "Liste todas as migrations do meu projeto Supabase"

### Estrutura de uma Migration

As migrations seguem o padrão:
```
YYYYMMDDHHMMSS_nome_descriptivo.sql
```

Exemplo: `20250110000003_create_sales_calls_table.sql`

## 🆕 Criar Nova Migration

### Processo Recomendado

1. **Use `apply_migration` para DDL** (CREATE, ALTER, DROP)
   - Não use `execute_sql` para mudanças de schema
   - O `apply_migration` cria automaticamente o arquivo de migration

2. **Formato do Nome**
   - Use snake_case
   - Seja descritivo: `add_email_column_to_contacts`
   - Evite caracteres especiais

### Exemplo: Criar Nova Tabela

```sql
-- Migration: create_notifications_table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);
```

### Exemplo: Adicionar Coluna

```sql
-- Migration: add_phone_verification_to_profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verification_code TEXT;
```

### Exemplo: Modificar Coluna

```sql
-- Migration: update_contacts_add_tags
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Criar índice para busca em arrays
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags 
ON public.crm_contacts USING GIN(tags);
```

### Exemplo: Criar Função

```sql
-- Migration: create_function_calculate_deal_value
CREATE OR REPLACE FUNCTION public.calculate_deal_value(deal_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_value NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_value
    FROM financial_transactions
    WHERE deal_id = calculate_deal_value.deal_id
      AND type = 'income';
    
    RETURN total_value;
END;
$$;
```

## 🔐 Boas Práticas para RLS (Row Level Security)

### Sempre Habilitar RLS em Novas Tabelas

```sql
ALTER TABLE public.nova_tabela ENABLE ROW LEVEL SECURITY;
```

### Políticas Comuns

#### Usuários Veem Apenas Seus Próprios Dados
```sql
CREATE POLICY "Users can view own data" 
    ON public.tabela FOR SELECT
    USING (auth.uid() = user_id);
```

#### Usuários Podem Inserir Seus Próprios Dados
```sql
CREATE POLICY "Users can insert own data" 
    ON public.tabela FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

#### Usuários Podem Atualizar Seus Próprios Dados
```sql
CREATE POLICY "Users can update own data" 
    ON public.tabela FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

#### Admins Podem Ver Tudo
```sql
CREATE POLICY "Admins can view all" 
    ON public.tabela FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

## 📝 Padrões de Migrations no Projeto

### 1. Estrutura Básica de Tabela

```sql
CREATE TABLE IF NOT EXISTS public.nome_tabela (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Índices Comuns

```sql
-- Índice por user_id (muito comum)
CREATE INDEX idx_tabela_user_id ON public.tabela(user_id);

-- Índice por data (para queries temporais)
CREATE INDEX idx_tabela_created_at ON public.tabela(created_at);

-- Índice composto (quando necessário)
CREATE INDEX idx_tabela_user_created ON public.tabela(user_id, created_at);
```

### 3. Triggers para updated_at

```sql
CREATE OR REPLACE FUNCTION update_tabela_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tabela_updated_at
    BEFORE UPDATE ON public.tabela
    FOR EACH ROW
    EXECUTE FUNCTION update_tabela_updated_at();
```

## ⚠️ Cuidados Importantes

### 1. Sempre Use IF NOT EXISTS / IF EXISTS

```sql
-- ✅ Bom
ALTER TABLE public.tabela 
ADD COLUMN IF NOT EXISTS nova_coluna TEXT;

-- ❌ Ruim (pode falhar se já existir)
ALTER TABLE public.tabela 
ADD COLUMN nova_coluna TEXT;
```

### 2. Teste em Desenvolvimento Primeiro

- Use branches do Supabase para testar migrations
- Verifique se não quebra queries existentes
- Teste RLS policies com diferentes usuários

### 3. Migrations Não Podem Ser Revertidas Automaticamente

- Se precisar reverter, crie uma nova migration
- Documente mudanças importantes
- Considere fazer backup antes de mudanças grandes

### 4. Use Transações Implícitas

O `apply_migration` já executa em transação, mas evite:
- Múltiplas operações que podem falhar
- Dependências entre migrations não aplicadas

## 🔄 Processo Completo de Migration

### Passo 1: Planejar a Mudança
- Identifique o que precisa mudar
- Verifique dependências
- Considere impacto em dados existentes

### Passo 2: Escrever o SQL
- Use os padrões do projeto
- Inclua RLS policies
- Adicione índices quando necessário

### Passo 3: Aplicar a Migration
Use o MCP:
```
mcp_supabase_apply_migration
```

Parâmetros:
- `name`: Nome descritivo (snake_case)
- `query`: SQL completo da migration

### Passo 4: Verificar
- Liste migrations para confirmar aplicação
- Teste queries relacionadas
- Verifique logs se houver erros

## 📊 Exemplos de Migrations do Projeto

### Migration de Tabela Completa
Veja: `supabase/migrations/20250110000003_create_sales_calls_table.sql`

### Migration de RLS Policies
Veja: `supabase/migrations/20250110000001_allow_admin_dono_edit_deals.sql`

### Migration de Adição de Colunas
Veja: `supabase/migrations/20250111000001_add_final_counters_to_daily_reports.sql`

## 🛠️ Comandos Úteis

### Via MCP (Recomendado)
- **Listar migrations**: "Liste as migrations do Supabase"
- **Aplicar migration**: "Crie uma migration para adicionar coluna X na tabela Y"
- **Ver logs**: "Mostre os logs de erro do Supabase"
- **Ver advisors**: "Verifique problemas de segurança no banco"

### Via SQL Direto (Para Consultas)
- Use `execute_sql` apenas para SELECT, INSERT, UPDATE, DELETE
- **Nunca** use `execute_sql` para DDL (CREATE, ALTER, DROP)

## 📚 Recursos Adicionais

- **Documentação Supabase**: https://supabase.com/docs/guides/database/migrations
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## ✅ Checklist de Migration

Antes de aplicar uma migration, verifique:

- [ ] SQL está correto e testado
- [ ] Usa `IF NOT EXISTS` / `IF EXISTS` quando apropriado
- [ ] RLS está habilitado e policies criadas
- [ ] Índices adicionados para colunas frequentemente consultadas
- [ ] Triggers configurados se necessário (updated_at, etc)
- [ ] Nome da migration é descritivo e em snake_case
- [ ] Migration não quebra funcionalidades existentes
- [ ] Dados existentes são preservados ou migrados corretamente





