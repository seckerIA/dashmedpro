# Guia de Migração do Banco de Dados - DashMed Pro

Este guia fornece instruções passo a passo para migrar o banco de dados do projeto DashMed Pro para um novo ambiente Supabase.

## Pré-requisitos

- Acesso ao novo projeto Supabase
- Credenciais do banco de dados (URL, chave anon, service role key)
- Supabase CLI instalado (opcional, para migrações locais)
- Acesso ao projeto antigo (para referência, se necessário)

## Passo 1: Preparação

### 1.1 Verificar Credenciais

Certifique-se de ter as seguintes informações do novo projeto Supabase:

- **Project URL**: `https://[project-ref].supabase.co`
- **Anon Key**: Chave pública para autenticação
- **Service Role Key**: Chave privada para operações administrativas
- **Database Password**: Senha do banco de dados

### 1.2 Atualizar Configurações do Projeto

Atualize os seguintes arquivos com as novas credenciais:

1. **`src/integrations/supabase/client.ts`**
   - Atualize `SUPABASE_URL`
   - Atualize `SUPABASE_PUBLISHABLE_KEY`

2. **`supabase/config.toml`**
   - Atualize `project_id`

3. **`.cursor/mcp.json`** (se usando MCP)
   - Atualize `project-ref` no `--project-ref=`
   - Atualize `SUPABASE_ACCESS_TOKEN`

## Passo 2: Executar a Migração

### 2.1 Via Supabase Dashboard (Recomendado)

1. Acesse o SQL Editor no dashboard:
   ```
   https://supabase.com/dashboard/project/[project-ref]/sql/new
   ```

2. Abra o arquivo de migração:
   ```
   supabase/migrations/20250120000000_complete_database_schema.sql
   ```

3. Copie todo o conteúdo do arquivo

4. Cole no SQL Editor

5. Clique em **Run** para executar

6. Aguarde a execução completar (pode levar alguns minutos)

### 2.2 Via Supabase CLI (Alternativa)

Se você tem o Supabase CLI configurado:

```bash
# Navegar até o diretório do projeto
cd /caminho/para/dashmedpro

# Linkar ao projeto (se ainda não linkado)
supabase link --project-ref [project-ref]

# Aplicar a migração
supabase db push
```

### 2.3 Via MCP (Se disponível)

Se você tem o MCP do Supabase configurado:

```sql
-- A migração será aplicada automaticamente ao executar o script
```

## Passo 3: Validação

Após executar a migração, valide que todas as estruturas foram criadas:

### 3.1 Verificar Tabelas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver todas as 27 tabelas listadas.

### 3.2 Verificar Enums

```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;
```

Você deve ver todos os 28 enums criados.

### 3.3 Verificar Funções

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

### 3.4 Verificar Storage Buckets

```sql
SELECT id, name, public 
FROM storage.buckets;
```

Você deve ver `avatars` e `task-images`.

### 3.5 Verificar RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Passo 4: Dados Iniciais (Opcional)

Se você precisa migrar dados do banco antigo:

### 4.1 Exportar Dados do Banco Antigo

Use o Supabase Dashboard ou pg_dump para exportar dados:

```bash
pg_dump -h db.[old-project-ref].supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --table=profiles \
  --table=crm_contacts \
  # ... outras tabelas
  > data_export.sql
```

### 4.2 Importar Dados no Banco Novo

```bash
psql -h db.[new-project-ref].supabase.co \
  -U postgres \
  -d postgres \
  -f data_export.sql
```

**Nota**: Ajuste os comandos conforme necessário e tenha cuidado com foreign keys e dependências.

## Passo 5: Testar a Aplicação

### 5.1 Reiniciar o Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

### 5.2 Testar Funcionalidades Principais

1. **Autenticação**
   - Criar conta
   - Fazer login
   - Verificar perfil

2. **CRM**
   - Criar contato
   - Criar negócio
   - Adicionar atividade

3. **Financeiro**
   - Criar conta
   - Criar categoria
   - Criar transação

4. **Calendário Médico**
   - Criar consulta
   - Criar reunião
   - Verificar disponibilidade

5. **Comercial**
   - Criar lead
   - Criar procedimento
   - Criar venda

## Passo 6: Troubleshooting

### Erro: "relation already exists"

Se você receber erros de tabela já existente, use `DROP TABLE IF EXISTS` antes de criar:

```sql
DROP TABLE IF EXISTS public.nome_da_tabela CASCADE;
```

### Erro: "type already exists"

Para enums, use `DROP TYPE IF EXISTS`:

```sql
DROP TYPE IF EXISTS public.nome_do_enum CASCADE;
```

### Erro: "function already exists"

Para funções, use `CREATE OR REPLACE FUNCTION` (já incluído no script).

### Erro de Permissão

Certifique-se de estar usando a **Service Role Key** para operações administrativas ou tenha permissões adequadas no Supabase Dashboard.

## Estrutura Criada

A migração cria:

- **28 Enums**: Tipos enumerados para status, categorias, etc.
- **8 Funções**: Funções auxiliares e triggers
- **27 Tabelas**: Todas as tabelas do sistema
- **100+ Índices**: Índices para performance
- **50+ Triggers**: Triggers para atualização automática
- **100+ RLS Policies**: Políticas de segurança
- **2 Storage Buckets**: Para avatares e imagens de tarefas
- **1 View**: View para cálculos de lucro líquido

## Ordem de Criação

A migração segue esta ordem para garantir dependências:

1. Enums (sem dependências)
2. Funções base
3. Tabelas base (profiles, team_invitations)
4. Tabelas CRM
5. Tabelas de Tarefas
6. Tabelas Financeiras
7. Tabelas Médicas
8. Tabelas de Reuniões
9. Tabelas Comerciais
10. Tabelas de Prospecção
11. Tabelas de Vendas
12. Tabelas de Configuração
13. Índices
14. Triggers
15. RLS Policies
16. Views
17. Storage Buckets

## Próximos Passos

Após a migração bem-sucedida:

1. ✅ Validar todas as estruturas
2. ✅ Testar funcionalidades principais
3. ✅ Migrar dados (se necessário)
4. ✅ Atualizar variáveis de ambiente
5. ✅ Atualizar documentação do projeto
6. ✅ Fazer backup do novo banco

## Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs no Supabase Dashboard
2. Consulte a documentação do Supabase
3. Verifique se todas as dependências estão corretas
4. Execute validações passo a passo

## Notas Importantes

- ⚠️ **Backup**: Sempre faça backup antes de executar migrações em produção
- ⚠️ **Downtime**: A migração pode causar downtime temporário
- ⚠️ **Dados**: Este script cria apenas a estrutura, não migra dados
- ⚠️ **Teste**: Teste primeiro em ambiente de desenvolvimento

---

**Data de Criação**: 2025-01-20  
**Versão**: 1.0  
**Autor**: DashMed Pro Team


