# Guia de Migração Manual - Estrutura SQL

## ⚠️ Importante
- O Supabase CLI não conseguiu se conectar ao projeto por questões de permissões
- Vamos aplicar as migrações **MANUALMENTE** via SQL Editor
- Este guia mostra passo a passo como fazer

---

## 📋 Passo 1: Acessar o SQL Editor

Abra no navegador:
https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/sql/new

---

## 📋 Passo 2: Verificar Migrações Já Aplicadas

Copie e execute esta query no SQL Editor:

```sql
-- Verificar se a tabela de migrações existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'supabase_migrations'
  AND table_name = 'schema_migrations'
) as migration_table_exists;

-- Se retornar TRUE, listar migrações aplicadas:
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

**Anote quais migrações JÁ estão aplicadas** (coluna `version`).

---

## 📋 Passo 3: Aplicar Migrações Faltantes

Para cada migração **NÃO listada** no resultado acima, siga este processo:

### Ordem Cronológica das Migrações (38 total):

#### GRUPO 1: Migrações Base (Set 2024) - 5 migrações
1. `20250924071317_b3eaffcc-6e54-4e68-9b3b-22d6c7db690c.sql`
2. `20250924073939_0064ce7b-5a60-4d25-af34-69d29b47cc4e.sql`
3. `20250924074042_58cd3e69-e0d6-4b19-ab50-f545c5169599.sql`
4. `20250924074112_280f23a8-349c-444a-9cf8-b4d63b8cb332.sql`
5. `20250924074837_944a9c73-49c9-41ca-99db-8b98afb273a6.sql` ⭐ **CRÍTICA: Cria profiles**

#### GRUPO 2: Sistema de Tarefas (Set 2024) - 5 migrações
6. `20250929100000_create_tasks_table.sql`
7. `20250929200000_fix_tasks_table.sql`
8. `20250929210000_fix_tasks_foreign_keys.sql`
9. `20250930050636_29b975fa-32c4-4637-a758-5b246873b458.sql`
10. `20250930145457_fbfdf5c8-2e80-4a50-8dd2-faed7a6276e7.sql`

#### GRUPO 3: CRM e Vendas (Out 2024) - 5 migrações
11. `20251007072408_410298d8-70d0-4486-9438-eebfc7fa9a48.sql`
12. `20251008172249_33dec0e2-87a1-4747-839b-d224712d0b42.sql`
13. `20251008174527_a6efa3ea-5ed3-46d7-ae76-24de5be97010.sql`
14. `20251009032321_ce1f98b2-8474-4d27-8214-68ccf6040a43.sql` ⭐ **CRÍTICA: Storage + Follow-ups**
15. `20251009033310_b03a0510-ad02-4eab-a1e6-24f3c22e175b.sql`

#### GRUPO 4: Relatórios e Permissões (Out 2024) - 2 migrações
16. `20251011000000_add_daily_report_pause_and_default_goals.sql`
17. `20251011000001_restrict_financial_access_for_vendedor.sql`

#### GRUPO 5: Integrações CRM (Jan 2025) - 9 migrações
18. `20250101000000_integrate_crm_tasks.sql`
19. `20250107000000_add_transaction_costs.sql`
20. `20250107000001_update_crm_rls_policies.sql`
21. `20250110000001_allow_admin_dono_edit_deals.sql`
22. `20250110000002_cleanup_duplicate_crm_deals_policies.sql`
23. `20250110000003_create_sales_calls_table.sql`
24. `20250111000001_add_final_counters_to_daily_reports.sql`
25. `20250111000002_add_foreign_key_to_prospecting_daily_reports.sql`
26. `20250113000001_fix_sales_calls_contacts_permissions.sql`

#### GRUPO 6: Refatoração Completa (Dez 2024) - 10 migrações
27. `20251213221208_cefa9568-d499-4d56-940e-c5c8d55b1fcf.sql` ⭐⭐ **SUPER CRÍTICA: Recria TUDO**
28. `20251213221235_0ddeeb88-1480-4e21-8859-1167ae32a5f1.sql`
29. `20251213221307_f1338e35-43ce-4160-8a45-c43d76a5d540.sql`
30. `20251213221327_f42c3f16-f209-4463-a75a-d4e3ad3d580b.sql`
31. `20251213221358_38644b48-6961-4754-959b-ad07e0d730c1.sql`
32. `20251213221423_d102a6ef-9561-42b3-ba4d-8589c2dc6a5b.sql`
33. `20251213221448_a98d5219-cd1b-4954-89bd-7f51ae6a48ee.sql`
34. `20251213221749_882976f3-bdd4-4cbf-8aaa-a36ebcd40e29.sql`
35. `20251213221821_ea17eb54-3856-489e-a7ab-2b6285729b59.sql`
36. `20251213221844_281a39e7-d126-4254-9acc-d7a52cbf5051.sql`
37. `20251213221907_1505829d-ec17-4fa0-8f50-6488284c3627.sql`

#### GRUPO 7: Configuração Admin (Jan 2025) - 1 migração
38. `20250120000000_update_user_to_admin.sql` ⭐⭐⭐ **APLICAR POR ÚLTIMO**

---

## 📋 Passo 4: Como Aplicar Cada Migração

Para **CADA** migração faltante (em ordem cronológica):

### 4.1. Abrir o arquivo local
Navegue para: `e:\dashmedpro-main\dashmedpro\supabase\migrations\<nome-da-migracao>.sql`

### 4.2. Copiar TODO o conteúdo do arquivo

### 4.3. Colar no SQL Editor
No navegador, cole o conteúdo no SQL Editor

### 4.4. Executar
Clique em "Run" ou pressione Ctrl+Enter

### 4.5. Verificar resultado
- ✅ **Se executou com sucesso:** Parabéns! Vá para a próxima migração
- ⚠️ **Se deu erro "already exists":** A migração já foi aplicada. Pule para a próxima
- ❌ **Se deu outro erro:** Anote o erro e continue lendo este guia

---

## 📋 Passo 5: Tratamento de Erros Comuns

### Erro: "relation already exists"
```
ERROR: relation "nome_tabela" already exists
```
**Solução:** Esta tabela já foi criada. Pule esta migração.

### Erro: "type already exists"
```
ERROR: type "app_role" already exists
```
**Solução:** Este tipo ENUM já foi criado. Pule esta migração.

### Erro: "policy already exists"
```
ERROR: policy "policy_name" for table "table_name" already exists
```
**Solução:** Execute esta query antes de re-executar a migração:
```sql
DROP POLICY IF EXISTS "nome_da_policy" ON public.nome_tabela;
```

### Erro: "column does not exist"
```
ERROR: column "nome_coluna" does not exist
```
**Solução:** Uma migração anterior pode não ter sido aplicada. Volte e aplique as migrações anteriores primeiro.

### Erro: "foreign key violation"
**Solução:** Uma tabela referenciada ainda não foi criada. Aplique as migrações na ordem correta.

---

## 📋 Passo 6: Aplicar Migração Final (OBRIGATÓRIO)

**Depois de aplicar TODAS as outras migrações**, aplique a última:

1. Abrir arquivo: `e:\dashmedpro-main\dashmedpro\supabase\migrations\20250120000000_update_user_to_admin.sql`
2. Copiar TODO o conteúdo
3. Colar no SQL Editor
4. Executar

Esta migração é **ADAPTATIVA** - ela detecta automaticamente a estrutura do banco e:
- Cria o perfil do usuário filipesenna59@gmail.com se não existir
- Atualiza o nome para "Filipe"
- Define o role como "admin"
- Funciona tanto com a estrutura antiga (role na tabela profiles) quanto nova (tabela user_roles separada)

---

## 📋 Passo 7: Validar Estrutura

Execute estas queries de validação:

```sql
-- 1. Contar tabelas criadas
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- ✅ Esperado: 25-30 tabelas

-- 2. Verificar RLS habilitado
SELECT COUNT(*) as tabelas_com_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- ✅ Todas as tabelas devem ter RLS

-- 3. Contar policies
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
-- ✅ Esperado: 50+ policies

-- 4. Verificar functions críticas
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('has_role', 'get_user_role', 'handle_new_user');
-- ✅ Devem existir todas 3

-- 5. Verificar enums
SELECT typname
FROM pg_type
WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;
-- ✅ Deve retornar: app_role ou user_role

-- 6. Verificar usuário admin
SELECT p.email, p.full_name, p.is_active,
       ur.role as role_user_roles
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'filipesenna59@gmail.com';
-- ✅ Esperado: filipesenna59@gmail.com | Filipe | true | admin

-- 7. Verificar storage bucket
SELECT * FROM storage.buckets;
-- ✅ Deve existir: task-images
```

---

## 📋 Passo 8: Testar Aplicação

```bash
cd e:\dashmedpro-main\dashmedpro
npm run dev
```

Acessar: http://localhost:5173

### Checklist de Testes:
- [ ] Login com filipesenna59@gmail.com funciona
- [ ] Dashboard carrega sem erros no console
- [ ] Criar nova tarefa funciona
- [ ] Criar novo contato CRM funciona
- [ ] Criar novo deal funciona
- [ ] Team Management está acessível (menu lateral)
- [ ] Avatar e nome "Filipe" aparecem no header
- [ ] Editar usuário funciona (Team Management)

---

## 🚨 Estratégia Simplificada (SE HOUVER MUITOS ERROS)

Se você estiver tendo muitos erros aplicando migração por migração, existe uma **estratégia alternativa**:

### Aplicar APENAS a Migração Base Completa

A migração `20251213221208_cefa9568-d499-4d56-940e-c5c8d55b1fcf.sql` é uma **refatoração completa** que recria TODA a estrutura do banco do zero.

**Passo alternativo:**

1. **Fazer backup do banco atual** (se tiver dados importantes):
   ```sql
   -- No SQL Editor, verificar se há dados
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM crm_deals;
   SELECT COUNT(*) FROM tasks;
   ```

2. **Se o banco estiver VAZIO ou com poucos dados de teste:**
   - Aplicar APENAS a migração: `20251213221208_cefa9568-d499-4d56-940e-c5c8d55b1fcf.sql`
   - Depois aplicar: `20250120000000_update_user_to_admin.sql`
   - Testar a aplicação

3. **Validar** conforme Passo 7 acima

Esta estratégia é mais arriscada, mas pode ser mais rápida se o banco estiver vazio ou se você está tendo muitos conflitos.

---

## ✅ Checklist Final

```
ANTES DE COMEÇAR:
[ ] SQL Editor aberto: https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/sql/new
[ ] Lista de migrações já aplicadas anotada

APLICAÇÃO:
[ ] Migrações aplicadas em ordem cronológica
[ ] Migração 20250120000000_update_user_to_admin.sql aplicada por último
[ ] Todos os erros foram resolvidos ou ignorados (se "already exists")

VALIDAÇÃO:
[ ] 25+ tabelas criadas
[ ] RLS habilitado em todas as tabelas
[ ] Functions has_role, get_user_role, handle_new_user existem
[ ] Enum app_role ou user_role existe
[ ] Usuário filipesenna59@gmail.com tem role admin
[ ] Profile tem full_name = "Filipe"
[ ] Storage bucket task-images existe

TESTES:
[ ] Login funciona
[ ] Dashboard carrega
[ ] Criar tarefa funciona
[ ] Criar contato CRM funciona
[ ] Team Management acessível
[ ] Avatar e nome aparecem no header
```

---

## 💡 Dicas Importantes

1. **Sempre aplique em ordem cronológica** - As migrações têm dependências entre si

2. **Não se preocupe com "already exists"** - Significa que aquela parte já foi aplicada

3. **Anote os erros** - Se houver erros além de "already exists", anote para análise

4. **Faça uma migração por vez** - Não tente copiar múltiplas migrações de uma vez

5. **Teste após cada GRUPO** - Aplique um grupo, teste a aplicação, depois passe para o próximo

6. **A migração 20250120000000 é segura** - Ela detecta a estrutura e se adapta automaticamente

7. **Backup é seu amigo** - Se algo der muito errado, o Supabase mantém backups automáticos em:
   https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/database/backups

---

## 📞 Próximos Passos

Após concluir todas as migrações e testes:

1. Marcar este guia como concluído
2. Atualizar documentação do projeto
3. Considerar configurar backups automáticos
4. Monitorar logs de erro na aplicação

Boa sorte! 🚀
